import request from './request';
// import axios from 'axios';

/**
 {
   "msg_token": "XlBnz32v",
   "msg_sever_url": "http://192.168.82.153:8090"
  }
 */
export function getToken() {
  return request({
    url: '/api/msg/gettoken',
    method: 'get'
  });
}