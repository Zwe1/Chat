import { $msg, Strophe, $pres, $iq } from '../exlib/strophe.min';
import { getCurrentUser } from '../lowdb';
import uuid from 'uuid';
import { MessageTypes, xmlnsNameSpaces } from '../common/types';
import { escape2Html } from '../common/htmlUtil';
import parseMessage, { parseNormalIQ } from '../common/parseMessage';
import moment from 'moment';

/**
 * 初始化这个链接需要用到，当前登陆用户的id用来在服务器标识自己的身份
 *
 *    - onMessage
 *    - send
 *
 * @type {null}
 */
class Octa {

  /**
   * api_ip       '192.168.1.241'
   * app_encrypt  0
   * app_port     '5222'
   * msg_domain   'weaver'
   * msg_token    'nhtjrjdsft591owm523l8m5e'
   * msg_udid     'Nqp5Q65J'
   * pc_encrypt   0
   * pc_port      '7070'
   * @param params
   */
  constructor(params) {
    const {
      msg_token,
      msg_udid,
      msg_domain,
      api_ip,
      pc_port = '7070',
      pc_encrypt
    } = params;

    let currentUser = getCurrentUser();

    console.log('api_ip', api_ip);

    this.wsUrl = (pc_encrypt ? 'wss://' : 'ws://') + api_ip + ':' + pc_port + '/ws/';
    this.serverIp = `${api_ip}:${pc_port}`;

    this.token = msg_token;
    this.domain = msg_domain;
    
    // this.domain = 'iz23t7ry645z';

    this.msgUdid = msg_udid;
    this.msgUserId = currentUser.base_user_id;
    this.resource = 'pc';

    this.myBaseId = this.getMessageId(this.msgUserId);

    //当前状态是否连接
    this.connected = false;
    //XMPP连接
    this.connection = null;

    this.init();
  }

  /**
   *
   * {
   *  ERROR:0,
   *  CONNECTING:1,
   *  CONNFAIL:2,
   *  AUTHENTICATING:3
   *  AUTHFAIL:4
   *  CONNECTED:5,
   *  DISCONNECTED:6,
   *  DISCONNECTING:7
   *  ATTACHED:8,
   *  REDIRECT:9,
   *  CONNTIMEOUT:10
   * }
   */
  onConnect(status, data) {
    console.log('[websocket] - onConnect:', status, data);

    if (status === Strophe.Status.CONNECTING) {
      octa.connected = false;
      console.log('[websocket] - Strophe is connecting.');
    } else if (status === Strophe.Status.CONNFAIL) {
      octa.connected = false;
      console.log('[websocket] - Strophe failed to connect.');
    } else if (status === Strophe.Status.AUTHFAIL) {
      console.log('[websocket] - Strophe is authfail.');
      octa.connected = false;
    } else if (status === Strophe.Status.AUTHENTICATING) {
      console.log('[websocket] - Strophe is authenticating.');
      octa.connected = false;
    } else if (status === Strophe.Status.DISCONNECTING) {
      console.log('[websocket] - Strophe is disconnecting.');
      octa.connected = false;
    } else if (status === Strophe.Status.DISCONNECTED) {
      console.log('[websocket] - Strophe is disconnected.');
      octa.connected = false;
    } else if (status === Strophe.Status.CONNECTED) {
      console.log('[websocket] - Strophe is connected.');
      octa.afterConnected();
    } else if (status === Strophe.Status.ATTACHED) {
      console.log('[websocket] - Strophe is attached.');
    } else if (status === Strophe.Status.ERROR) {
      octa.connected = false;
      // conflict 
      console.log('[websocket] - Strophe is error.');
      octa.afterError(data);
    } else if (status === Strophe.Status.REDIRECT) {
      octa.connected = false;
      console.log('[websocket] - Strophe is redirect.');
    } else if (status === Strophe.Status.CONNTIMEOUT) {
      octa.connected = false;
      console.log('[websocket] - Strophe is conntimeout.');
    }
  }

