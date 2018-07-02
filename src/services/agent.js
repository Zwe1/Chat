import request from './request';
import axios from 'axios';

// export function agentList(corpid) {
//   return request({
//     url: '/api/agent/client/list',
//     method: 'get',
//     data: {
//       corpid: corpid
//     }
//   });
// }

/*
 * client_type: 1: 移动app 2: PC客户端 3: web客户端
 *
 */
export function agentList(corpid) {
	return request({
		url: '/api/workbench/client/get',
		method: 'get',
		data: {
			corpid: corpid,
			client_type: 2
		}
	});
}

export function getUnread(url) {
	return request({
		allUrl: url
	});
}
