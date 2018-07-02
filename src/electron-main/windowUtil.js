const { BrowserWindow } = require('electron');

/**
 * url, size, onClose, oliType, isDev
 *
 * @param options
 */
exports.createWindow = function createWindow(options) {
  const {
    size = [ 320, 240 ],
    url,
    onClose,
    oliType,
    isDev = false,
    autoShow = true,
    frame = false,
  } = options;

  const [ width, height ] = size;

  const windowOptions = {
    width,
    minWidth: width,
    height,
    minHeight: height,
    autoHideMenuBar: true,
    transparent: false,
    frame,
    show: false,
    webPreferences: {
      plugins: true,
      webSecurity: false
    },
  };

  const mainWindow = new BrowserWindow(windowOptions);
  if (isDev) {
    mainWindow.webContents.openDevTools();
    require('devtron').install();
  }

  if (oliType) {
    mainWindow.oliType = oliType;
  }

  if (onClose) {
    mainWindow.on('closed', onClose);
  }

  mainWindow.loadURL(url);
  // 是不是默认显示
  if (autoShow) {
    mainWindow.show();
  }

  return mainWindow
};