  afterError(data) {
    if (data === 'conflict') {
      // 别的端上线了
      if (this.wsCallback) {
        this.wsCallback('conflict');
      }
    }
    
    // 普通的掉线 
    else {
      this.wsCallback('disconnect');
    }
  }

  afterConnected() {
    this.connected = true;
    // 首先要发送一个<presence>给服务器（initial presence）
    this.send($pres().tree());

    // 当接收到<message>节，调用onMessage回调函数
    this.addHandle('message', this.onMessage);
    //this.addHandle('iq', this.onIQ);

    // setTimeout(() => {
      this.fetchChatList();
    // }, 1000);
  }

  addHandle(type, callback) {
    this.connection.addHandler((msg) => {
      callback(msg);
      return true;
    }, null, type, null, null, null);
  }

  getXMPPUserIMId(baseUserId) {
    if (!this.msgUdid) {
      return baseUserId;
    }

    try {
      var sufs = '|' + this.msgUdid.toLowerCase();
      var index = baseUserId.toLowerCase().indexOf(sufs);

      if (index == -1) {
        return baseUserId + sufs;
      } else {
        return baseUserId.substring(0, index) + sufs;
      }
    } catch (e) {
    }
  }

  buildToId(id, isGroup) {
    if (isGroup) {
      return `${id}@group.${this.domain}`;
    }

    let xmppId = this.getXMPPUserIMId(id);
    return `${xmppId}@${this.domain}`;
  }

  /**
   * 生曾发送者或者收信人的 id
   *
   * @param id
   * @param isGroup 是不是在群聊
   * @returns {string}
   */
  getMessageId(id, isGroup = false) {
    return this.buildToId(id, isGroup) + '/' + this.resource;
  }

  connect() {
    let xmppUserId = this.getXMPPUserIMId(this.msgUserId);
    this.connection.connect(
      this.getMessageId(this.msgUserId),
      this.token,
      this.onConnect,
      60,
      1,
      this.resource,
      xmppUserId
    );
  }
  
  reConnect(callback) {
    let xmppUserId = this.getXMPPUserIMId(this.msgUserId);
    this.connection.connect(
      this.getMessageId(this.msgUserId),
      this.token,
      (status, data) => {
        this.onConnect(status, data);

        if (this.connected) {
          callback && callback();  
        }
      },
      60,
      1,
      this.resource,
      xmppUserId
    );
  }

  init() {
    Strophe.Bosh.prototype.strip = 'body';

    this.connection = new Strophe.Connection(this.wsUrl, {
      keepalive: true,
      protocol: 'ws'
    });

    this.connection.rawInput = (data) => {
      console.log('%cRECV[rawInput]: ' + data, 'color: #999');
    };

    this.connection.rawOutput = (data) => {
      console.log('%cSENT[rawOutput]: ' + data, 'color: #999');
    };

    this.connect();
  }

  send(obj) {
    let self = this;
    let ____realSend = () => {
      try {
        self.connection.send(obj);
      } catch (e) {
        console.log('[websocket] - send message error:', e);
      }
    };

    if (this.connect) {
      ____realSend();
      return;
    }

    this.reConnect(() => {
      ____realSend();
    });
  }

  sendIQ(obj, callback, errback, timeout) {
    let self = this;
    let ____realSend = () => {
      try {
        self.connection.sendIQ(obj, callback, errback, timeout);
      } catch (e) {
        console.log('[websocket] - send iq error:', e);
      }
    };

    if (!this.connected) {
      this.reConnect(() => {
        ____realSend();
      });
      return;
    } 

    ____realSend();
  }

  /**
   * 发送回执的时候，to 需要有 confirm
   *
   * @param message
   */
  sendReceipt(message) {
    console.log('[websocket] - 发送回执', message.xmppId);

    var toArr = message.oldFrom.split('@');
    var newTo = toArr[ 0 ] + '@confirm.' + this.domain;

    let reply = $msg({
      id: message.xmppId,
      to: newTo,
      from: message.oldTo,
      type: 'headline'
    });

    //.cnode(Strophe.xmlElement('body', '', JSON.stringify(message.content)));

    if (this.connected) {
      this.connection.send(reply.tree());
    }
  }

