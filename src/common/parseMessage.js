import { $msg, Strophe, $pres, $iq } from '../exlib/strophe.min';
import { escape2Html } from './htmlUtil';
import { tryParse } from './jsonUtil';
import { MessageTypes } from './types';

import moment from 'moment';
import _ from 'lodash';
import uuid from 'uuid';

/**
 *
 * @param type
 * @returns {boolean}
 */
function isConfirm(type) {
  return type === 'headline';
}

export function getPushContentByType(obj) {
  switch (obj.objectName) {
    case MessageTypes.text:
      return obj.content.substring(0, 20);

    case MessageTypes.file:
      return '[文件]';

    case MessageTypes.img:
      return '[图片]';

    case MessageTypes.lbs:
      return '[位置]';

    case MessageTypes.rich:
      return '[图文]';

    case MessageTypes.voice:
      return '[声音]';

    case MessageTypes.link:
      return `${obj.content.substring(0, 13)}`;

    case MessageTypes.personCard:
      return `[名片: ${obj.content.substring(0, 7)}]`;

    case MessageTypes.news:
      return `${obj.content.substring(0, 13)}`;

    case MessageTypes.custom:
      switch(obj.extra.pushType) {
        case MessageTypes.shake:
          return `[抖了你一下]`;
        case MessageTypes.voip:
          return `[音视频结果]`;
        default:
          return '';
      }   
      
    default: 
      return '';
  }
}


/**
 * 这里分析出来的发送者 接受者就是正确的了
 *
 * @param msg
 * @param params
 * @returns {*}
 */
export default function parseMessage(msg, params) {
  const { domain } = params;

  const personSyncFlag = `@confirm.${domain}`;  // 同步消息标志
  const groupSyncFlag = `@confirm.group.${domain}`;
  const groupFlag = `@group.${domain}`;

  try {
    const xmppId = msg.getAttribute('id'); // 这里可能不是 msg_id

    // chat 普通聊天 
    // headline 回执
    const type = msg.getAttribute('type');  
    const to = msg.getAttribute('to');     // 86|nqp5q65j@weaver/pc
    const from = msg.getAttribute('from'); // 78|nqp5q65j@confirm.weaver

    let toId = to.split('@')[ 0 ];
    let fromId = from.split('@')[ 0 ];

    let isSync = false;  // 是不是同步消息
    let isGroup = false; // 是不是群信息

    // 判断是不是群
    if (from.indexOf(groupFlag) > 0) {
      isGroup = true;
      // 相当于那个人发送给这个群的信息，所以
      // 获取群 id 要这样子
      toId = from.substring(from.lastIndexOf('/') + 1); 
    }

    // to   = "13|nqp5q65j @ weaver / pc"
    // from = "13|nqp5q65j @ confirm.weaver / 4|nqp5q65j"
    // 多端同步，我在另一个客户端发送了信息
    if (toId === fromId // 发送者与接收者是同一个人，就是同步消息
      && (from.indexOf(personSyncFlag) > 0 || from.indexOf(groupSyncFlag) > 0)) { // 单人的同步 或者 群的同步
      isSync = true;
      fromId = toId; // 是我发送的 所以相同的 id 是我自己
      toId = from.substring(from.lastIndexOf('/') + 1); // 可能是群也可能是人
    }

    // 调整一下格式，不需要 | 后面的东西
    if (toId.indexOf('|')) {
      toId = toId.split('|')[0];
    }

    if (fromId.indexOf('|')) {
      fromId = fromId.split('|')[0];
    }

    /**
     * id 优先取 extra 里面的 msg_id, 如果没有 取 xmpp 的 id。
     */
    let message = {
      xmppId,
      isAppMsg: false, // 应用消息
      isGroup,
      isSync,// 发送者多端同步
      isSyncReceiver: false, // 接受方多端同步
      isRecipt: isConfirm(type), // 是否回执
      oldTo: to,
      oldFrom: from,

      loading: false,
      error: false,
      
      from: fromId,
      to: toId,
    };

    const bodyElems = msg.getElementsByTagName('body');
    if (bodyElems.length > 0) {
      const body = bodyElems[ 0 ];
      const originText = Strophe.getText(body);
      const jsonTextStr = escape2Html(originText);
      const textObj = JSON.parse(jsonTextStr);
      let extra = textObj.extra || '';

      message.objectName = textObj.objectName;     
      message.type = textObj.objectName;

      const timeEles = msg.getElementsByTagName('time');
      if (timeEles.length > 0) {
        const dateStr = Strophe.getText(timeEles[ 0 ].getElementsByTagName('stamp')[ 0 ]);
        message.date = moment(dateStr);
      } else {
        message.date = moment();
      }

      // 离线消息
      // <delay xmlns="urn:xmpp:delay" from="weaver" stamp="2018-04-27T02:17:25.847Z"/>
      const delayEles = msg.getElementsByTagName('delay');
      message.offline = delayEles.length > 0;

      // ///////////////////////////////////////////////////////////////
      // ///////////////////////////////////////////////////////////////
      // ///////////////////////////////////////////////////////////////

      // 如果为老版本系统信息，先不处理
      if (message.objectName === MessageTypes.system) {
        return null;
      }

      // 通知信息
      if (message.objectName === MessageTypes.dntf && textObj.extension && textObj.operator) {
        const realId = from.split('/')[ 1 ];
        message.from = realId;
      }

      // 解析 extra 获取 msg_id
      if (_.isString(extra)) {
        extra = tryParse(extra);
      }

      // 解析一下 receiverids
      if (extra && extra.receiverids) {
        extra.receiverIds = extra.receiverids.split(',').filter(id => id && id !== message.from);
      }
      
      // id 只可能这两种情况，还有下面的 已读中的 content
      message.id = extra.msg_id || xmppId;

      // 如果有被 @ 的人, ', 1,2,3,4,'
      if (extra.msg_at_userid && _.isString(extra.msg_at_userid)) {
        // 去掉 udid
        const atIds = extra.msg_at_userid
                            .split(',')
                            .filter(id => id)
                            .map(id => {
                              if (id.indexOf('|') > 0) {
                                return id.split('|')[0];
                              }

                              return id;
                            });

        const isAtAll = atIds.length === 1 && atIds[0] === 'msg_at_all';
        // 新收到的消息才有这些东西，chatStore 里面要修改 chatlist
        message.isAtAll = isAtAll;
        message.atIds = atIds;
      }

      // 清空未读数消息不提醒
      if (message.objectName === MessageTypes.clear && toId === fromId) {
        // content 有可能是 clearAll
        const toDummy = textObj.content;
        if (toDummy.indexOf('|') > 0) {
          message.to = toDummy.split('|')[0];
        }
      }
          
      // 标记已读的信息
      // 标记已读信息, content 里面是标记的人的 id
      if (message.objectName === MessageTypes.status) {
        message.id = textObj.content;
      }

      if (message.objectName.indexOf(MessageTypes.withdraw) > 0) {
        // 撤回消息
        message.objectName = MessageTypes.withdraw;
      }

      // 好像不需要做什么处理，收到这样的信息，要删除 withdrawId 的信息
      // if (message.objectName === MessageTypes.ntf && extra.notiType && extra.notiType === 'noti_withdraw') { }

      if (message.id.indexOf('a_') > -1 || message.id.indexOf('s_') > -1) {
        message.isAppMsg = true;
      }

      return {
        ...message,
        ...textObj,
        extra,
        pushContent: getPushContentByType(textObj)
      };
    }

    // 错误
    return message;
  } catch (e) {
    console.error('[websocket] - error happen - [onMessage]:', e);
  }

  return null;
}



