import request from './request';
import { getCurrentUser, getCurrentBaseUrl } from '../lowdb';

/**
 * media 素材文件 formData	file
 * type 素材类型：
 *        图片-image、
 *        语音-voice、
 *        视频-video、
 *        文件-file
 * thumbnail
 */
export function upload(file, type, target, thumbnail, open) {
  let data = {
    media: file,
    type,
    ...target,  // from, targetid, resourceids
  };

  if (thumbnail !== undefined) {
    data.thumbnail = thumbnail;
  }

  if (open !== undefined) {
    data.open = open;
  }

  return request({
    url: '/api/media/upload',
    method: 'post',
    type: 'formdata',
    data
  });
}

export function buildMediaUrl(id) {
  const baseUrl = getCurrentBaseUrl();
  const user = getCurrentUser() || {};

  let url = `${baseUrl}/emp/api/media/get?media_id=${id}`;
  return url;
}