  /**
   *  IMAPI.sendMsg('MQqoEHyG|1694', msgcontent);
   *
   *    FW:TxtMsg 文本
   *    FW:ImgMsg 图片
   *    FW:VoiceMsg 语音
   *    FW:LBSMsg 位置
   *    FW:InfoNtf 小灰条系统信息
   *
   * @param msg
   * @param isRedirect
   */
  sendMsg(msg, isRedirect) {
    let toJID = this.buildToId(msg.to, false);
    let reply = this.buildMsg(msg, toJID, isRedirect);
    this.send(reply);
  }

  /**
   *
   * @param msg
   * @param isRedirect
   */
  sendGroupMsg(msg, isRedirect) {
    let toJID = this.buildToId(msg.to, true);
    let reply = this.buildMsg(msg, toJID, isRedirect);
    this.send(reply);
  }

  buildMsg(msg, toId, isRedirect) {
    let msgContent = {};

    let oriExtra = msg.extra;
    let atUserIds = [];
    if (oriExtra) {
      atUserIds = oriExtra.msg_at_userid || [];
    }

    if (atUserIds.length > 0) {
      msg.extra.msg_at_userid = _.uniq(atUserIds).map(id => {
        return id !== 'msg_at_all' ? `${id}|${this.msgUdid}` : id;
      }).join(',');
    }

    switch (msg.objectName) {
      case MessageTypes.text:
        msgContent = {
          content: msg.content,
          extra: JSON.stringify(msg.extra),
          // sendTime: msg.sendTime,
        };
        break;

      case MessageTypes.img:
        msgContent = {
          imgUri: msg.imgUri,       // 原图地址
          extra: JSON.stringify(msg.extra),
          // sendTime: msg.sendTime,
          content: msg.content, // 缩略图 base64
        };
        break;

      case MessageTypes.voice:
        msgContent = {
          // duration： 时长
          // voiceUrl： 语音文件地址
          // reciveIds:  接收者ids，以逗号分隔
          // bubbleColor: 气泡颜色
          // extra:
        };
        break;

      case MessageTypes.file:
        msgContent = {
          content: msg.content,
          extra: JSON.stringify(msg.extra),
        };
        break;

      case MessageTypes.rich:
        msgContent = [
          {
            // content:
            // url:
            // imageUrl:
            // extra
          }
        ];
        break;

      case MessageTypes.link:
        msgContent = {
          content: msg.content,
          extra: JSON.stringify(msg.extra),
        };
        break;

      case MessageTypes.personCard:
        msgContent = {
          content: msg.content,
          extra: JSON.stringify(msg.extra),
        };
        break;

      case MessageTypes.news:
        msgContent = {
          content: msg.content,
          extra: JSON.stringify(msg.extra),
        };
        break;

      case MessageTypes.custom:
        msgContent = {
          content: msg.content,
          extra: JSON.stringify(msg.extra),
        };
        break;

      default:
        // ntf dntf 都不是客户端发出去的，而且都不需要 pushContent
        break;
    }

    if (!msgContent.objectName) { // objectName 不存在的时候，转发
      msgContent.objectName = msg.objectName;
    }

    let reply = $msg({
      id: msg.id,
      to: toId,
      from: this.myBaseId,
      type: 'chat'
    });

    // 发送者信息不需要携带
    // let userInfo = msg.fromUserInfo;
    // reply
    //   .cnode(Strophe.xmlElement('fromUserInfo', { xmlns: 'urn:xmpp:fromUserInfo' }))
    //   .cnode(Strophe.xmlElement('name', '', userInfo.name)).up()
    //   .cnode(Strophe.xmlElement('type', '', userInfo.type)).up()
    //   .cnode(Strophe.xmlElement('tenant_id', '', '张三')).up()
    //   .cnode(Strophe.xmlElement('tenantName', '', '张三')).up()
    //   .up();

    reply.c('body', null, JSON.stringify(msgContent));

    // reply
    //   .c('time', { xmlns: 'urn:xmpp:time' })
    //   .c('stamp', null, moment(msg.sendTime).format());

    return reply.tree();
  }

