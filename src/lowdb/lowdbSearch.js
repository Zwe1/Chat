import { getCurrentDB } from "./lowdbUtil";
import _ from "lodash";
import moment from "moment";

function db() {
  return getCurrentDB('search');
}

/* search */
export function setSearch(item, type) {
  const old = db()
    .get('search')
    .value();

  if (old) {
    let flag = true;
    if (type === 'users') {
      const users = old.filter(v => v.id);
      for (let v of users) {
        if (item.id === v.id) {
          flag = false;
        }
      }
    } else {
      const groups = old.filter(v => v.groupid);
      for (let v of groups) {
        if (item.groupid === v.groupid) {
          flag = false;
        }
      }
    }

    if (flag) {
      db()
      .get('search')
      .push(item)
      .write();
    }
  } else {
    db()
      .set('search', [ item ])
      .write();
  }
}

/* get 只取前五个 */
export function getSearch(type) {
  if (type === 'all') {
    return db()
      .get('search')
      .value();
  } else if (type === 'users') {
    return db()
      .get('search')
      .filter({type: 'user'})
      .value();
  } else {
    return db()
      .get('search')
      .filter({type: 'group'})
      .value();
  }
}

/* clear */
export function clearSearch(type) {
  if (type === 'all') {
    db()
      .set('search', [])
      .write();
  } else {
    const old = db()
      .get('search')
      .value();
    if (type === 'users') {
      const clearArr = old.filter(v => v.type !== 'user');
      db()
        .set('search', clearArr)
        .write();
    } else {
      const clearArr = old.filter(v => v.type !== 'group');
      db()
        .set('search', clearArr)
        .write();
    }
  }
}
