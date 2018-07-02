import { 
  getCurrentUser,
  getCurrentBaseUrl,
  getCurrentDomainSetting,
  setCurrentUser
} from '../lowdb';
import axios from 'axios';

const urlPrefix = window.apiPrefix || '/emp';

function isPost(method) {
  return method === 'post'
}

function isSuccess() {
  return this.errcode === 0 || (this.unread !== undefined || this.count !== undefined);
}

function isFormdata(type) {
  return type === 'formdata';
}

function buildFormData(data) {
  let keys = Object.keys(data);
  let formData = new FormData();

  keys.forEach(key => {
    formData.append(key, data[key]);
  });

  return formData;
}

/**
 *
 * @param url e.g. /login, 要用 / 开头
 * @param params  method, data,
 * @promiseFlag 是否返回原promise
 * @responseType
 */
export default function request(params, promiseFlag = false, responseType = 'json') {
  let {
    url,
    allUrl,
    method = 'get',
    data = {},
    type = '',
    headers = {},
  } = params;

  // 普通 post 请求，是 json 类型的
  if (isPost(method) && !isFormdata(type)) {
    data = JSON.stringify(data);
    headers = {
      'Content-Type': 'application/json',
      ...headers
    };
  }

  // 要上传文件，需要用到 FormData
  if (isPost(method) && isFormdata(type)) {
    data = buildFormData(data);
  }

  // add  /emp/***
  url = allUrl ? allUrl : urlPrefix + url;

  const user = getCurrentUser();
  if (user) {
    headers['access_token'] = user.access_token;
  }

  var instance = axios.create({
    baseURL: getCurrentBaseUrl(),
    timeout: 300000,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      ...headers,
    },
    responseType: responseType
  });

  let promise = method === 'post'
              ? instance.post(url, data)
              : instance.get(url, { params: data });

  if (promiseFlag) {
    return promise.then(res => res.data).then(data => data);
  }

  return promise
    .then(res => {
      return res.data || {};
    })
    .then(data => {
      if (!data) {
        data = {};
      }

      data.isSuccess = isSuccess;
      if (!data.isSuccess()) {
        let e = new RequestException(data.errcode, data.errmsg);
        if (e.code === 42001 || e.code === 40001) {
          // access_token 过期该怎么办
          console.log('token 过期，请重新登录~');

          // 清除登陆用户的自动登录
          setCurrentUser({
            ...user,
            auto: false
          });

          // 浏览器环境，获取当前 url
          let setting = getCurrentDomainSetting() || {};

          setTimeout(() => {
            if (window.isElectron()) {
              const { ipcRenderer } = window.require('electron');
              ipcRenderer.on('exchange-user-after-close-other', () => {
                window.oliHistory.replace('/login');
              });

              ipcRenderer.send('exchange-user');
            } else {
              window.oliHistory.replace('/login');
            }
          }, 500);
        } 

        // else if(e.code === 101) {
          // message.error('账号或密码错误~');
        // } else {
          // message.error(url+ ': ' + e.message);
        // }

        throw e;
      }

      return data;
    })
    .catch(e => {
      console.error('request error:', e);
      throw e;
    });
}

function RequestException(code, msg) {
  this.code = code;
  this.msg = msg;
  this.isException = true;

  this.message = `[${this.code}] - ${this.msg}`;

  this.toString = function() {
    return `[${this.code}] - ${this.msg}`;
  };
}