  /**
   *
   *  id='CF422031-BC3E-4919-9574-829A7035DACD'
   *   for='XXXX'
   *   to='XXXX'
   *   type='get'
   *   xmlns='http://weaver.com.cn/getConversation'
   */
  fetchChatList(pageSize = 100) {
    let params = { pageSize };
    let iq = this.buildIQ('http://weaver.com.cn/getConversation', 'get', params);

    this.sendIQ(iq, data => {
      let chat
      this.disturb({}, (disturbData) => {
        const { 
          content: { nopushUsers } 
        } = disturbData;

        const currentUser = getCurrentUser();

        let chatListIq = this.parseOnIQ(data, iq);
        let chatList = chatListIq.conversations.map(con => {
          let targetId = con.targetid;

          let [ one, two ] = targetId.split(',');
          let you = one === currentUser.base_user_id ? two : one;

          let date = new Date(parseInt(con.lasttime));
          let unreadCount = parseInt(con.unreadcount);

          let targetType = parseInt(con.targettype);
          let isGroup = targetType === 1;

          return {
            id: you,
            isGroup,
            date: moment(date),
            name: con.targetname,
            isTop: con.istop === '1',
            lastTime: con.lasttime * 2,
            targetType,
            targetId,
            unreadCount,
            last: con.msgcontent,
            fromUserId: con.userid,
            
            // 新增属性
            groupName: con.groupName,
            groupIconUrl: con.groupIconUrl,
          };
        });

        // 成功了
        if (octa.wsCallback) {
          octa.wsCallback('iq', {
            chatList,
            nopushUsers
          });
        }
      });
    }, error => {
      console.error('send iq error', error);
    });
  }


  /**
   *
   * @param targetId
   * @param targetType
   * @param fromUserId
   * @param lastTime 时间戳//初始时间戳应大于当前时间戳，后续可跟踪返回时间戳
   * @param pageSize
   */
  fetchHistory(targetId, targetType, fromUserId, lastTime, pageSize, type, otherprops) {
    let params = {
      targetType,
      // targetId: targetId + '|' + this.msgUdid,
      // fromUserId: fromUserId + '|' + this.msgUdid,
      targetId,
      fromUserId,
      lastTime,
      pageSize
    };

    console.log('[websocket] - fetch history:', targetId, targetType, fromUserId, lastTime, pageSize);

    let xmlns = xmlnsNameSpaces.history;

    if (type === 'searchHistory') {
      xmlns = xmlnsNameSpaces.searchHistory;
      params = {...params, ...otherprops};
    }

    let iq = this.buildIQ(xmlns, 'get', params);
    this.sendIQ(iq, data => {
      // 成功了
      console.log('send iq success', data);
      this.onIQ(data, params);
    }, error => {
      console.error('send iq error', iq);
    });
  }

  /**
   * 全局查询聊天记录,按keyword查询
   */
  globalSearchChatRecord(params) {
    if (!params instanceof Object) {
      return
    }

    const xmlns = xmlnsNameSpaces.globalSearchHistory;

    let iq = this.buildIQ(xmlns, 'get', params);
    this.sendIQ(iq, data => {
      this.onIQ(data)
    }, () => {
      console.error('send iq error:', iq);
    })
  }

