const os = require('os');
const path = require('path');
const { dialog } = require('electron');
const { autoUpdater } = require("electron-updater");
const log = require('electron-log');
const is = require('electron-is');

const { getMainWindow } = require('./windowUtil');

function sendStatusToWindow(text) {
  log.debug(text);
}

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'debug';

if (is.dev()) {
  const platform = os.platform() + '_' + os.arch();
  autoUpdater.setFeedURL({
    provider: 'generic',
    url: `http://192.168.82.163:1337/update/${platform}`,
    channel: 'latest'
  });
}

autoUpdater.on('checking-for-update', () => {
  sendStatusToWindow('Checking for update...');
});

autoUpdater.on('update-available', (ev) => {
  sendStatusToWindow('update availavle: ' + ev.version);
});

autoUpdater.on('update-not-available', () => {
  sendStatusToWindow('updata not available.');
});

autoUpdater.on('error', () => {
  sendStatusToWindow('error download.');
});

autoUpdater.on('download-progress', () => {
  sendStatusToWindow('Download progress...');
});

autoUpdater.on('update-downloaded', () => {
  sendStatusToWindow('update download finish.');

  const mainWindow = getMainWindow();
  if (mainWindow) {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      buttons: ['安装', '取消'],
      title: '更新可用~',
      message: '现在安装更新吗，已经下载好了',
      defaultId: 0,
      cancelId: 1
    }, function (response, checkboxChecked) {
      if (response === 0) {
        // 现在可以去安装了
        autoUpdater.quitAndInstall();
      }
    });
  }
});

// autoUpdater.checkForUpdatesAndNotify();
module.exports = autoUpdater;