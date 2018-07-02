import $ from 'jquery';
import '../css/urlInput.css';

import config from '../../electron-main/em-config.json';
import { getSetting } from "../../services/login";
import semver from 'semver';

import qs from 'qs';
import {
  getUrlAndLength,
  addBaseUrl,
  getAllDomainUrls,
  setCurrentBaseUrl,
  getCurrentBaseUrl
} from '../../lowdb';

const { remote } = window.require('electron');
const win = remote.getCurrentWindow();
const domain_url = getCurrentBaseUrl();

function controller() {
  //登录
  $('#enter').on('click', function () {
    const url = $('#server-address').val();
    handleSaveUrl(url);
  });

  //缩小窗口
  $('.minus').on('click', function () {
    console.log('minimize window');
    win.minimize();
  });

  //关闭窗口
  $('.close').on('click', function () {
    console.log('close window');
    win.close();
  });

  //drop-down隐藏
  $('body').on('click', function (e) {
    e.preventDefault();
    $('.drop-down').hide();
  });
}

function completeContent(val) {
  return getAllDomainUrls().filter(url => url.includes(val));
}

function isDev() {
  return window.location.href.indexOf(config.dev_url) === 0;
}

function handleSaveUrl(url) {
  if (!url) {
    $('.verification').html('服务器地址不能为空！');
    return
  }

  console.log('saving url', url);
  setCurrentBaseUrl(url);

  getSetting()
    .then(data => {
      let loginUrl = `${url}/#/login`;

      // 开发环境用本地服务器
      if (isDev()) {
        loginUrl = `${config.dev_url}/#/login`;
      }

      // 保存当前 url 设置
      addBaseUrl({
        ...data,
        url,
      });

      // 当前版本
      const { ipcRenderer, remote } = window.require('electron');
      let version = remote.app.getVersion();

      // 服务器版本
      const pcClientVersion = data.pc_client_version || '0.8.5'; // 默认是很高的版本

      console.log('[system version]:', version, ', [server version]:', pcClientVersion);

      if (semver.valid(pcClientVersion) && semver.lt(version, pcClientVersion)) {
        // 需要更新， 跳转到更新页面
        console.log('need to update.........');

        ipcRenderer.send('change-to-update-page', {
          serverVersion: pcClientVersion,
          currentVersion: version
        });
      }

      // 去登陆页面
      ipcRenderer.on('change-to-login-page.success', () => {
        console.log('change to login page success.');
      });

      ipcRenderer.send('change-to-login-page', {
        loginUrl,
        indexUrl: url
      });
    })
    .catch(() => {
      $('.verification').html('访问服务器失败！');
      $('.url-input-wrapper').css('display', 'block');
      //待加载
      $('.transit').css('display', 'none');
    });
}

$(document).ready(() => {
  const allDomainUrls = getAllDomainUrls();
  console.log('allDomainUrls', allDomainUrls);

  function init() {
    let search = location.search;
    let res = search ? qs.parse(search.substring(1)) : {};

    if ((res.autoJump && res.autoJump !== 'false')
      || (!res.autoJump && domain_url)) {
      handleSaveUrl(domain_url);
    } else {
      $('.url-input-wrapper').css('display', 'block');
      $('.transit').css('display', 'none');
    }
  }

  init();
  controller();

  $('#server-address').val(domain_url);

  $('#server-address').on('input', (e) => {
    $('.drop-down').show();

    const val = e.target.value;
    const urls = completeContent(val);

    $('.drop-down').html(urls.map(url => '<li class="domain-url">' + url + '</li>'));

    $('.domain-url').on('click', function(e) {
      $('.drop-down').hide();
      const text = $(this).text();
      $('#server-address').val(text);
      return false;
    });
  });
});
