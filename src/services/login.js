import request from './request';
import pack from '../../package.json';

export function loginByUsernameAndPassword(loginid, password, captchaText, key) {
  let platform = 'web';
  if (window.isElectron()) {
    const os = window.require('os');
    platform = os.platform();
  }

  return request({
    url: '/passport/login',
    method: 'post',
    data: {
      loginid: loginid,
      password,
      captcha_text: captchaText,
      key,
      client_version: pack.version,
      os_version: platform,
      login_type: 1,
      client_type: platform === 'web' ? 4 : 1,
    }
  });
}

export function regist(data) {
  return request({
    url: '/passport/phonelogin',
    method: 'post',
    data: {
      sms_code: data.code,
      mobile: data.phone,
      mode: data.mode,
    }
  });
}

export function update(data) {
  return request({
    url: '/api/passport/update',
    method: 'post',
    data
  });
}

export function loginByPhoneAndCode(phone, code) {
  return request({
    url: '/passport/phonelogin',
    method: 'post',
    data: {
      sms_code: code,
      mobile: phone,
    }
  });
}

/**
 * editPwdKey
 * pwd
 */
export function resetpwd(data) {
  return request({
    url: '/passport/resetpwd',
    method: 'post',
    data: {
      mobile: data.rgphone,
      sms_code: data.rgcode,
      password: data.setpassword,
    }
  });
}

export function resetpwdByOld(data) {
  return request({
    url: '/api/baseuser/updatepassword',
    method: 'post',
    data
  });
}

export function sendSMSCode(phone, captchaText, key, sendType) {
  return request({
    url: '/passport/sendcode',
    method: 'get',
    data: {
      mobile: phone,
      captcha_text: captchaText,
      key,
      send_type: sendType,
    }
  });
}

export function keepAlive() {
  return request({
    url: '/api/passport/alive',
    method: 'get',
  });
}

export function reConnect() {
  return request({
    url: '/api/reconnect',
    method: 'get',
  });
}

export function logout() {
  return request({
    url: '/api/passport/logout',
    method: 'get',
  });
}

export function getSetting() {
  return request({
    url: '/passport/getsetting',
    method: 'get',
  });
}

export function getCode() {
  let platform = 'web';
  if (window.isElectron()) {
    const os = window.require('os');
    platform = os.platform();
  }
  return request({
    url: '/passport/scanlogin/getcode',
    method: 'post',
    data: {
      client_version: pack.version,
      os_version: platform,
      login_type: 1,
      client_type: 1
    }
  });
}

export function qrcodeImg(code) {
  return request({
    url: '/passport/scanlogin/qrcodeimg.png',
    method: 'get',
    data: {
      code,
    }
  }, true, 'arraybuffer');
}

export function cancelCodeLogin(code, type = 1) {
  return request({
    url: '/passport/scanlogin/cancel',
    method: 'get',
    data: {
      code,
      type,
    }
  });
}

export function messageSetting() {
  let clienttype = 4;
  if (window.isElectron()) {
    clienttype = 1;
  }

  return request({
    url: '/api/msg/extend/list',
    method: 'get',
    data: {
      clienttype,
      version: pack.version,
    }
  });
}