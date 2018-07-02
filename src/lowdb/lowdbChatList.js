import { getCurrentDB } from "./lowdbUtil";
import _ from "lodash";
import moment from "moment";

function db() {
  return getCurrentDB('chatlist');
}

/* chatList */
export function setChatList(list = []) {
  let newList = list.map(chat => {
    let newChat = {
      ...chat
    };

    newChat.date = chat.date
      ? (_.isString(chat.date) ? chat.date : chat.date.toJSON())
      : moment().toJSON();

    return newChat;
  });

  db().set('chatList', newList).write();
}

export function getChatList() {
  return db().get('chatList')
    .map(chat => {
      // console.log('data',chat);
      chat.date = moment(chat.date);
      return chat;
    })
    .value();
}

//export function addToChatList(item) {
//  db().get('chatList')
//    .push(item)
//    .write();
//}
//
//export function removeFromChatList(item) {
//  db().get('chatList')
//    .remove({ id: item.id })
//    .write();
//}
//
//export function updateChatListById(item) {
//  db().get('chatList')
//    .find({
//      id: item.id
//    })
//    .assign(item)
//    .write();
//}

