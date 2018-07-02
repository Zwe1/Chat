const { app } = require('electron');
const fs = require('fs-extra');
const ROOT_PATH = getUserDir();
const DB_FOLDER = 'User Files';
let userFilesPath = `${ROOT_PATH}/${DB_FOLDER}`;

module.exports.clearCache = function (callback) {

  fs.readdir(userFilesPath, function (err, data) {
    if (err) {
      console.log('读取文件失败', err);
    } else {
      rmFile(data, 'root.json');
      callback();
    }
  })
};

function rmFile(filelist, exceptFile) {
  filelist.forEach(function (path) {
    if (path !== exceptFile) {
      const curPath = `${userFilesPath}/${path}`;

      fs.remove(curPath)
        .then(() => {
          console.log('delete' + curPath + 'success!');
        })
        .catch(err => {
          console.log('delete' + curPath + 'fail!', err);
        })
    }
  })
}

function getUserDir() {
  return app.getPath('userData');
}