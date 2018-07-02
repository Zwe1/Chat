import request from './request';

/**
 * 获取企业列表
 *
 */
 export function fetchCompanyList() {
  return request({
    url: '/api/tenant/joinlist',
    method: 'GET',
    data: {}
  });
}

/**
 * 设置主企业
 *
 * @param id 主企业id
 */
 export function setMainCompany(id) {
 	return request({
 		url: '/api/tenant/setmain',
 		method: 'GET',
 		data: {
 			corpid: id
 		}
 	});
 }