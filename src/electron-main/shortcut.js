const { globalShortcut, BrowserWindow } = require('electron');
const { getMainWindow } = require('./ipc/util');

const { screenCutFun } = require('./ipc/screenCut');

const path = require('path');

let activeModalKey = '';
let screenCutKey = '';
let searchKey = '';

exports.initToggleDevTools = function () {
  // 打开 网页调试工具的快捷键
  globalShortcut.register('CommandOrControl+Alt+D', () => {
    console.log('open or close dev tool via global short cut');
    
    let currentWin = BrowserWindow.getFocusedWindow();
    if (!currentWin) {
      return;
    }
    
    const contents = currentWin.webContents
    contents.toggleDevTools();
  });

  globalShortcut.register('CommandOrControl+R', () => {
    console.log('reload app via global short cut');
    
    let currentWin = BrowserWindow.getFocusedWindow();
    if (!currentWin) {
      return;
    }
    
    const contents = currentWin.webContents
    contents.reload();
  });
};

exports.activeModal = function (key) {
  if (key === '') {
    if (!activeModalKey) {
      return;
    }
    globalShortcut.unregister(activeModalKey);
    return;
  }

  activeModalKey = key;

  globalShortcut.register(key, () => {
    const mainWin = getMainWindow();

    mainWin.show();
  });
}

exports.screenCut = function (key, hidden, event) {
  if (key === '') {
    if (!screenCutKey) {
      return;
    }
    globalShortcut.unregister(screenCutKey);
    return;
  }

  screenCutKey = key;

  globalShortcut.register(key, () => {
    screenCutFun(hidden, event);
  });
}

exports.search = function (key, event) {
  if (key === '') {
    if (!searchKey) {
      return;
    }
    globalShortcut.unregister(searchKey);
    return;
  }

  searchKey = key;
  
  globalShortcut.register(key, () => {
    event.sender.send('search-success', {});
  });
}