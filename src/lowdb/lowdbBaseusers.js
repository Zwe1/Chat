import _ from 'lodash';

import { getCurrentDB } from './lowdbUtil';

function db() {
  return getCurrentDB('baseuser');
}

export function saveItems(name, items = []) {
  let realDb = db();

  if (items.length === 0) {
    return;
  }

  let old = realDb.get(name).value();
  if (!old || (_.isArray(old) && old.length === 0)) {
    realDb.set(name, items).write();
  } else {
    /*
     * 1. 更新 old 重复的
     * 2. 添加 old 不存在的
     */
    let oldIds = old.map(o => o.id);
    items.forEach(item => {
      if (oldIds.indexOf(item.id) < 0) {
        // 不存在
        old.push(item);
      } else {
        // 存在
        old.forEach(oldItem => {
          if (oldItem.id === item.id) {
            // 更新
            Object.assign(oldItem, item);
          }
        })
      }
    });

    realDb.set(name, old).write();
  }
}

/**
 *
 * @param id
 * @param simple 是否为简单信息
 *
 * @returns {*}
 */
export function getUser(id, simple = false) {
  let user = db().get('users')
    .find({ base_user_id: id })
    .value();

  if (simple && user && 'userlist' in user) {
    let { userlist, ...others } = user;
    return others;
  }

  return user;
}

export function saveUser(user) {
  // if (user.id) {
    // user.base_user_name = user.name;
    // user.base_user_id = user.id;
  // }

  const old = getUser(user.base_user_id);
  if (!old) {
    db().get('users').push(user).write();
  } else {
    db()
      .get('users')
      .find({ 
        base_user_id: user.base_user_id
      })
      .assign(user) // 更新, 详细信息与简单信息不冲突
      .write();
  }
}

/**
 * 直接添加
 *
 * @param users
 */
export function saveUsers(users) {
  // users.forEach(user => {
  //   if (user.id) {
  //     user.base_user_name = user.name;
  //     user.base_user_id = user.id;
  //   }
  // });

  saveItems('users', users);
}


/**
 * 添加所有的用户
 *
 * @param users
 */
export function saveAllUsers(users) {
  const allUsers = db().getState().users;

  // 已添加新用户个数
  let newUsers = 0;

  for (let i in users) {
    let flag = false; // 默认为新用户
    let curUser = users[ i ];

    // 倒着查找
    for (let n = newUsers; n >= 0; n--) {
      let index = (parseInt(i) - n) < 0 ? 0 : (parseInt(i) - n);

      let curAll = allUsers[ index ];
      if (!curAll) {
        flag = false;
        break;
      }

      // 通讯录的i项，和缓存中的(i - newUsers) 到 i 之间 有匹配的，则不为新用户
      if (curUser.base_user_id === curAll.base_user_id) {
        if (curUser.userlist) {
          // userlist的更新
          let userlist = [];
          for (let hrm of curUser.userlist) {
            const auHrm = curAll.userlist;
            if (auHrm && auHrm.length > 0) {
              for (let allHrm of curAll.userlist) {
                if (hrm.id === allHrm.id) {
                  userlist.push(Object.assign(allHrm, hrm));
                }
              }
            } else {
              userlist.push(hrm);
            }
          }

          curUser.userlist = userlist;
        }

        curUser = Object.assign(curAll, curUser);

        newUsers = n;
        flag = true;
      }
    }

    // 为新用户
    if (!flag) {
      newUsers++;
    }
  }

  users.forEach(user => {
    if (user.id) {
      user.base_user_id = user.id;
      user.base_user_name = user.name;
    }
  });

  db().set('users', users).write();
}

export function getUsers(ids = []) {
  let users = db().get('users')
    .filter((user) => {
      return ids.indexOf(user.base_user_id) > -1;
    })
    .value();

  return users || [];
}

export function getAllUsers() {
  return db().get('users').value();
}

/**/
// tenants
/**/

export function getTenant(id) {
  return db().get('tenants')
    .find({ id })
    .value();
}

export function saveTenants(items) {
  saveItems('tenants', items);
}

/**/
// agents
/**/

export function getAgent(id) {
  return db().get('agents')
    .find({ id })
    .value();
}

export function saveAgents(items) {
  saveItems('agents', items);
}
