const { BrowserWindow } = require('electron');

exports.getCurrentWindow = () => {
  return BrowserWindow.getFocusedWindow();
};

exports.getMainWindow = () => {
  return BrowserWindow.getAllWindows().filter(win => win.oliType === 'mainModal')[ 0 ];
};

exports.getLoginWindow = () => {
  return BrowserWindow.getAllWindows().filter(win => win.oliType === 'loginModal')[ 0 ];
};

exports.getWorkWindow = () => {
  return BrowserWindow.getAllWindows().filter(win => win.oliType === 'workModal')[ 0 ];
};

/**
 * burn
 * @param type
 * @returns {Array.<BrowserWindow>}
 */
exports.getWindowsByOliType = (type) => {
  return BrowserWindow.getAllWindows().filter(win => win.oliType === type);
};
