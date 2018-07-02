const path = require('path');
const { ipcMain, shell, clipboard, BrowserWindow } = require('electron');
const is = require('electron-is');

const { getMainWindow } = require('./util');

module.exports.initScreenCut = function (tray) {
  ipcMain.on('screen-cut', function(event, hidden) {
    console.log('screen-cut', event, hidden);
    screenCutF(hidden, event);
  });
};

const screenCutF = function (hidden, event) {
  console.log('screen cut event:', event);

  // 截图工具只支持 window
  if (is.windows()) {
    const cutToolPath = path.join(__dirname, '..', 'exe/screen-cut.exe');
    clipboard.clear();

    if (hidden) {
      const mainWin = getMainWindow();
      mainWin.once('minimize', () => {
        setTimeout(() => shell.openItem(cutToolPath), 200);
      });
      mainWin.minimize();
    } else {
      shell.openItem(cutToolPath);
    }

    try {
      let getImgInterval;

      if (getImgInterval) {
        clearInterval(getImgInterval);
        getImgInterval = null;
      }

      getImgInterval = setInterval(function () {
        const image = clipboard.readImage();
        if (!image.isEmpty()) {
          event.sender.send('screen-cut-success', image.toDataURL());
           
          clearInterval(getImgInterval);
        }
      }, 300);
    } catch (err) {
      console.log('read clipboard content error~', err);
    }
  }
}

exports.screenCutFun = screenCutF;
