const fs = require('fs-extra');
var path = require('path');

let fileToCopy = [
  'entry.js',
  'package.json'
];

let folderToCopy = [
  'electron-main',
];

let rootPath = path.join(__dirname, '..');

let distPath = path.join(rootPath, 'app');
let buildPath = path.join(rootPath, 'build');
let srcPath = path.join(rootPath, 'src');

function copyFolder(start, dist) {
  fs.copySync(start, dist, { dereference: true });
}

function copyFile(sourceFile, destPath) {
  fs.copy(sourceFile, destPath, { dereference: true });
}

folderToCopy.forEach(folder => {
  let start = path.join(srcPath, folder);
  copyFolder(start, path.join(distPath, folder));
});

fileToCopy.forEach(file => {
  let start = path.join(srcPath, file);
  copyFile(start, path.join(distPath, file));
});


copyFile(path.join(buildPath, 'url-input.html'), path.join(distPath, 'url-input.html'));
copyFile(path.join(buildPath, 'js/url-input.js'), path.join(distPath, 'js/url-input.js'));
copyFolder(path.join(buildPath, 'media'), path.join(distPath, 'media'));