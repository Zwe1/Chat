import React from 'react';
import ReactDOM from 'react-dom';

import moment from 'moment';
import zhLocale from 'moment/locale/zh-cn';

//import createBrowserHistory from 'history/createBrowserHistory';
import createHashHistory from 'history/createHashHistory';
import { Router } from 'react-router';
import { RouterStore, syncHistoryWithStore } from 'mobx-react-router';
import { Switch, Route } from 'react-router-dom';

import { useStrict } from 'mobx';
import { Provider } from 'mobx-react';
import { enableLogging } from 'mobx-logger';

import Promise from 'promise';

import routeConfig from './common/routeConfig';

import allStores from './stores/index';

import './style';

/**
 * 设置 moment 的本地化
 */
moment.updateLocale('zh-cn', zhLocale);

const browserHistory = createHashHistory();
const routingStore = new RouterStore();

const stores = {
  routing: routingStore,
  ...allStores,
};

const history = window.oliHistory = syncHistoryWithStore(browserHistory, routingStore);

useStrict(true);

/**
 * 判断当前环境是不是在 electron
 *
 * @returns {boolean}
 */
window.isElectron = () => {
  return navigator.userAgent.indexOf('Electron') > 0;
};

/**
 * 
 * @param {*} message error message
 * @param {*} source 
 * @param {*} lineno line number
 * @param {*} colno column number
 * @param {*} error error object
 */
window.onerror = (message, source, lineno, colno, error) => {
  console.error('error happened:', message, 
    ', line:', lineno, 
    ', col:', colno, 
    ', error object', error);

  if (window.isElectron()) {
    const { ipcRenderer } = window.require('electron');
    ipcRenderer.send('un-catch-error-happened', error);
  }
}

/**
 * 判断当前操作系统
 *
 */
window.isMac = function () {
  const UserAgent = navigator.userAgent.toLowerCase();
  return /mac os/.test(UserAgent);
};

window.isWindows = function () {
  const UserAgent = navigator.userAgent.toLowerCase();
  return /windows nt/.test(UserAgent);
};

// 获取url的参数
window.getUrlParam = function(url) {
    let requestParameters = {};
    if (!url) {
      return requestParameters;
    }
    let urlArr = url.split('?');
    if(urlArr[ 1 ]){
      let urlParameters = urlArr[ 1 ].split('#')[ 0 ];
      if (urlParameters.indexOf('?') === -1)
      {
        let parameters = decodeURI(urlParameters);
        let parameterArray = parameters.split('&');
        for(let i = 0; i < parameterArray.length; i++) {
          requestParameters[ parameterArray[ i ].split('=')[ 0 ] ] = (parameterArray[ i ].split('=')[ 1 ]);
        }
      }
    }
    return requestParameters;
  }


// optional
// {
//   predicate: () => true|false,
//   action: true|false,
//   reaction: true|false,
//   transaction: true|false,
//   compute: true|false
// }
const config = {
  predicate: () => true,
  action: true,
  reaction: false,
};

// enableLogging(config);
// onScreenCut();

function renderRouteConfigV3(Container, routes, contextPath) {
  // Resolve route config object in React Router v3.
  const children = []; // children component list

  const renderRoute = (item, routeContextPath) => {
    let newContextPath;
    if (/^\//.test(item.path)) {
      newContextPath = item.path;
    } else {
      newContextPath = `${routeContextPath}/${item.path}`;
    }

    newContextPath = newContextPath.replace(/\/+/g, '/');
    if (item.component && item.childRoutes) {
      children.push(renderRouteConfigV3(item.component, item.childRoutes, newContextPath));
    } else if (item.component) {
      children.push(<Route key={newContextPath} component={item.component} path={newContextPath} exact/>);
    } else if (item.childRoutes) {
      item.childRoutes.forEach(r => renderRoute(r, newContextPath));
    }
  };

  routes.forEach(item => renderRoute(item, contextPath));

  // Use Switch as the default container by default
  if (!Container) return <Switch>{children}</Switch>;

  return (
    <Container key={contextPath}>
      <Switch>
        {children}
      </Switch>
    </Container>
  );
}

function onScreenCut () {
  if (window.isElectron()) {
    const { ipcRenderer, desktopCapturer, screen } = window.require('electron');
    ipcRenderer.on('short-key-cut', () => {
      const displays = screen.getAllDisplays()
      const getDesktopCapturer = displays.map((display, i) => {
        return new Promise((resolve, reject) => {
          desktopCapturer.getSources({
            types: ['screen'],
            thumbnailSize: display.size
          }, (error, sources) => {
            if (!error) {
              return resolve({
                display,
                thumbnail: sources[i].thumbnail.toDataURL()
              })
            }
            return reject(error)
          })
        })
      });

      Promise.all(getDesktopCapturer)
        .then(sources => {
          ipcRenderer.send('screen-cut', sources);
        })
        .catch(error => console.log(error));
    });
  }
}

class Root extends React.Component {

  render() {
    const children = renderRouteConfigV3(null, routeConfig, '/');
    return (
      <Provider {...stores}>
        <Router history={history}>
          {children}
        </Router>
      </Provider>
    )
  }

}

//class Root extends React.Component {
//
//  render() {
//    return (
//      <Provider {...stores}>
//        <Router history={history} routes={routeConfig} />
//      </Provider>
//    )
//  }
//
//}

ReactDOM.render(<Root/>, document.getElementById('react-root'));
