import { getCurrentDB } from "./lowdbUtil";

import _ from 'lodash';

function db() {
  return getCurrentDB('group');
}

function initDB() {
  let dummy = db().get('groups').value();
  // console.log('dummy:', dummy);

  if (!dummy) {
    db().set('groups', []).write();
  }
}

/* groups */
export function saveGroups(groups = []) {
  // 从 simple list 转换一下
  // groups.forEach(group => {
  //   if (group.id) {
  //     group.groupId = group.id;
  //     group.group_name = group.name;
  //   }
  // });

  initDB();

  let old = db()
    .get('groups')
    .value();

  if (!old || (_.isArray(old) && old.length === 0)) {
    db()
      .set('groups', groups)
      .write();
  } else {
    /*
     * 1. 更新 old 重复的
     * 2. 添加 old 不存在的
     */
    let oldIds = old.map(o => o.groupId);
    groups.forEach(group => {
      if (oldIds.indexOf(group.groupId) < 0) {
        // 不存在
        old.push(group);
      } else {
        // 存在
        old.forEach(oldGroup => {
          if (oldGroup.groupId === group.groupId) {
            // 更新
            Object.assign(oldGroup, group);
          }
        })
      }
    });

    db()
      .set('groups', old)
      .write();
  }
}

export function getGroups() {
  return db()
    .get('groups')
    .value();
}

export function getGroup(id) {
  return db()
    .get('groups')
    .find({ 
      groupId: id
    })
    .value();
}

export function saveGroup(group) {
  console.log('save group:', group);
  initDB();

  let old = db().get('groups')
    .find({ groupId: group.groupId })
    .value();

  if (old) {
    db().get('groups')
      .find({ groupId: group.groupId })
      .assign(group)
      .write();
  } else {
    db().get('groups')
      .push(group)
      .write();
  }
}