/**
 * fromUserId,
 * opBody
 *   content, extra, objectName, targetType, toUserid
 * sendTime,
 * targetId
 * @param message
 */
export function parseHistoryMessage(message) {
  const { fromUserId, opBody, targetId } = message;
  const isGroup = opBody.targetType === '1';

  // 群通知信息 content 比较复杂
  if (!opBody.extra && _.isString(opBody.content) 
      && opBody.objectName === MessageTypes.dntf) {
    opBody.content = tryParse(opBody.content);
  }

  if (opBody.extra && opBody.extra.countids && _.isString(opBody.extra.countids)) {
    opBody.extra.countids = opBody.extra.countids.split(',').filter(id => id);
  }

  if (opBody.extra && opBody.extra.receiverids && _.isString(opBody.extra.receiverids)) {
    opBody.extra.receiverIds = opBody.extra.receiverids.split(',').filter(id => id && id !== fromUserId);
  }

  if (opBody.objectName.indexOf(MessageTypes.withdraw) > 0) {
    // 撤回消息
    opBody.objectName = MessageTypes.withdraw;
    opBody.id = opBody.extra.msg_id; // 真正的消息 id 在这里
  }

  let ret = {
    id: opBody.extra
      ? opBody.extra.msg_id
      : uuid.v4(),
    isGroup,
    isAppMsg: false,
    loading: false,
    error: false,
    from: fromUserId,
    to: targetId,
    pushContent: getPushContentByType(opBody),
    ...opBody
  };

  if (ret.id.indexOf('a_') > -1 || ret.id.indexOf('s_') > -1) {
    ret.isAppMsg = true;
  }

  return ret;
}

/**
 *
 * @param msg
 * @returns {{id: string, type: string, to: string, from: string, iqFor: string}}
 */
export function parseNormalIQ(msg) {
  const id = msg.getAttribute('id');
  const type = msg.getAttribute('type');  // chat --普通聊天, headline --回执

  const to = msg.getAttribute('to');     // c5b23335-d22f-49f8-9b7d-65caaeea2e01|group_creategroup
  const from = msg.getAttribute('from'); // 78|nqp5q65j@confirm.weaver
  const iqFor = msg.getAttribute('for'); // 78|nqp5q65j@confirm.weaver

  const retDummy = {
    id, type, to, from, iqFor
  };

  const bodyElems = msg.getElementsByTagName('query');
  if (bodyElems.length > 0) {
    const body = bodyElems[ 0 ];
    const originText = Strophe.getText(body);
    const jsonTextStr = escape2Html(originText);
    try {
      retDummy.content = JSON.parse(jsonTextStr);
    } catch (e) {
      retDummy.content = {};
      console.error('parseNormalIQ error: ', e);
    }
  }

  return retDummy;
}
