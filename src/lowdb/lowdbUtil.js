import low from "lowdb";
import LocalStorage from 'lowdb/adapters/LocalStorage';

import { getUserDir } from "../common/electronUtil";
import { getCurrentUser } from './index';


window.isElectron = function () {
  return navigator.userAgent.indexOf('Electron') > 0;
};

export function createUserFiles() {
  if (window.isElectron()) {
    const ROOT_PATH = getUserDir();
    const DB_FOLDER = 'User Files';
    let userFilesPath = `${ROOT_PATH}/${DB_FOLDER}/`;
    const fs = window.require('fs');
    if (!fs.existsSync(userFilesPath)) {
      fs.mkdirSync(userFilesPath);
    }
  }
}

export function getDbPath(id = '', name = '') {
  const ROOT_PATH = getUserDir();
  const DB_FOLDER = 'User Files';
  let userFilesPath = `${ROOT_PATH}/${DB_FOLDER}/`;
  let path = `${userFilesPath}/${id}`;
  let dbPath = `${path}/${name}.json`;

  if (checkOrCreate(path)) {
    const fs = window.require('fs');
    fs.writeFileSync(dbPath, JSON.stringify({}));
  }

  return dbPath;
}

/**
 * 检查路径是否存在
 *
 * @param path
 * @returns {boolean} 如果不存在并且创建了，返回 true
 *                    如果存在，返回 false
 */
function checkOrCreate(path) {
  const fs = window.require('fs');
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path);
    return true;
  }

  return false;
}

/**
 * db 对象的缓存
 * @type {{}}
 */
const dbCache = {};

/**
 * user
 * group
 * search
 * theme
 * chatlist 会话列表
 * company 组织结构
 * url url 缓存
 */

/**
 *
 * @param id
 * @param name
 * @returns {*}
 */
export function getDB(id = '', name = 'root') {
  let key = `${id}-${name}`;

  if (!window.isElectron()) {
    let db = dbCache[ key ];
    if (!db) {
      const adapter = new LocalStorage(key);
      db = low(adapter);
      dbCache[ 'web' ] = db;
    }

    return db;
  }

  let dbDummy = dbCache[ key ];
  if (dbDummy) {
    return dbDummy;
  }

  const path = getDbPath(id, name);
  const FileSync = window.require('lowdb/adapters/FileSync');
  const adapter = new FileSync(path);
  // 缓存一下
  const db = low(adapter);
  dbCache[ key ] = db;

  return db;
}

export function operateBaseUserId(id) {
  let adapter = new LocalStorage('baser_user_id');
  let db = low(adapter);

  if (id) {
    db.set('base_user_id', id)
      .write();
    return
  }

  return (
    db.get('base_user_id')
      .value()
  )
}

/**
 *
 * @param name
 * @returns {*}
 */
export function getCurrentDB(name) {
  if (!name) {
    return;
  }

  let currentUser = getCurrentUser();
  return getDB(currentUser.base_user_id, name);
}



