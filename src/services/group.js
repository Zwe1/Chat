import request from './request';

/**
 {
   "name": "群名称",
   "grouptype": 1,            // 类型
   "corpid": "string",
   "description": "string",
   "english_name": "string",
   "logo_mediaid": "string",
   "memberlist": [
     "string"
   ]
 }
 */
export function create(params) {
  return request({
    url: '/api/msg/group/create',
    method: 'post',
    data: params
  });
}

/**
 * memberType: 1 创建者，2 管理员，3 普通人
 * 
 * @param id
 */
export function get(id) {
  return request({
    url: '/api/msg/group/get',
    method: 'get',
    data: {
      groupid: id
    }
  });
}

export function disband(groupid) {
  return request({
    url: '/api/msg/group/disband',
    method: 'get',
    data: {
      groupid: groupid
    }
  });
}

/**
 {
   "groupid": "string",
   "memberlist": [
     "string"
   ]
 }
 */
export function addMembers(groupid, list) {
  return request({
    url: '/api/msg/group/addmembers',
    method: 'post',
    data: {
      groupid: groupid,
      memberlist: list
    }
  });
}

/**
 {
   "groupid": "string",
   "memberlist": [
     "string"
   ]
 }
 */
export function delMembers(groupid, list) {
  return request({
    url: '/api/msg/group/delmembers',
    method: 'post',
    data: {
      groupid: groupid,
      memberlist: list
    }
  });
}

/**
 {
    "groupid": "string",
    "memberlist": [
      "string"
    ],
    "membertype": 1
  }
 */
export function setMembers(groupid, list, type) {
  return request({
    url: '/api/msg/group/setmembers',
    method: 'post',
    data: {
      groupid: groupid,
      memberlist: list,
      membertype: type
    }
  });
}


/**
 *
 {
   "description": "string",
   "english_name": "string",
   "groupid": "string",
   "logo_mediaid": "string",
   "name": "群名称"
 }
 */
export function update(obj) {
  return request({
    url: '/api/msg/group/update',
    method: 'post',
    data: {
      groupid: obj.groupid,
      name: obj.group_name,
      logo_mediaid: obj.avatar.media_id,
    }
  });
}

export function noticeList() {
  return request({
    url: '/api/msg/group/notice/list',
    method: 'get'
  });
}

/**
 {
    "groupid": "string",
    "remark": "通知：下午三点开会"
  }
 */
export function noticePublish() {
  return request({
    url: '/api/msg/group/notice/publish',
    method: 'post'
  });
}

/**
 * base_user_id
 */
export function listByUser(id) {
  return request({
    url: '/api/msg/group/mylist',
    method: 'get',
    data: {
      base_user_id: id
    }
  });
}

/**
 *
 */
export function groupsSearch(keyword) {
  return request({
    url: '/api/msg/group/mylist',
    method: 'get',
    data: {
      keyword,
    }
  });
}