  /**
   * 多端同步消除 未读
   * 
   * @param {string} content 对方的 id
   * @param {*} msgId 最后一条 msg 的 id
   */
  sendClearMsg(content, isGroup = false) {
    const myId = getCurrentUser().base_user_id;
    
    let toId = this.buildToId(myId);
    let fromId = this.getMessageId(myId);

    let reply = $msg({
      id: uuid.v4(),
      to: toId, // 3333|udid@domain
      from: fromId,
      type: 'chat'
    });
    
    reply.c('body', null, JSON.stringify({
      objectName: MessageTypes.clear,
      extra: JSON.stringify({}),
      content: isGroup ? content : `${content}|${this.msgUdid}`,
    }));

    // reply
    //   .c('time', { xmlns: 'urn:xmpp:time' })
    //   .c('stamp', null, moment().format());

    this.send(reply.tree());
  }

  /**
   * 标记已读 to, id, type
   *
   * content: msg_id
   * objectName: MessageTypes.count
   *
   * @param id
   */
  sendCountMsg(msg) {
    // console.log('send message read:', msg, msg.from, msg.to);

    let toId = this.buildToId(msg.from);
    let fromId = this.getMessageId(msg.to);

    if (msg.isGroup) {
      // from 我的id
      fromId = this.myBaseId;
    }

    let reply = $msg({
      id: uuid.v4(),
      to: toId, // 3333|udid@domain
      from: fromId,
      type: 'chat'
    });

    reply.c('body', null, JSON.stringify({
      content: msg.id,
      objectName: MessageTypes.status
    }));

    // reply
    //   .c('time', { xmlns: 'urn:xmpp:time' })
    //   .c('stamp', null, moment(msg.sendTime).format());

    this.send(reply.tree());
  }

  /**
   * 
   * 获取消息阅读状态
   * 
   * @param [] msgIds
   */
  getMsgRead(msgIds, callback) {
    let iq = $iq({
      id: uuid.v4(),
      xmlns: 'http://weaver.com.cn/getMsgRead',
      type: 'get',
      // to: this.domain
    }).c('query', null, JSON.stringify(msgIds));

    this.sendIQ(iq.tree(), data => {
      let msg = parseNormalIQ(data);
      callback(msg);
    });
  }

  /**
   * 
    {
      'objectName' : 'FW:Conop',
      'content' : '',
      'extra' : {
        'targetid':'13|qfdf4su',
        'optype ':'top',
        'opvalue ':'1'
      }
    } 
   * 
   * @param {*} targetId 
   * @param {*} type 
   * @param {*} value 
   */
  sendConopMsg(targetId, type = '', value = 0, isGroup = false) {
    const toId = this.buildToId(getCurrentUser().base_user_id, false);
    const fromId = this.myBaseId;

    const baseId =  isGroup ? targetId : `${targetId}|${this.msgUdid}`;

    let params = {
      'objectName': MessageTypes.conop,
      'content': '',
      'extra': {
        'targetid': baseId,
        'optype': type,
        'opvalue': value.toString()
      }
    };

    // 删除单条信息
    if (type === 'delmsg') {
      params.content = baseId;
    }

    let reply = $msg({
      id: uuid.v4(),
      to: toId, // 3333|udid@domain
      from: fromId,
      type: 'chat'
    });

    reply.c('body', null, JSON.stringify(params));

    // reply
    //   .c('time', { xmlns: 'urn:xmpp:time' })
    //   .c('stamp', null, moment().format());

    this.send(reply.tree());
  }

  /**
   * 发送撤回信息

    {
      "content" : ""
      "extra" : {
         "msg_id":"05abdd7b-e5c4-4e8c-9080-1ab6d31aadb2",
         "withdrawId":"40shjkuioog6789",
         "notiType":"noti_withdraw"
      }
      "objectName" : "RC:InfoNtf"
    }

   */
  sendWithdrawMessage(msg) {
    const toId = this.buildToId(msg.to, msg.isGroup);
    const fromId = this.myBaseId;

    let params = {
      'objectName': MessageTypes.ntf,
      'content': '',
      'extra': {
        'msg_id': uuid.v4(),
        'withdrawId': msg.id,
        'notiType':"noti_withdraw",
        'msgFrom': 'pc'
      }
    };

    let reply = $msg({
      id: uuid.v4(),
      to: toId, // 3333|udid@domain
      from: fromId,
      type: 'chat'
    });

    reply.c('body', null, JSON.stringify(params));

    // reply
    //   .c('time', { xmlns: 'urn:xmpp:time' })
    //   .c('stamp', null, moment().format());

    this.send(reply.tree());
  }


