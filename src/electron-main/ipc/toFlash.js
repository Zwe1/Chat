const path = require('path');
const { BrowserWindow, ipcMain, app } = require('electron');
const is = require('electron-is');

let iconPath = path.join(__dirname , '..', 'images/logo.png');
let emptyIconPath = path.join(__dirname, '..', 'images/empty.png');

class TrayControl {

  constructor(tray) {
    this.timer = null;
    this.tray = tray;
  }

  toFlash() {
    // console.log(' ---- to flash.');

    let current = BrowserWindow.getFocusedWindow();
    if (current) {
      // console.log(' ---- inner to flash.');
      current.flashFrame(true);
    }

    // mac
    if (is.osx()) {
      app.dock.bounce('critical');
    }

    if (this.timer) {
      this.cancelFlash();
    }

    let isEmpty = false;
    this.timer = setInterval(() => {
      this.tray.setImage(isEmpty ? iconPath : emptyIconPath);
      isEmpty = !isEmpty;
    }, 300);
  }

  cancelFlash() {
    let current = BrowserWindow.getFocusedWindow();
    if (current) {
      // console.log(' ---- cancel to flash.');
      current.flashFrame(false);
    }

    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      this.tray.setImage(iconPath);
    }
  }

}

let flashControl;

module.exports.initIpcFlash = function initIpcFlash(tray) {
  flashControl = new TrayControl(tray);

  ipcMain.on('receive-new-message-to-flash', function (event) {
    flashControl.toFlash();
  });

  ipcMain.on('cancel-tray-flash', function (event) {
    flashControl.cancelFlash();
  });

  return flashControl;
};