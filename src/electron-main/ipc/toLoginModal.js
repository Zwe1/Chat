const { ipcMain } = require('electron');
const { getMainWindow, getLoginWindow } = require('./util');

module.exports.initRedirectToLoginModal = function () {
  ipcMain.on('redirect-to-login-modal', () => {
    // 隐藏追窗口
    let dummy = getMainWindow();
    if (dummy) {
      dummy.close();
      dummy = null;
    }

    // 再次加载登录页面
    const loginWindow = getLoginWindow();
    loginWindow.show();
  });
};