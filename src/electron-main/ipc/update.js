const { ipcMain, app, shell } = require('electron');
const is = require('electron-is');

const path = require('path');
const fs = require('fs');
const os = require('os');
const request = require('request');
const progress = require('request-progress');

const isDevelopment = is.dev();

const { createWindow } = require('../windowUtil');

exports.initUpdate = (prefix) => {
  // 打开 更新页面
  ipcMain.on('change-to-update-page', (event, args) => {
    // console.log('version info:', args);
    const { serverVersion } = args;

    const updateUrl = isDevelopment
      ? `${prefix}/update.html`
      : `${prefix}/client/main/updateivew`;
    // const updateUrl = `${isDevelopment ? debugUrl : globalRootUrl}/update.html`;

    const updateWin = createWindow({
      size: [640, 320],
      url: updateUrl,
      oliType: 'updateModal',
      isDev: false,
      autoShow: false,
      autoHideMenuBar: true,
      frame: true
    });

    updateWin.setResizable(false);

    updateWin.once('ready-to-show', () => {
      console.log('show update window');
      updateWin.show();
      updateWin.webContents.send('send-version-info', args);
      
      const extMap = {
        'darwin': '.dmg',
        'win32': '.exe'
      };
      
      const newFileName = `e-mobile ${serverVersion}`;
      let destPath = path.join(app.getPath('userData'), newFileName);
      destPath += extMap[os.platform];

      // 安装
      ipcMain.on('install-update-after-download', (event) => {
        fs.stat(destPath, function(err, stat) {
          if (err) {

          }

          if (stat && stat.isFile()) {
            shell.openItem(destPath);
            app.quit();
            return;
          }

          event.sender.send('install-update-no-file', '升级文件不存在，请下载！');
        });
      });

      // 开始下载
      ipcMain.on('update-download-start', (event, url) => {
        const osMap = {
          'darwin': 'mac',
          'win32': 'win',
        };

        const platform = osMap[os.platform];
        console.log('platform:', platform, os.platform);

        if (!platform) {
          return;
        }
      
        // const realUrl = `${url}?type=1&os=${platform}`;
        const realUrl = 'http://192.168.82.163:1337/download/0.9.1/windows_64/e-mobile%20Setup%200.9.1.exe';
        console.log('download url:', realUrl);

        progress(request(realUrl), { delay: 500 })
          .on('progress', (state) => {
            // The state is an object that looks like this:
            // {
            //     percent: 0.5,               // Overall percent (between 0 to 1)
            //     speed: 554732,              // The download speed in bytes/sec
            //     size: {
            //         total: 90044871,        // The total payload size in bytes
            //         transferred: 27610959   // The transferred payload size in bytes
            //     },
            //     time: {
            //         elapsed: 36.235,        // The total elapsed seconds since the start (3 decimals)
            //         remaining: 81.403       // The remaining seconds to finish (3 decimals)
            //     }
            // }

            console.log('progress', state);
            updateWin.webContents.send('update-download-progress', state);
          })
          .on('error', (err) => {
            console.log('error', err);
            updateWin.webContents.send('update-download-error', err);
          })
          .on('end', () =>  {
            console.log('download finish');
            updateWin.webContents.send('update-download-finish');
          })
          .pipe(fs.createWriteStream(destPath));
      });
    });
  });
}