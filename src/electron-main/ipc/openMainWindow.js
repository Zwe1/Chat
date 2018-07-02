const { ipcMain } = require('electron');
const is = require('electron-is');

const { getLoginWindow } = require('./util');

const config = require('../em-config.json');

module.exports.initOpenMainWindow = function () {

  ipcMain.on('open-main-window', (event, args) => {
    const [ width, height ] = config.size;
    console.log('open main window.......');

    let loginWin = getLoginWindow();
    if (loginWin) {
      console.log('login window exist.');

      loginWin.oliType = 'mainModal';
      
      loginWin.setResizable(true);
      loginWin.setSize(width, height, true);
      loginWin.setMinimumSize(width, height);

      event.sender.send('main-window-opened', 'success');
    }
  });
};
