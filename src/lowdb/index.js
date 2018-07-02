//import config from "../electron-main/em-config.json";
import { createUserFiles, getDB, operateBaseUserId } from "./lowdbUtil";
import { tryParse } from "../common/jsonUtil";

createUserFiles();

function db(id, name) {
  return getDB(id, name);
}

/**
 * 所有的 baseurl 都是在这里返回的
 *
 * @returns {*}
 */
export function getCurrentBaseUrl() {
  let url = db().get('currentBaseUrl').value();
  if (!url) {  
    // 线上会这样
    if (window.baseURL === '') {
      // console.log('baseURL is null');
      window.baseURL = location.origin; 
    }

    url = window.baseURL;
    // 不是开发模式的时候，必须要返回一个url
    setCurrentBaseUrl(url);
  }
  
  return url;
}

function currentUsers() {
  const url = getCurrentBaseUrl();
  return db().get('domains')
    .find({ url })
    .get('users');
}


export function getCurrentUser() {
  const id = operateBaseUserId() || '';
  const name = id === '' ? 'root' : 'index';

  // const dummy = db(id, name).get('currentUser').value();
  const user = sessionStorage.getItem('getCurrentUser');
  if (!user) {
    const dummy = db(id, name).get('currentUser').value();
    sessionStorage.setItem('getCurrentUser', JSON.stringify(dummy));
    return dummy;
  }

  return tryParse(user);
}

export function setFileAddress(msg, address) {
  if (address) {
    const myId = getCurrentUser().base_user_id;
    const id = msg.isGroup ? msg.to : msg.from === myId ? msg.to : msg.from;
    const name = 'fileAddress';

    let value =  {};
    value[msg.id] = address;

    if (!db(id, name).has('address').value()) {
      db(id, name).set('address', {}).write();
    }

    db(id, name).get('address').assign(value).write();
  }
};

export function getFileAddress(msg) {
  const myId = getCurrentUser().base_user_id;
  const id = msg.isGroup ? msg.to : msg.from === myId ? msg.to : msg.from;
  if (!db(id, 'fileAddress').has('address').value()) {
    return null
  }

  const value = db(id, 'fileAddress').get('address').value();
  let address = null;
  for (let key in value) {
    if (key === msg.id) {
      address = value[key]
    }
  }

  return address
}

export function setCurrentBaseUrl(url) {
  db().set('currentBaseUrl', url).write();
}

export function setCurrentUser(user) {
  const id = user.base_user_id;
  const name = 'index';

  db(id, name).set('currentUser', null).write();
  db(id, name).set('currentUser', user).write();

  sessionStorage.setItem('getCurrentUser', JSON.stringify(user));

  const url = getCurrentBaseUrl();
  const old = currentUsers()
              .find({ base_user_id: user.base_user_id })
              .value();

  if (old) {
    db()
      .get('domains')
      .find({ url })
      .get('users')
      .find({ base_user_id: user.base_user_id })
      .assign(user)
      .write();

    return;
  }

  db()
    .get('domains')
    .find({ url })
    .get('users')
    .push(user)
    .write();
}

export function getLastUserByDomain() {
  const domain = getCurrentBaseUrl();
  let id = db().get('domains').find({url: domain}).get('lastUserId').value() || '';
  return db().get('domains').find({url: domain}).get('users').find({'base_user_id': id}).value() || '';
}

export function setLastUserByDomain(id) {
  if (!id) {
    return
  }

  const domain = getCurrentBaseUrl();
  db().get('domains').find({url: domain}).set('lastUserId', id).write();
}

// 登陆相关
export function setLoginType(type) {
  db().set('loginType', type ? type : null).write();
}

export function getLoginType() {
  return db().get('loginType').value();
}

/* users */
export function getAllloginid() {
  return currentUsers().map('loginid').value();
}

export function getloginidAndPassword() {
  return currentUsers()
    .map(e => {
      return {
        loginid: e.loginid,
        password: e.password,
        key: e.key
      };
    }).value();
}

export function removeByloginid(loginid) {
  currentUsers().remove({ loginid }).write();
}

/* domains */
export function addBaseUrl(url) {
  const realDb = db();

  const { url: realUrl, errcode, errmsg, isSuccess, ...props } = url;

  if (props.cdn_url == null) {
    props.cdn_url = realUrl;
  }

  // 如果 domains 不存在
  const domainsValue = realDb.get('domains').value();
  if (!domainsValue) {
    // 添加默认值
    realDb.set('domains', []).write();
  }

  const dummy = realDb.get('domains').find({ url: realUrl }).value();
  if (dummy) {
    realDb
      .get('domains')
      .find({ url: realUrl })
      .assign(props)
      .write();
  } else {
    props.users = [];
    props.url = realUrl;
    realDb.get('domains').push(props).write();
  }
}

export function getAllDomainUrls() {
  return db().get('domains').map('url').value();
}

// export function getUrlAndLength() {
//   const urls = getAllDomainUrls();
//   const length = urls.length;
//   const url = urls.length > 0 ? urls[ length - 1 ] : '';

//   return { url, length }
// }


export function getCurrentDomainSetting() {
  const currentUrl = getCurrentBaseUrl();
  const domain = db().get('domains').find({ url: currentUrl }).value();

  if (!domain) {
    return {};
  }

  return domain;
}
