const is = require('electron-is');
const isDevelopment = is.dev();

const { createWindow } = require('../windowUtil');

const config = require('../em-config.json');

function cachePicturePreviewWindow(prefix) {
  const picUrl = isDevelopment
    ? `${prefix}/pic-preview.html`
    : `${prefix}/client/main/picpreview`;

  const size = config.size;
  return createWindow({
    size,
    url: picUrl,
    oliType: 'picModal',
    autoShow: false,
    isDev: false,
  });
}

function cacheCustomUrlWindow(prefix) {
  // 自定义链接配置窗口并打开，隐藏
  const customSize = config[ 'customSize' ];
  const customUrl = `${prefix}/#/modal/custom`;

  return createWindow({
    size: customSize,
    url: customUrl,
    oliType: 'customModal',
    autoShow: false,
  });
}

function cacheWorkWindow(prefix) {
  // 工作台配置窗口并打开，隐藏
  const appSize = config[ 'appSize' ];
  const workUrl = `${prefix}/#/modal/app`;

  return createWindow({
    size: appSize,
    url: workUrl,
    oliType: 'workModal',
    autoShow: false,
  });
}

function cacheLinkWindow(prefix) {
  // 链接型消息窗口打开，隐藏
  const linkSize = config[ 'linkSize' ];
  const linkUrl = `${prefix}/#/modal/link`;

  return createWindow({
    size: linkSize,
    url: linkUrl,
    oliType: 'linkModal',
    autoShow: false,
  });
}

function cacheHistoryMessageWindow(prefix) {
  // 历史消息窗口打开，隐藏
  const histroyMessageSize = config[ 'histroyMessageSize' ];
  const histroyMessageUrl = `${prefix}/#/modal/history-message`;

  return createWindow({
    size: histroyMessageSize,
    url: histroyMessageUrl,
    oliType: 'histroyMessageModal',
    autoShow: false,
  });
}

module.exports.initCustomUrlWindow = cacheCustomUrlWindow;
module.exports.initWorkWindow = cacheWorkWindow;
module.exports.initPicturePreviewWindow = cachePicturePreviewWindow;
module.exports.initLinkWindow = cacheLinkWindow;
module.exports.initHistoryMessageWindow = cacheHistoryMessageWindow;

module.exports.initCacheWindows = function (prefix) {
  cacheCustomUrlWindow(prefix);
  // cachePicturePreviewWindow(prefix);
  cacheWorkWindow(prefix);
  cacheLinkWindow(prefix);
  cacheHistoryMessageWindow(prefix);
};





