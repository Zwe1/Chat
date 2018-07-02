import LoginStore from './loginStore';
import AppStore from './appStore';
import ContactStore from './contactStore';
import HomeStore from './homeStore';
import ChatStore from './chatStore';
import DbStore from './dbStore';

import moment from 'moment';

//import { getGroup, saveGroup } from '../lowdb/lowdbGroup';

class UtilStore {
  constructor() {
  	this.loginStore = new LoginStore(this);
  	this.appStore = new AppStore(this);
  	this.contactStore = new ContactStore(this);
  	this.homeStore = new HomeStore(this);
  	this.chatStore = new ChatStore(this);
  	this.dbStore = new DbStore(this);
  }

  // 跳转到聊天
  forwardToChat = userOrGroup => {
  	const { changeActiveBar, activeBar, mainTheme } = this.homeStore;
    const bar = mainTheme.navlist.filter(v => v.nav_func === -2);

    // 1. tab 切换
    if (activeBar !== `${bar.nav_func}_${bar.nav_id}`) {
      changeActiveBar(`${bar.nav_func}_${bar.nav_id}`);
      document.querySelector('.chat').click();
    }

    // 2. 在列表中寻找当前这个人
    const { chatList, addPersonToChatList, selectPersonToChat } = this.chatStore;

    let cur;

    // 群组
    if (userOrGroup.groupId) {
      let id = userOrGroup.groupId;
      let name = userOrGroup.groupName;

      cur = chatList.filter(chat => chat.id === id)[ 0 ];

      if (!cur) {
        cur = {
          unreadCount: 0,
          id,
          name,
          avatar: userOrGroup.avatar,
          isGroup: true,
          date: moment(),
          lastTime: new Date().valueOf() * 2,
          last: '',
        };

        addPersonToChatList(cur);
      }
    } else {
      // ren
      cur = chatList.filter(person => person.id === userOrGroup.base_user_id)[ 0 ];

      if (!cur) {
        // 2.1 如果没有，要加到 chatList 里面
        cur = {
          unreadCount: 0,
          id: userOrGroup.base_user_id || userOrGroup.id,
          name: userOrGroup.base_user_name || userOrGroup.name,
          avatar: userOrGroup.avatar,
          lastTime: new Date().valueOf() * 2,
          date: moment(),
          last: '',
          isGroup: false,
        };

        addPersonToChatList(cur);
        // 更新数据库
        //const userList = chatList.filter(item => !item.isGroup);
        //getUserChatList(userList.length > 0 ? userList.map(item => item.id) : []);
      }
    }
    
    // 2.2 如果有就激活, 就算添加了也要激活
    selectPersonToChat(cur);
  };
}

const utilStore = new UtilStore();

export default {
  loginStore: utilStore.loginStore,
  appStore: utilStore.appStore,
  contactStore: utilStore.contactStore,
  homeStore: utilStore.homeStore,
  chatStore: utilStore.chatStore,
  dbStore: utilStore.dbStore,
  utilStore,
}
