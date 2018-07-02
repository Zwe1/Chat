import { getCurrentDB } from "./lowdbUtil";

function db() {
  return getCurrentDB('message');
}

/**
 * 获取这两个人的聊天记录
 *
 * @param one
 * @param another
 * @param page
 * @param pageSize
 *
 * @returns {*}
 */
export function getMessageHistory(one, another, page = 1, pageSize = 20) {
  let arr = [one, another].sort();

  let firstUserChatList = db().get(arr[ 0 ]);
  if (!firstUserChatList.value()) {
    db().set(arr[ 0 ], []).write();
    return [];
  }

  let secondLayer = firstUserChatList.get(arr[1]);
  if (!secondLayer.value()) {
    firstUserChatList
      .set(arr[1], [])
      .write();
    return [];
  }

  // 分页显示
  let start = (page - 1) * pageSize;
  let end = start + pageSize;
  return secondLayer.slice(start, end).value();
}

/**
 *
 * @param message
 */
export function saveMessage(message) {
  console.log('save message:', message);

  let arr = [message.to, message.from].sort();

  let firstUserChatList = db().get(arr[ 0 ]);
  if (!firstUserChatList.value()) {
    db()
      .set(arr[0], [])
      .write();
  }

  let secondLayer = firstUserChatList.get(arr[1]);
  if (!secondLayer.value()) {
    firstUserChatList
      .set(arr[1], [])
      .write();
  }

  secondLayer
    .push(message)
    .write();
}


function _first(id) {
  return db().get(id);
}