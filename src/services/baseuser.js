import request from './request';
import Promise from 'promise';

export function update(data) {
  return request({
    url: '/api/baseuser/update',
    method: 'post',
    data
  });
}

// 未用到
export function updatePassword(data) {
  return request({
    url: '/api/baseuser/updatepassword',
    method: 'post',
    data
  });
}

export function get(base_user_id) {
  return request({
    url: '/api/baseuser/get',
    method: 'get',
    data: { id: base_user_id }
  });
}

// 根据关键字搜索
export function userAndGroupSearch(keyword, search_type = '') {
  return request({
    url: '/api/baseuser/search',
    method: 'get',
    data: {
      keyword,
      search_type
    }
  });
}

/**
 * 获取用户信息，包括在每个公司里面的信息
 *
 * @param id
 * @param isRefresh
 */
export function getUserInfo(id, isRefresh = true) {
  return get(id).then(data => {
    delete data.errcode;
    delete data.errmsg;
    delete data.isSuccess;
    delete data.operationLogId;

    let userList = data.userlist || [];
    let dummy = userList.filter(user => user.tenant_id === data.main_tenant_id);
    if (dummy.length > 0) {
      data.main_tenant_name = dummy[ 0 ].tenant_name;
    }

    return data;
  });
}

