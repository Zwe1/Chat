import request from './request';
import axios from 'axios';

/**
 * 异步获取部门
 * @param ids
 * @param deptid 部门id
 * @param fetch_mine 0 所有部门， 1 我的部门
 */
export function listAll(ids, deptid = '', fetchMine = 0) {
  if (Object.prototype.toString.apply(ids) === '[object Array]') {
    let ps = ids.map(corpid => request({
      url: '/api/department/client/child',
      data: {
        corpid: corpid,
        fetch_mine: fetchMine,
      }
    }));
    return axios.all(ps);
  } else {
    return request({
      url: '/api/department/client/child',
      data: {
        corpid: ids,
        deptid,
        fetch_mine: fetchMine,
      }
    })
  }
}

/**
 * 全量获取部门下的所有人员
 * @param ids
 * @param fetchUser 0 不包括 user，1 包括 user
 * @param fetchChild 0 不包括子部门， 1 包括 子部门
 */
export function listUserByAll(id, deptid = '', fetchUser = 1, fetchChild = 1) {
  return request({
    url: '/api/department/client/list',
    data: {
      corpid: id,
      deptid,
      fetch_user: fetchUser,
      fetch_child: fetchChild
    }
  })
}

/**
 * 一口气获取所有的
 * @param ids
 */
export function myDepts(ids) {
  let ps = ids.map(corpid => request({
    url: '/api/department/client/mydept',
    data: {
      corpid: corpid
    }
  }));

  return axios.all(ps);
}

export function tenantList() {
  return request({
    url: '/api/tenant/joinlist'
  });
}

/**
 * @deprecated
 * @param corpid
 * @param id
 */
export function childDept(corpid, id) {
  return request({
    url: '/api/department/client/childlist',
    data: {
      corpid: corpid,
      id
    }
  });
}

/**
 * 根据关键字搜索该公司下的人员和部门
 * @param keyword
 */
export function userAndDeptSearch(keyword, corpid, search_dept = 1) {
  return request({
    url: '/api/user/client/search',
    data: {
      keyword,
      corpid,
      search_dept
    }
  });
}

/**
 * 根据公司id获取下属成员
 * @param corpid 公司id
 */
export function subordinate(ids) {
  let ps = ids.map(corpid => request({
    url: '/api/user/client/subordinate',
    data: {
      corpid: corpid
    }
  }));

  return axios.all(ps);
}

/**
 * 根据公司id获取常用组
 * @param corpid 公司id
 */
export function commonGroup(ids) {
  let ps = ids.map(corpid => request({
    url: '/api/group/client/list',
    data: {
      corpid: corpid
    }
  }));

  return axios.all(ps);
}