  // ///////////////////////////////////////////////////////
  // ///////////////////////////////////////////////////////
  // ///////////////////////////////////////////////////////

  /**
   * 创建群
   *
   * @param params
   * @param callback
   * @param errorCallback
   */
  createGroup(params, callback) {
    params.method = 'createGroup';
    params.members = params.members.map(id => `${id}|${this.msgUdid}`);

    let iq = this.buildGroupIQ('creategroup', params);
    this.sendIQ(iq, data => {
      // admins, groupId, members
      let msg = parseNormalIQ(data);
      callback(msg);
    });
  }

  /**
   * 加人
   * { groupId, members, method }
   * @param params
   */
  addPersonToGroup(params, callback) {
    params.method = 'addGroupUsers';
    params.members = params.members.map(id => `${id}|${this.msgUdid}`);

    let iq = this.buildGroupIQ('addmembers', params);
    this.sendIQ(iq, data => {
      let msg = parseNormalIQ(data);
      callback(msg);
    });
  }

  /**
   * 删人
   * { groupId, members, method }
   * @param params
   */
  deletePersonFromGroup(params, callback) {
    params.method = 'deleteGroupUsers';
    params.members = params.members.map(id => `${id}|${this.msgUdid}`);

    let iq = this.buildGroupIQ('removemembers', params);
    this.sendIQ(iq, data => {
      // success
      let msg = parseNormalIQ(data);
      callback(msg);
    });
  }

  /**
   * 更换群主
   * { groupId, admins, method }
   * @param params
   */
  changeOwner(params, callback) {
    params.method = 'changeGroupAdmin';
    
    if (params.admins.length > 0) {
      params.admins = params.admins.map(id => `${id}|${this.msgUdid}`).join(',');
    }

    let iq = this.buildGroupIQ('', params);
    this.sendIQ(iq, data => {
      // success
      let msg = parseNormalIQ(data);
      callback(msg);
    });
  }

  /**
   * 修改群头像 groupIconUrl
   *
   * @param params
   */
  changeGroupAvatar(params, callback) {
    params.method = 'setGroupIcon';

    let iq = this.buildGroupIQ('', params);
    this.sendIQ(iq, data => {
      // success
      let group = parseNormalIQ(data);
      callback(group);
    });
  }

  /**
   * 修改群名称 groupName, groupId
   *
   * @param params
   */
  changeGroupName(params, callback) {
    params.method = 'changeGroupName';

    let iq = this.buildGroupIQ('changname', params);
    this.sendIQ(iq, data => {
      // success
      let group = parseNormalIQ(data);
      callback(group);
    });
  }

  /**
   * 退出群聊
   *
   * @param params
   */
  exitGroup(params, callback) {
    params.method = 'exitGroup';

    let iq = this.buildGroupIQ('quit', params);
    this.sendIQ(iq, data => {
      // success
      let group = parseNormalIQ(data);
      callback(group);
    });
  }

  /**
   * 获取群详情
   *
   * {'groupId':'5850181a-ec83-49e2-9af7-9a291dab05c5'}
   *
   * @param params
   */
  getMemebers(params, callback) {
    let iq = this.buildGroupIQ('getmembers', params, 'get');
    this.sendIQ(iq, data => {
      // success
      let group = parseNormalIQ(data);
      callback(group);
    });
  }

