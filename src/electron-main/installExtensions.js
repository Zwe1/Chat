const { BrowserWindow }= require('electron');
const path = require('path');

//function getPath() {
//  const savePath = (remote || electron).app.getPath('userData');
//  return path.resolve(`${savePath}/extensions`);
//}

//import downloadChromeExtension from './downloadChromeExtension';
//import { getPath } from './utils';

//const { BrowserWindow } = remote || electron;

//let IDMap = {};
//const IDMapPath = path.resolve(getPath(), 'IDMap.json');
//if (fs.existsSync(IDMapPath)) {
//  try {
//    IDMap = JSON.parse(fs.readFileSync(IDMapPath, 'utf8'));
//  } catch (err) {
//    console.error('electron-devtools-installer: Invalid JSON present in the IDMap file');
//  }
//}

module.exports = function install() {
  let extensionFolder = path.join(__dirname, 'extensions', 'chrome-extension');
  console.log('extensionFolder', extensionFolder);

  const name = BrowserWindow.addDevToolsExtension(extensionFolder);
  console.log('extension name', name);
};