const { ipcMain } = require('electron');
const request = require('request');
const progress = require('request-progress');

exports.initDownloadVoice = function () {
  ipcMain.on('download-voice', (e, args) => {
    const { url } = args;
  });
};