  /**
   * 设置群管理员
   *
   * groupId:73ce7483-8b3b-4d04-b7f7-f21b40c3ac6d
   * groupManagers:[125|ujchgxhx,100660|ujchgxhx]
   * @param params
   */
  setGroupManager(params, callback) {
    params.method = 'setManager';
  
    if (params.groupManagers.length > 0) {
      params.groupManagers = params.groupManagers.map(id => `${id}|${this.msgUdid}`)
    }

    let iq = this.buildGroupIQ('', params);
    this.sendIQ(iq, data => {
      // success
      let msg = parseNormalIQ(data);
      callback(msg);
    });
  }

  /**
   * 取消群管理员
   *
   * groupId: 73ce7483-8b3b-4d04-b7f7-f21b40c3ac6d
   * groupManagers: [125|ujchgxhx, 100660|ujchgxhx]
   * @param params
   */
  cancelGroupManager(params, callback) {
    params.method = 'cancelManagers';

    if (params.groupManagers.length > 0) {
      params.groupManagers = params.groupManagers.map(id => `${id}|${this.msgUdid}`)
    }
    
    let iq = this.buildGroupIQ('', params);
    this.sendIQ(iq, data => {
      // success
      let msg = parseNormalIQ(data);
      callback(msg);
    });
  }
  
  /**
   * 所有群组列表
   * 
   * @param {*} callback 
   */
  fetchAllGroup(callback, obj = {}) {
    const params = {
      method: 'getAllGroups',
      ...obj,
    };
    
    let iq = this.buildGroupIQ('', params);
    this.sendIQ(iq, data => {
      let msg = parseNormalIQ(data);
      callback(msg);
    })
  }
 
  /**
   * 删除消息
   */
  deleteHistoryMessage(params, callback) {
    let iq = $iq({
      id: uuid.v4(),
      xmlns: 'http://weaver.com.cn/deleteHistoryMsg',
      type: 'set',
      to: this.domain
    }).c('query', null, JSON.stringify(params));

    this.sendIQ(iq.tree(), (data) => callback(parseNormalIQ(data)))
  }

  /**
   * 删除回话
   *
   * @param params { targetid }
   */
  deleteConversation(params, callback) {
    let iq = $iq({
      id: uuid.v4(),
      xmlns: 'http://weaver.com.cn/deleteConversation',
      type: 'set',
      to: this.domain
    }).c('query', null, JSON.stringify(params));

    this.sendIQ(iq.tree(), (data) => callback(parseNormalIQ(data)));
  }

  /**
   * 回话置顶
   *
   * @param params { targetid, istop }
   */
  setConversationTop(params, callback) {
    let iq = $iq({
      id: uuid.v4(),
      xmlns: 'http://weaver.com.cn/setConversationTop',
      type: 'set',
      to: this.domain
    }).c('query', null, JSON.stringify(params));

    this.sendIQ(iq.tree(), (res) => callback(parseNormalIQ(res)));
  }

  /**
   * 新信息通知
   */
  disturb(data = {}, callback, type = 'get') {
    let iq = $iq({
      id: `${uuid.v4()}|disturb_pushSetting`,
      type
    })
    .c('query', { xmlns: xmlnsNameSpaces.pushSetting }, JSON.stringify(data));

    this.sendIQ(iq.tree(), data => {
      let msg = parseNormalIQ(data);
      callback(msg);
    });
  }

  /**
   * id, type, pushValue
   *
   * @param params
   */
  setNotiStatus(params, callback) {
    let iq = this.buildNotiIQ('setstatus', params);
    this.sendIQ(iq, (data) => callback(data));
  }

  /**
   * id, type, pushValue
   *  id targetId
   *  type 1 是单聊，2 是群聊
   *
   * @param params
   */
  getNotiStatus(params, callback) {
    let iq = this.buildNotiIQ('getstatus', params);
    this.sendIQ(iq, (data) => callback(data));
  }

  // buildDisturbIQ(method, params, type = 'set') {
  //   let iq = $iq({
  //     id: `${uuid.v4()}|disturb_${method}`,
  //     type
  //   })
  //   .c('query', { xmlns: xmlnsNameSpaces.pushSetting }, JSON.stringify({}));

