import { $msg, Strophe, $pres, $iq } from '../exlib/strophe.min';
import { escape2Html } from './htmlUtil';
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

/**
 * 这里分析出来的发送者 接受者就是正确的了
 *
 * @param msg
 * @param params
 * @returns {*}
 */
export default function parseMessage(msg, params) {
  const { domain } = params;

  const personSyncFlag = '@confirm.' + domain;  // 同步消息标志
  const groupSyncFlag = '@confirm.group.' + domain;
  const groupFlag = '@group.' + domain;

  try {
    let id = msg.getAttribute('id'); // sfsdff450x-sdfsdf-sfsdfsdf-sdffff
    let type = msg.getAttribute('type');  // chat --普通聊天, headline --回执

    let to = msg.getAttribute('to');     // 86|nqp5q65j@weaver/pc
    let from = msg.getAttribute('from'); // 78|nqp5q65j@confirm.weaver

    let toId = to.split('@')[ 0 ];
    let fromId = from.split('@')[ 0 ];
    let isSync = false;

    let isGroup = false; // 也是 id

    // 判断是不是群
    if (from.indexOf(groupFlag) > 0) {
      isGroup = true;
      // 相当于那个人发送给这个群的 信息，所以
      toId = from.substring(from.lastIndexOf('/') + 1); // 获取群 id
    }

    // to   = "13|nqp5q65j @ weaver / pc"
    // from = "13|nqp5q65j @ confirm.weaver / 4|nqp5q65j"
    // 多端同步，我在另一个客户端发送了信息
    if (toId === fromId
      && (from.indexOf(personSyncFlag) > 0 || from.indexOf(groupSyncFlag) > 0)) {
      isSync = true;
      fromId = toId; // 是我发送的 所以相同的 id 是我自己
      toId = from.substring(from.lastIndexOf('/') + 1); // 可能是群也可能是人
    }

    // 调整一下格式，不需要 | 后面的东西
    if (toId.indexOf('|')) {
      toId = toId.split('|')[ 0 ];
    }

    if (fromId.indexOf('|')) {
      fromId = fromId.split('|')[ 0 ];
    }

    let message = {
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

    let bodyElems = msg.getElementsByTagName('body');
    if (type === "chat" && bodyElems.length > 0) {
      let body = bodyElems[ 0 ];
      let originText = Strophe.getText(body);
      let jsonTextStr = escape2Html(originText);
      let textObj = JSON.parse(jsonTextStr);

      message.objectName = textObj.objectName;

      // 通知信息
      if (textObj.extension && textObj.operator) {
        let realId = from.split('/')[ 1 ];
        message.from = realId;
      }

      let timeEles = msg.getElementsByTagName('time');
      if (timeEles.length > 0) {
        let dateStr = Strophe.getText(timeEles[ 0 ].getElementsByTagName('stamp')[ 0 ]);
        message.date = moment(dateStr);
      } else {
        message.date = moment();
      }

      //<delay xmlns="urn:xmpp:delay" from="weaver" stamp="2018-04-27T02:17:25.847Z"/>
      let delayEles = msg.getElementsByTagName('delay');
      message.offline = delayEles.length > 0;

      if (_.isString(textObj.extra)) {
        try {
          textObj.extra = JSON.parse(textObj.extra);
        } catch (e) {
          // 先不管，CustomMsg 里面的 extra 可能会 普通字符串
        }
      }

      message.id = textObj.extra
        ? textObj.extra.msg_id
        : id;

      // 标记已读信息, content 里面是标记的人的 id
      if (toId === fromId && message.objectName === MessageTypes.clear) {
        let toDummy = textObj.content;
        if (toDummy.indexOf('|')) {
          message.to = toDummy.split('|')[ 0 ];
        }
      }

      // 标记已读的信息
      if (message.objectName === MessageTypes.status) {
        message.id = textObj.content;
      }

      if (message.objectName.indexOf(MessageTypes.withdraw) > 0) {
        // 撤回消息
        message.objectName = MessageTypes.withdraw;
        message.id = textObj.extra.msg_id; // 真正的消息 id 在这里
      }

      message.type = textObj.objectName;

      return {
        ...message,
        ...textObj,
        pushContent: getPushContentByType(textObj)
      };
    }

    else if (type === 'headline') {
      let body1 = bodyElems[ 0 ];
      let originText1 = Strophe.getText(body1);
      let jsonTextStr1 = escape2Html(originText1);
      let textObj2 = JSON.parse(jsonTextStr1);

      if (_.isString(textObj2.extra)) {
        try {
          textObj2.extra = JSON.parse(textObj2.extra);
        } catch (e) {
          // 先不管，CustomMsg 里面的 extra 可能会 普通字符串
        }
      }

      message.id = textObj2.extra
                  ? textObj2.extra.msg_id
                  : id;

      if (textObj2.objectName === MessageTypes.status) {
        // 回执消息 必须是 相同的 id
        message.id = textObj2.content;
      }

      message.objectName = textObj2.objectName;
      message.type = textObj2.objectName;

      // 回执
      return message;
    }

    else {
      // 错误
      return message;
    }

  } catch (e) {
    console.error('[websocket] - error happen - [onMessage]:', e);
  }

  return null;
}


export function getPushContentByType(obj) {
  switch (obj.objectName) {
    case MessageTypes.text:
      return obj.content.substring(0, 10);

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
  }
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
  const isGroup = opBody.targetType == '1';

  // 群通知信息 content 比较复杂
  if (!opBody.extra && _.isString(opBody.content) && opBody.objectName === MessageTypes.dntf) {
    opBody.content = JSON.parse(opBody.content);
  }

  if (opBody.objectName.indexOf(MessageTypes.withdraw) > 0) {
    // 撤回消息
    opBody.objectName = MessageTypes.withdraw;
    opBody.id = opBody.extra.msg_id; // 真正的消息 id 在这里
  }

  return {
    id: opBody.extra
      ? opBody.extra.msg_id
      : uuid.v4(),
    isGroup,
    loading: false,
    error: false,
    from: fromUserId,
    to: targetId,
    pushContent: getPushContentByType(opBody),
    ...opBody
  };
}

/**
 *
 * @param msg
 * @returns {{id: string, type: string, to: string, from: string, iqFor: string}}
 */
export function parseNormalIQ(msg) {
  let id = msg.getAttribute('id'); // sfsdff450x-sdfsdf-sfsdfsdf-sdffff
  let type = msg.getAttribute('type');  // chat --普通聊天, headline --回执

  let to = msg.getAttribute('to');     // c5b23335-d22f-49f8-9b7d-65caaeea2e01|group_creategroup
  let from = msg.getAttribute('from'); // 78|nqp5q65j@confirm.weaver
  let iqFor = msg.getAttribute('for'); // 78|nqp5q65j@confirm.weaver

  let retDummy = {
    id, type, to, from, iqFor
  };

  let bodyElems = msg.getElementsByTagName('query');
  if (bodyElems.length > 0) {
    let body = bodyElems[ 0 ];
    let originText = Strophe.getText(body);
    let jsonTextStr = escape2Html(originText);
    try {
      retDummy.content = JSON.parse(jsonTextStr);
    } catch (e) {
      retDummy.content = {};
      console.error('parseNormalIQ error: ', e);
    }
  }

  return retDummy;
}
