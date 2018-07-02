const path = require('path');
const {
  BrowserWindow,
  Menu,
  app,
  Tray,
  ipcMain,
  session,
} = require('electron');

const is = require('electron-is');

const isDevelopment = is.dev();

// const menubar = require('./electron-main/TrayPopup');
const config = require('./electron-main/em-config.json');

const { initExpress } = require('./electron-main/express');
const { createWindow } = require('./electron-main/windowUtil');
const { initScreenCut } = require('./electron-main/ipc/screenCut');
const { clearCache } = require('./electron-main/ipc/clearCache');
const { initOpenMainWindow } = require('./electron-main/ipc/openMainWindow');
const { initIpcFlash } = require('./electron-main/ipc/toFlash');
const { initDownload } = require('./electron-main/ipc/download');
const { initUpdate } = require('./electron-main/ipc/update');

const { logInfo, logError } = require('./electron-main/log');

const { 
  initToggleDevTools,
  activeModal,
  screenCut,
  search
} = require('./electron-main/shortcut');
const {
  initCacheWindows,
  initCustomUrlWindow,
  initWorkWindow,
  initPicturePreviewWindow,
  initLinkWindow,
  initHistoryMessageWindow
} = require('./electron-main/ipc/cacheWindow');

const {
  getWindowsByOliType,
  getCurrentWindow,
  getMainWindow
} = require('./electron-main/ipc/util');

let iconPath = path.join(__dirname, 'electron-main/images/logo_16.png');

let globalRootUrl = '';

const debugUrl = config.dev_url;
const urlInputPath = '/url-input.html';

/**
 * singleton window
 *
 * @type {null}
 */
let mainWindow = null;
let tray = null; // 任务栏图标
let flashControl; // 控制图标闪烁

function initTray() {
  tray = new Tray(iconPath);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示窗口',
      click: function () {
        mainWindow.show();
        mainWindow.setSkipTaskbar(false);
      }
    },
    {
      label: '清理缓存',
      click: function () {
        clearCache(function () {
          mainWindow.webContents.reload();
        });
      }
    },
    {
      label: '注销',
      click: function () {
        mainWindow.webContents.send('user-logout');
        logInfo('user logout');
        setTimeout(() => {
          app.relaunch();
          app.quit();
        }, 100);
      }
    },
    {
      label: '退出',
      click: function () {
        mainWindow.webContents.send('user-logout');
        setTimeout(() => {
          let allWindows = BrowserWindow.getAllWindows();
          allWindows.forEach(win => win.close());
        }, 100);
      }
    },
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.show(); // 如果显示了，也显示一边
      // mainWindow.hide();
      // mainWindow.setSkipTaskbar(true);
    } else {
      // 如果隐藏了，显示
      mainWindow.show();
      mainWindow.setSkipTaskbar(false);
    }
  });

  tray.on('mouse-enter', () => {
    logInfo('mouse enter');
  });

  tray.on('balloon-show', () => {
    logInfo('balloon show');
  });

  // mainWindow.on('show', () => {
  //   tray.setHighlightMode('always')
  // });

  // mainWindow.on('hide', () => {
  //   tray.setHighlightMode('never')
  // });

  // let mb = menubar({
  //   dir: path.resolve(__dirname, 'electron-main', 'menubar'),
  //   tray: tray
  // });

  // mb.on('ready', function () {
  //   logInfo('app is ready~');
  // });

  // mb.on('double-click', function () {
  //   mainWindow.show();
  //   mainWindow.setSkipTaskbar(false);
  //   flashControl.cancelFlash();
  // });
}

