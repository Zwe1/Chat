var path = require('path');
var events = require('events');
var fs = require('fs');

var electron = require('electron');
var extend = require('extend');
var app = electron.app;
var BrowserWindow = electron.BrowserWindow;


var Positioner = require('electron-positioner');
var is = require('electron-is');

let appPath = app.getAppPath();

const defaultOptions = {
  dir: appPath,
  windowPosition: is.osx() ? 'trayCenter' : 'trayBottomCenter',
  width: 200,
  height: 200
};

module.exports = function create(opts) {
  opts = extend(defaultOptions, opts);
  if (!opts.index) {
    opts.index = 'file://' + path.join(opts.dir, 'index.html');
  }

  if (!(path.isAbsolute(opts.dir))) {
    opts.dir = path.resolve(opts.dir);
  }

  var menubar = new events.EventEmitter();
  menubar.app = app;

  if (app.isReady()) {
    appReady();
  } else {
    app.on('ready', appReady);
  }

  return menubar;

  function appReady() {
    var cachedBounds;
    var clickToHide = true;

    menubar.tray = opts.tray;
    menubar.tray.on('click', handleClick);
    menubar.tray.on('double-click', handleDoubleClick);

    function handleDoubleClick() {
      menubar.emit('double-click');
    }

    function handleClick(e, bounds) {
      //console.log('tray click', menubar.window && menubar.window.isVisible());
      //if (e.altKey || e.shiftKey || e.ctrlKey || e.metaKey) {
      //  return hideWindow()
      //}

      // 已经显示了
      if (menubar.window && menubar.window.isVisible()) {
        clickToHide = true;
        return hideWindow();
      }

      if (clickToHide) {
        cachedBounds = bounds || cachedBounds;
        showWindow(cachedBounds);
      } else {
        clickToHide = true;
      }

      menubar.emit('click');
    }

    menubar.showWindow = showWindow;
    menubar.hideWindow = hideWindow;
    menubar.emit('ready');

    function createWindow() {
      menubar.emit('create-window');
      var defaults = {
        show: false,
        frame: false
      };

      var winOpts = extend(defaults, opts);
      menubar.window = new BrowserWindow(winOpts);
      menubar.window.setSkipTaskbar(true);
      menubar.window.on('blur', function () {
        hideWindow();
        clickToHide = false;

        emitBlur();
      });

      if (opts.showOnAllWorkspaces !== false) {
        menubar.window.setVisibleOnAllWorkspaces(true)
      }

      menubar.window.on('close', windowClear);
      menubar.window.loadURL(opts.index);

      menubar.positioner = new Positioner(menubar.window);
      menubar.emit('after-create-window');
    }

    function showWindow(trayPos) {
      //console.log('show window');

      if (!menubar.window) {
        createWindow();
      }

      menubar.emit('show');

      if (trayPos && trayPos.x !== 0) {
        // Cache the bounds
        cachedBounds = trayPos
      } else if (cachedBounds) {
        // Cached value will be used if showWindow is called without bounds data
        trayPos = cachedBounds
      } else if (menubar.tray.getBounds) {
        // Get the current tray bounds
        trayPos = menubar.tray.getBounds()
      }

      // Default the window to the right if `trayPos` bounds are undefined or null.
      var noBoundsPosition = null;
      if ((trayPos === undefined || trayPos.x === 0) && opts.windowPosition.substr(0, 4) === 'tray') {
        noBoundsPosition = (process.platform === 'win32') ? 'bottomRight' : 'topRight'
      }

      var position = menubar.positioner.calculate(noBoundsPosition || opts.windowPosition, trayPos);

      var x = (opts.x !== undefined) ? opts.x : position.x;
      var y = (opts.y !== undefined) ? opts.y : position.y;

      menubar.window.setPosition(x, y);
      menubar.window.show();
      menubar.emit('after-show');

      return;
    }

    function hideWindow() {
      //console.log('hide window');

      if (!menubar.window) {
        return
      }

      if (menubar.window.isVisible()) {
        //menubar.emit('hide')
        menubar.window.hide();
        //menubar.emit('after-hide')
      }
    }

    function windowClear() {
      delete menubar.window;
      menubar.emit('after-close');
    }

    function emitBlur() {
      menubar.emit('focus-lost');
    }
  }
};
