import request from './request';
import Promise from 'promise';

/**
 {
   "agentlist": [
     "string"
   ],
   "grouplist": [
     "string"
   ],
   "tenantlist": [
     "string"
   ],
   "userlist": [
     "string"
   ]
 }
 */
export function simpleList(params) {
  const {
    agentlist = [],
    grouplist = [],
    tenantlist = [],
    userlist = []
  } = params;

  if (agentlist.length === 0 && agentlist.length === 0
    && userlist.length === 0 && grouplist.length === 0) {
    // 如果本地缓存都有
    return Promise.resolve({});
  }

  return request({
    url: '/api/msg/userinfo/simplelist',
    method: 'post',
    data: {
      userlist,
      grouplist,
      agentlist,
      tenantlist
    }
  });
}

export function simpleAgentList(ids) {
  return simpleList({ agentlist: ids }).then(result => result.agentlist || []);
}

export function simpleGroupList(ids) {
  return simpleList({ grouplist: ids }).then(result => result.grouplist || []);
}

export function simpleTenantList(ids) {
  return simpleList({ tenantlist: ids }).then(result => result.tenantlist || []);
}

export function simpleUserList(ids) {
  return simpleList({ userlist: ids }).then(result => result.userlist || []);
}