function initIpc() {
  flashControl = initIpcFlash(tray);
  initScreenCut();
  initDownload(mainWindow);


  ipcMain.on('open-dev-panel', (event, args) => {
    mainWindow.webContents.openDevTools();
    require('devtron').install();
  });

  ipcMain.on('change-to-login-page', (event, args) => {
    const {
      loginUrl,
      indexUrl
    } = args;
    
    const urlPrefix = isDevelopment ? debugUrl : indexUrl;

    // 加载登陆界面
    mainWindow.oliType = 'loginModal';
    mainWindow.loadURL(loginUrl);

    mainWindow.webContents.once('did-frame-finish-load', () => {
      initOpenMainWindow();

     
      initCacheWindows(urlPrefix);

      // 退出
      ipcMain.on('app-quit', event => {
        app.quit();
      });

      // 工作台
      ipcMain.on('open-workBench', event => {
        const dummy = getWindowsByOliType('workModal');

        let modal;
        // 已经存在这个窗口
        if (dummy.length >= 1) {
          modal = dummy[ 0 ];
        }

        if (!modal) {
          modal = initWorkWindow(urlPrefix);
        }

        modal.show();
        modal.focus();
      });

      // 自定义链接
      ipcMain.on('open-custom', (event, args) => {
        const { custom } = args;

        const dummy = getWindowsByOliType('customModal');
        let modal;
        // 已经存在这个窗口
        if (dummy.length >= 1) {
          modal = dummy[ 0 ];
        }

        if (!modal) {
          modal = initCustomUrlWindow(urlPrefix);
        }

        modal.webContents.executeJavaScript(`window.custom = ${JSON.stringify(custom)}`);
        modal.webContents.send('new-custom');
        modal.show();
        modal.focus();
      });

      // 预览图片
      ipcMain.on("openPic", (sender, { url, filename }) => {
        const dummy = getWindowsByOliType('picModal');
        // logInfo(dummy);
        let modal;
        // 已经存在这个窗口
        if (dummy.length >= 1) {
          modal = dummy[ 0 ];
        }

        if (!modal) {
          modal = initPicturePreviewWindow(isDevelopment ? urlPrefix : url);

          modal.webContents.on('did-finish-load', function () {
            modal.show();
            modal.focus();
            modal.webContents.executeJavaScript(`window.filename = ${JSON.stringify(filename)}`);
            modal.webContents.send('new-filename');
          });
          sender.returnValue = filename;
          return
        }

        modal.show();
        modal.focus();
        modal.webContents.executeJavaScript(`window.filename = ${JSON.stringify(filename)}`);
        modal.webContents.send('new-filename');

        sender.returnValue = filename;
      });

      // 链接型消息
      ipcMain.on("openLink", (event, args) => {
        const dummy = getWindowsByOliType('linkModal');

        const { url } = args;

        let modal;
        // 已经存在这个窗口
        if (dummy.length >= 1) {
          modal = dummy[ 0 ];
        }

        if (!modal) {
          modal = initLinkWindow(urlPrefix);
        }

        modal.webContents.executeJavaScript(`window.linkUrl = ${JSON.stringify(url)}`);
        modal.webContents.send('new-link-url');
        modal.show();
        modal.focus();
      });

      // 历史消息
      ipcMain.on('historyMessage', (event, args) => {
        const dummy = getWindowsByOliType('histroyMessageModal');

        let modal;
        // 已经存在这个窗口
        if (dummy.length >= 1) {
          modal = dummy[ 0 ];
        }

        if (!modal) {
          modal = initHistoryMessageWindow(urlPrefix);
        }

        modal.show();
        modal.focus();
      });

      // 抖一抖
      ipcMain.on('shakeMainWindow', (event, args) => {

        const bounds = mainWindow.getBounds();

        mainWindow.show();
        mainWindow.focus();

        // 显示出来在抖动
        let shakeInterval = setInterval(() => {
          if(mainWindow.isFocused()) {
            clearInterval(shakeInterval);
            shakeInterval = null;

            // 抖动延迟
            setTimeout(() => {
              bounds.x -= 5;
              mainWindow.setBounds(bounds, true);

              setTimeout(() => {
                bounds.x += 10;
                mainWindow.setBounds(bounds, true);
              }, 15);
              
              setTimeout(() => {
                bounds.x -= 10;
                mainWindow.setBounds(bounds, true);
              }, 25);

              setTimeout(() => {
                bounds.x += 10;
                mainWindow.setBounds(bounds, true);
              }, 35);

              setTimeout(() => {
                bounds.x -= 10;
                mainWindow.setBounds(bounds, true);
              }, 45);

              setTimeout(() => {
                bounds.x += 10;
                mainWindow.setBounds(bounds, true);
              }, 55);

              setTimeout(() => {
                bounds.x -= 10;
                mainWindow.setBounds(bounds, true);
              }, 65);

              setTimeout(() => {
                bounds.x += 10;
                mainWindow.setBounds(bounds, true);
              }, 75);

              setTimeout(() => {
                bounds.x -= 10;
                mainWindow.setBounds(bounds, true);
              }, 85);

              setTimeout(() => {
                bounds.x += 10;
                mainWindow.setBounds(bounds, true);
              }, 95);

              setTimeout(() => {
                bounds.x -= 5;
                mainWindow.setBounds(bounds, true);
              }, 100);
            }, 80);
          }
        }, 100);

      });

      // 激活面板快捷键
      ipcMain.on('activeModal', (event, args) => {
        const { key } = args;
        activeModal(key);
      });

      // 截图快捷键
      ipcMain.on('screenCut', (event, args) => {
        const { key, hiddenWin } = args;
        screenCut(key, hiddenWin, event);
      });

      // 搜索快捷键
      ipcMain.on('search', (event, args) => {
        const { key } = args;
        search(key, event);
      });

      // 添加access_token
      ipcMain.on('addToken', (event, args) => {
        const { token, baseUrl } = args;

        const urlGet =  `${baseUrl}/emp/api/media/get*`
        const urlAuth = `${baseUrl}/emp/api/connect/oauth2/authorize*`;

        const filter = {
          urls: [ urlGet, urlAuth ],
        };

        session.defaultSession.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
          details.requestHeaders['access_token'] = token;

          callback({ requestHeaders: details.requestHeaders });
        });
      });
    });

    // goto login
    event.sender.send('change-to-login-page.success');
  });

  ipcMain.on('change-to-url-input-page', (event, args) => {
    // http://localhost:3001/url-input.html?autoJump=false
    const inputUrl = (isDevelopment ? debugUrl : globalRootUrl) + urlInputPath;

    // 加载登陆界面
    mainWindow.oliType = 'inputUrlModal';
    mainWindow.loadURL(`${inputUrl}?autoJump=${args.autoJump}`);

    // goto login
    event.sender.send('change-to-url-input-page.success');
  });

  ipcMain.on('exchange-user', (event, args) => {
    app.relaunch();
    app.quit();

    // let mainWin = getCurrentWindow() || getMainWindow();
    // if (mainWin) {
    //   const [width, height] = config.loginSize;

    //   mainWin.oliType = 'loginModal';
    //   mainWin.setMinimumSize(width, height);
    //   mainWin.setSize(width, height, true);
    //   mainWin.setResizable(false);

    //   // goto login
    //   event.sender.send('exchange-user-after-close-other', 'success');
    // }
  });

  initUpdate(isDevelopment ? debugUrl : globalRootUrl);
}

function initialize() {
  logInfo('begin initialize.');
  process.on('uncaughtException', (err) => {
    logError(err.stack);
  });

  app.on('ready', () => {
    logInfo('[app ready] isDebug:', isDevelopment);

    initToggleDevTools();
    initTray();

    const size = config.loginSize;
    if (isDevelopment) {
      mainWindow = createWindow({
        url: debugUrl + urlInputPath,
        size,
        isDev: isDevelopment
      });

      initIpc();
    } else {
      initExpress((url) => {
        globalRootUrl = url;

        // 登陆界面
        mainWindow = createWindow({
          url: url + urlInputPath,
          size,
          isDev: false
        });

        initIpc();
      }, __dirname);
    }
  });

  app.on('window-all-closed', () => {
    logInfo('all window closed.');
    app.quit();
  });
}

initialize();
