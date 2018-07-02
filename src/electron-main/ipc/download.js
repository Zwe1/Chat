const { ipcMain } = require('electron');
const is = require('electron-is');

const { getMainWindow } = require('./util');

// 下载文件
let dlevt;
let savePath;

module.exports.initDownload = function (mainWindow) {

  ipcMain.on('download', (evt, path) => {
    mainWindow.webContents.downloadURL(path.dlpath);
    dlevt = evt;
    savePath = path.savePath;
  });

// app.getPath('downloads')
  mainWindow.webContents.session.on('will-download', (event, item) => {
    // let filePath = `${__dirname}/${item.getFilename()}`;
    //item.setSavePath(app.getPath('downloads') );

    // const totalBytes = item.getTotalBytes();

    // 不设置 savePath 就自动弹出保存对话框
    // const filePath = path.join(app.getPath('downloads'), item.getFilename());
    // item.setSavePath(filePath);
    const totalBytes = item.getTotalBytes();

    item.on('updated', (event, state) => {
      if (state === 'interrupted') {
        console.log('Download is interrupted but can be resumed')
      } else if (state === 'progressing') {
        if (item.isPaused()) {
          console.log('Download is paused ----------');
        } else {
          console.log(`Received bytes: ${item.getReceivedBytes()}`);
          dlevt.sender.send('download-progress', item.getReceivedBytes() / totalBytes);
        }
      }
    });

    item.once('done', (event, state) => {
      if (state === 'completed') {
        console.log('Download successfully', item.getSavePath());
        dlevt.sender.send('download-completed', item.getSavePath());
      } else if (state === 'cancelled') {
        console.log('download is cancelled ---------');
        dlevt.sender.send('download-cancelled');
      } else {
        console.log(`Download failed: ${state}`);
      }
    });
  });
};