  //   return iq.tree();
  // }

  buildNotiIQ(method, params, type = 'set') {
    let iq = $iq({
      id: `${uuid.v4()}|noti_${method}`,
      type,
    }).c('query', { xmlns: xmlnsNameSpaces.group }, JSON.stringify(params));

    return iq.tree();
  }

  buildGroupIQ(method, params, type = 'set') {
    let id = uuid.v4();

    if (method) {
      id = `${id}|group_${method}`;
    }

    let iq = $iq({
      id,
      type,
    }).c('query', { xmlns: xmlnsNameSpaces.group }, JSON.stringify(params));

    return iq.tree();
  }

  buildIQ(xmlns, type, params = {}) {
    let msgId = uuid.v4();
    let iq = $iq({
      id: msgId,
      xmlns,
      type,
      to: this.domain
    }).c('query', null, JSON.stringify(params));

    return iq.tree();
  }

  parseOnIQ(iq, originIQ) {
    try {
      let id = iq.getAttribute('id');
      let to = iq.getAttribute('to');     // 1@weaver - 我自己
      let from = iq.getAttribute('from'); // weaver
      let type = iq.getAttribute('type'); // result
      let elems = iq.getElementsByTagName('query');

      let query = elems[ 0 ];
      let originText = Strophe.getText(query);
      let jsonText = escape2Html(originText);
      let jsonObj = JSON.parse(jsonText);

      return {
        ...jsonObj,
        to,
        from,
        type,
        originIQ
      };
    } catch (e) { 
      console.error('[websocket] - error happen[onMessage]:', e);
      return {};
    }
  }

  onIQ(iq, originIQ) {
    console.log('[websocket] - [onIQ]:', iq);

    let iqRet = this.parseOnIQ(iq, originIQ);
    if (octa.wsCallback) {
      octa.wsCallback('iq', iqRet);
    }

    return true;
  }

  /**
   * 接受消息       from="mqqoehyg|1694@mportal"
   * 接受回执消息   from="mqqoehyg|1693@confirm.mportal/pc"
   * 自己多端同步   from="mqqoehyg|1693@syncReciver.mportal/pc"
   *
   // 'mqqoehyg|1693@syncReciver.mportal/pc'.split(/[@\.\/]/)
   // ["mqqoehyg|1693", "syncReciver", "mportal", "pc"]
   // 'mqqoehyg|1693@mportal'.split(/[@\.\/]/)
   // ["mqqoehyg|1693", "mportal"]
   // mqqoehyg|1694@confirm.mportal
   // ["mqqoehyg|1693", "confirm", "mportal"]
   // mqqoehyg|1693@mportal/pc
   // ["mqqoehyg|1693", "mportal", "pc"]
   *
   * @param msg
   */
  onMessage(msg) {
    console.log('[websocket] - [onMessage]:', msg);

    try {
      let message = parseMessage(msg, { domain: octa.domain });
      if (message && !message.isRecipt && !message.error) {
        // 发送回执
        octa.sendReceipt(message);
      }

      // 如果是 clear 或者已读消息的回执，忽略
      if (!message 
        || (message.objectName === MessageTypes.status && message.isRecipt)
        || (message.objectName === MessageTypes.clear && message.isRecipt)
      ) {
        return;
      }

      // 旧的系统消息要屏蔽
      if (message.from.toLowerCase() === octa.msgUdid.toLowerCase()) {
        return;
      }

      // 屏蔽必达信息
      if (message.objectName === MessageTypes.cmd) {
        return;
      }

      // 离线消息忽略
      if (message.offline) {
        return;
      } 

      if (octa.wsCallback) {
        octa.wsCallback('message', message);
      }
    } catch (e) {
      console.error('error:', e);
    }
  }

}

let octa = null;

export default function getInstance(params) {
  if (octa == null && params) {
    octa = new Octa(params);
    console.log('[websocket] - initialize octa.');
  }

  return octa;
}
