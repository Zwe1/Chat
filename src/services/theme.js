import request from './request';

/**
 * 获取主题
 *
 * @param type 1-移动APP，2-PC客户端，3-web客户端
 */
export function fetchTheme(type = 2) {
  return request({
    url: '/api/theme/client/get',
    method: 'GET',
    data: {
      client_type: type,
    }
  });
}

/**
 * 切换主题
 *
 * @param id 主题id
 */
export function selectTheme(id) {
	return request({
		url: '/api/theme/client/select',
		method: 'GET',
		data: {
			id: id,
		}
	});
}