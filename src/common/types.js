import _ from 'lodash';
/**
 * 群组人员类型
 */
export const GroupMemberType = {
  owner: 1,
  admin: 2,
  member: 3,
};

/**
 * 群组状态
 */
export const GroupStatus = {
  disband: 2
};

/**
  群组操作
  
  1.加群  
  2.退群
  3.修改群名称
  4.踢人
  6.转移群组
  7.设置头像
  8.设置管理员
  9.取消管理员
 *
 */
export const DNTF = {
  create: 1,
  add: 1,
  exit: 2,
  nameChange: 3,
  remove: 4,
  // permChange: 5,
  ownerChange: 6,
  avatarChange: 7,
  adminChange: 8,
  adminCancel: 9,
};

/**
 * 消息类型
 */
export const MessageTypes = {
  // rc
  text: 'RC:TxtMsg',              // 文本消息
  img: 'RC:ImgMsg',               // 图片消息
  voice: 'RC:VcMsg',              // 语音消息

  ntf: 'RC:InfoNtf',              // 通知消息
  dntf: 'RC:DizNtf',              // 群组通知消息
  intf: 'FW:InfoNtf',             // 云盘取消分享消息

  withdraw: ':withdraw:',         // 消息撤回会包含这个的

  lbs: 'RC:LBSMsg',               // TODO: 位置信息
  notice: 'RC:PublicNoticeMsg',   // 公告消息

  // fw
  status: 'FW:CountMsg',          // 已读信息
  rich: 'FW:RichTextMsg',         // 图文消息（原E6）
  link: 'FW:LinkMsg',             // 链接消息
  personCard: 'FW:PersonCardMsg', // 名片消息
  news: 'FW:NewsMsg',             // 单/多图文消息（新）
  share: 'FW:CustomShareMsg',     // 分享消息（原E6）

  custom: 'FW:CustomMsg',         // 自定义消息
  shake: 'weaver_shakeMsg',       // 自定义消息的extra (抖一抖)
  voip: 'weaver_voipMsg',         // 自定义消息的extra (音视频通话结果)

  file: 'FW:attachmentMsg',       // 文件消息
  system: 'FW:SysMsg',            // 系统信息，FIXME: 不处理
  conop: 'FW:Conop',              // 操作类的消息

  clear: 'FW:ClearUnreadCount',   // 清除未读信息
  cmd: 'FW:CMDMsg',               // 必达消息
};

/**
 * 
 */
export const OPMsgTypes = {
  delete: 'delete',
  delMsg: 'delmsg',
  empty: 'empty',
  top: 'top',
  noti: 'noti',
};

/**
 * 功能标识
 */
export const appIdenTypesByNum = {
  '-1': 'chat',               // 消息
  '-2': 'contact',            // 通讯录
  '-3': 'app',                // 工作台
  '-4': 'me',                 // 我
  '-11': 'screctChat',        // 密聊
  // '-12': 'call',              // 电话
  '-13': 'scan',              // 扫一扫
  '-14': 'groupChat',         // 发起群聊
  '-15': 'focusMode',         // 专注模式
  '-16': 'appMsg',            // 应用消息
  '-17': 'appStore',          // 应用商店
  '1': 'use',                 // 应用
  '2': 'gateway',             // 门户
  '3': 'custom',              // 自定义链接
}

export const appIdenTypesByStr = _.invert(appIdenTypesByNum)

//
//var weaverMsgTypeMapping = {
//  'FW:SyncMsg': 'TextMessage',  //同步消息
//  'FW:CustomMsg': 'TextMessage',  //抖动等用到
//  'FW:CountMsg': 'TextMessage',  //count消息(已读状态)
//  'FW:SysMsg': 'TextMessage',  //系统消息（推送提醒）
//  'FW:attachmentMsg': 'TextMessage',  //附件
//  'FW:CustomShareMsg': 'TextMessage',  //分享
//  'FW:PersonCardMsg': 'TextMessage',  //名片
//  'FW:richTextMsg': 'TextMessage',  //图文
//  'FW:SyncQuitGroup': 'TextMessage',  //删除本地讨论组
//  'RC:PublicNoticeMsg': 'TextMessage',  //群公告
//  'FW:ClearUnreadCount': 'TextMessage',  //端已读状态消息
//  'FW:InfoNtf': 'TextMessage', //自定义通知类消息，(取消网盘分享消息)
//  'FW:InfoNtf:cancelShare:RC:TxtMsg': 'TextMessage', //取消分享后的消息类型
//  'FW:CloseMsg': 'TextMessage', //手机发消息退出pc端
//  'FW:CustomShareMsgVote': 'TextMessage',//投票消息
//  'RC:InfoNtfVote': 'TextMessage' //投票相关通知消息
//};

export const xmlnsNameSpaces = {
  group: 'http://weaver.com.cn/group',              //群组
  history: 'http://weaver.com.cn/history',          //历史消息
  searchHistory: 'http://weaver.com.cn/history/search',    //查询历史消息
  globalSearchHistory: 'http://weaver.com.cn/chat/search', //搜索聊天记录
  serverFun: 'http://weaver.com.cn/serverFun',      //获取群配置
  status: 'http://weaver.com.cn/status',            //在线状态
  pushSetting: 'http://weaver.com.cn/pushSetting'   //在线状态
};

/**
 * 群组的操作
 *
 * @type {{create: string, addUser: string, deleteUser: string, changeOwner: string, changeName: string, exit: string}}
 */
export const GroupOperations = {
  create: 'createGroup',
  addUser: 'addGroupUsers',
  deleteUser: 'deleteGgroupUsers',
  changeOwner: 'changeGroupAdmin',
  changeName: 'changeGroupName',
  exit: 'exitGroup'
};
