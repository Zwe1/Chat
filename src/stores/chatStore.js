import {
  observable,
  action,
  runInAction,
  toJS,
  computed
} from 'mobx';

import { message as antMessage, Modal, Button } from 'antd';
const confirm = Modal.confirm;

import moment from 'moment';
import uuid from 'uuid';
import _ from 'lodash';

import { Strophe } from '../exlib/strophe.min';
import QuillEditor from '../components/common/quilljs/QuillEditor';
import { compressImg, dataURLtoFile } from "../common/imgUtil";
import oliEmoji from "../components/common/emoji/oli-emoji";
import { getToken } from '../services/msg';
import { reConnect } from '../services/login';

import { chatlistData } from '../common/genData';

import getInstance from '../websocket';
import { MessageTypes, OPMsgTypes } from '../common/types';
import { getPushContentByType, parseHistoryMessage } from '../common/parseMessage';

import newMsgWav from '../assets/sounds/new-msg.wav';
const globalNewMsgAudio = new Audio(newMsgWav);

import { getCurrentUser } from '../lowdb';

import {
  setChatList as saveCLTODB,
  getChatList
} from '../lowdb/lowdbChatList';

import { upload } from '../services/media';
import { tryParse } from '../common/jsonUtil';

import {
  create,
  disband,
  delMembers,
  addMembers,
  setMembers,
} from '../services/group';


export default class ChatStore {

  constructor(utilStore) {
    this.utilStore = utilStore;
  }

  /**
   * 本地保存到聊天列表
   *
   * @type {Array}
   */
  @observable chatList = [];
  @observable totalUnreadCount = 0;

  // 消息列表
  // @observable messages = {
  //   // 下面这种形式的。
  //   // 'user_131231231': [ { id, content }, {} ],
  //   // 'user_131231232': [ { id, content }, {} ]
  // };
  @observable messages = observable.map({});

  //消息历史，根据会话id存储
  @observable history = observable.map({});
  // 是否显示历史消息弹出框
  @observable showHistory = false;
  @observable historyControl = {
    loading: false,
    pageNumber: 1,
    pageSize: 10,
    totalCount: 10,
    keyword: '',
    msgType: '',
    startTime: null,
    endTime: null,
    emptyHistory: false
  };

  //搜聊天记录
  @observable showChatRecord = false;
  // @observable emptyRecordList = false;
  @observable globalChatRecordData = {
    list: [],
    keyword: '',
    chatid: null,
    chatMessage: {}, //会话列表信息集合
  };

  // 这不是一个 id
  @observable currentChatPerson = null;

  /**
   * 创建群
   */
  @observable createGroupVisible = false;
  @observable createGroupChatVisible = false;
  @observable createGroupLoading = false;

  /**
   * 添加人进群
   */
  @observable editGroupVisible = false;
  @observable editGroupLoading = false;

  /**
   * 在单聊里 拉人进群
   */
  @observable addPersonToGroupChatVisible = false;
  // @observable addPersonToGroupChatLoading = false;

  /**
   * 发送名片
   */
  @observable sendPersonCardVisible = false;

  /**
   * 右侧的抽屉
   */
  @observable drawerOpen = false;

  // 转发信息
  @observable redirectMsgModalVisible = false;
  @observable waitRedirectMsg = false;

  @observable chatListScrollbars = null; // 左侧聊天栏ref

  @observable groupInfoToCreate = {}; // 创建聊天的我的群组的群组信息

  @observable lookpicture = false;
  @observable lookPictureMessage = [];
  @observable lookPictureIndex = 0;

  PAGE_SIZE = 20;
  MAX_SIZE = 500;

  // 历史记录的位置
  // @observable historyMessagePosition = 0;

  // 当开始从本地获取是否需要刷新页面的flag
  @observable reHistoryMsgFlag = true;
  
  // 是否从本地获取
  @observable localHistoryMsgFlag = false;

  // web兼容时候的通知click的interval
  iframeClickInterval = null;

  // 进入公众号
  @observable enterPublic = false;

  // 是否开启已读已读功能
  @observable openHasRead = true;

  // 我的群组
  @observable fetchMyGroupListPending = false;

  @computed get chatRecordList()  {
    if (this.chatList.length >= 0) {
      return this.chatList.filter(chat => {
        if (chat.isGroup) {
          return this.globalChatRecordData.list.indexOf(chat.id) >= 0
        } else {
          return this.globalChatRecordData.list.indexOf(chat.targetId && chat.targetId.split(',').join('-')) >= 0
        }
      })
    }
  }

  // @action.bound isEmptyChatRecord = (bool = true) => {
  //   this.emptyRecordList = bool;
  // };

  @action.bound clearHistory = (clear = true) => {
    clear && this.history.clear();
  };

  @action.bound handleOpenChatRecord = (visible) => {
    runInAction(() => {
      this.showChatRecord = visible;
    })
  };

  @action.bound handleChangeChatRecord(params = {}) {
    this.globalChatRecordData = {...this.globalChatRecordData, ...params}
  };

  @action.bound handleChangeHistoryCondition(params = {}) {
    this.historyControl = {...this.historyControl, ...params}
  };

  // 展示发送名片的Modal
  @action.bound showSendPersonCard() {
    this.sendPersonCardVisible = true;
  }

  // 隐藏发送名片的Modal
  @action.bound hideSendPersonCard() {
    this.sendPersonCardVisible = false;
  }

  @action.bound setLocalHistoryMsgFlag(flag) {
    this.localHistoryMsgFlag = flag;
  }

  @action.bound setChatListByHistoryLoading(groupOrPerson, flag) {
    this.chatList = this.chatList.map(item => {
      if (groupOrPerson.id === item.id) {
        item.historyLoading = flag;
      }

      return item;
    });
  }

  @action.bound setLookPictureIndex(index) {
    this.lookPictureIndex = index;
  }

  @action.bound setPictureMessage(message) {
    this.lookPictureMessage = message;
  }

  @action.bound setLookPicture(flag) {
    this.lookpicture = flag;
  }

  @action.bound setChatListScrollbars(obj) {
    this.chatListScrollbars = obj;
  }

  @action.bound switchState(key, val) {
    this[ key ] = val;
  }

  @action.bound loadOldChatList() {
    let user = getCurrentUser();
    if (user && user.base_user_id) {
      this.chatList = getChatList();
    }

    if (this.chatList && this.chatList.length > 0) {
      let userIdList = this.chatList.filter(chat => !chat.isGroup).map(chat => chat.id);
      if (userIdList.length > 0) {
        this.utilStore.dbStore.getSimpleUsersInfo(userIdList);
      }
    }
  }

  @action.bound websocketCallback(type, params) {
    console.log('[websocket] - receive:', type, ', with params：', params);

    switch (type) {
      case 'iq':
        this.receiveNewIQ(params);
        break;

      case 'message':
        this.receiveNewMessage(params);
        break;

      case 'presence':
        break;

      case 'conflict':
        this.utilStore.homeStore.cancelKeepAlive();
        if (window.isElectron()) {
          const { ipcRenderer } = window.require('electron');
          ipcRenderer.send('shakeMainWindow');
        }

        confirm({
          title: '该帐号在其他设备登录！',
          content: '如果这不是您的操作，请及时修改您的登录密码!',
          okText: '退出',
          okType: 'danger',
          cancelText: '重连',
          onOk: () => {
            // 退出
            // 退出当前端
            this.utilStore.loginStore.logout('exchange', true);
          },
          onCancel() {
            // 重连
            let ws = getInstance();
            ws && ws.reConnect();

            reConnect();
          }
        });

        break;
      
      case 'disconnect':
        this.utilStore.homeStore.cancelKeepAlive();
        if (window.isElectron()) {
          const { ipcRenderer } = window.require('electron');
          ipcRenderer.send('shakeMainWindow');
        }

        confirm({
          title: '断开连接了，要重连吗？',
          // content: '可以重连~',
          okText: '退出',
          okType: 'danger',
          cancelText: '重连',
          onOk: () => {
            // 退出
            // 退出当前端
            this.utilStore.loginStore.logout('exchange', true);
          },
          onCancel() {
            // 重连
            let ws = getInstance();
            ws && ws.reConnect();

            reConnect();
          }
        });

        break;
          
      default:
        break;
    }
  }

  @action.bound parseChatList({ chatList, nopushUsers }) {
    nopushUsers.forEach(user => {
      let id = user.targetId;
      if (id && id.indexOf('|') > 0) {
        id = id.split('|')[0];
      }

      // 不存在就添加上去
      if (this.chatListDisturbList.indexOf(id) < 0) {
        this.chatListDisturbList.push(id);
      }
    });

    const currentUser = getCurrentUser();
    let chatListParam = chatList;
    chatListParam = _.uniqBy(chatList, 'id');

    // merge 一下会话列表 
    let dummy = this.chatList;
    // 在历史里面，不在最新的会话列表
    let toRemove = _.differenceBy(dummy, chatListParam, 'id');
    // 在最新的不在历史回话列表
    let toAdd = _.differenceBy(chatListParam, dummy, 'id');
    // toAdd.forEach(ta => ta.unreadCount = 0);
    // 删除被最新回话列表删除的
    dummy = dummy.filter(d => toRemove.filter(tr => tr.id === d.id).length === 0);
    // 更新已存在的
    dummy = dummy.map(oldChat => {
      let newChat = chatListParam.filter(cl => cl.id === oldChat.id)[ 0 ];
      if (newChat) {
        return {
          ...oldChat,
          ...newChat,
          isRemoved: false,
        };
      } 

      return oldChat;
    });

    // 添加被最新会话列表添加的
    dummy = dummy.concat(toAdd);
    // 
    dummy.forEach(chat => {
      chat.historyLoading = false;
      chat.historyHasMore = true;
    });

    // 去掉 必达 消息
    dummy = dummy.filter(chat => chat.targetId.indexOf('bing_') < 0);

    this.setChatList(dummy);
    this.utilStore.dbStore.getSimpleUsersInfo(dummy.filter(chat => !chat.isGroup).map(chat => chat.id));

    // 保存群组缓存
    const groupList = dummy.filter(chat => chat.isGroup);
    const groupCache = groupList.map(group => {
      return {
        id: group.id,
        groupName: group.groupName,
        avatar: { 
          media_id: group.groupIconUrl,
          default: '/common/images/group_default.png'
        }
      }
    });

    this.utilStore.dbStore.saveGroupsCache(groupCache);
  }

  @observable isJustLoadHistory = false;

  @action.bound setIsJustLoadHistory(value = false) {
    this.isJustLoadHistory = value
  }

  @action.bound parseChatHistory(iq) {
    let { 
      lastTime, 
      history, 
      originIQ
    } = iq;

    const { targetId } = originIQ;
    const myId = getCurrentUser().base_user_id;

    const pageSize = this.PAGE_SIZE;
    let newMsgs = [];

    let myMsgIds = [];
    let yourMsgIds = [];

    let countIds = [];

    // 更新会话列表关于 loading 的状态。
    let dummyCl = toJS(this.chatList);
    dummyCl.forEach((person) => {
      if (person.id === targetId) {
        person.historyLoading = false;
        person.lastTime = lastTime;
        person.historyHasMore = history.length === pageSize;
      }
    });

    this.setChatList(dummyCl);

    if (history.length > 0) {
      history.forEach(item => {
        const { sendTime, opBody } = item;

        let opBodyObj = tryParse(opBody);
        if (opBodyObj.extra && _.isString(opBodyObj.extra)) {
          opBodyObj.extra = tryParse(opBodyObj.extra);
        }

        item.opBody = opBodyObj;

        let message = parseHistoryMessage(item);

        // 收集需要查询阅读状态的id
        if (message.from === myId) {
          myMsgIds.push(message.id);
        } else {
          yourMsgIds.push(message.id);
        }

        // 群信息没有 countids
        if (!message.isGroup 
          && message.extra && message.extra.countids) {
          let tempIds = message.extra.countids;
          if (tempIds.length > 0) {
            countIds = countIds.concat(tempIds);
          }
        }

        message.date = moment(parseInt(sendTime));
        newMsgs.unshift(message);
      });

      // 添加之前的信息
      let dummy = this.messages.get(targetId);
      if (dummy) {
        dummy.forEach(newMsg => {
          newMsgs.push(newMsg);
        });
      }

      newMsgs = _.uniqBy(newMsgs, 'id'); // 去重

      // 标记 countIds 里面的信息 为 已读
      if (countIds.length > 0) {
        countIds = _.uniq(countIds);
        countIds.forEach(id => {
          newMsgs.forEach(msg => {
            if (msg.id === id) {
              msg.hasRead = true;
            }
          });
        });
      }

      newMsgs = _.sortBy(newMsgs, [ function (o) {
        return o.date;
      } ]);

      // 把钟大哥写的代码移到这里
      // this.historyMessagePosition += newMsgs.length;
      // this.reHistoryMsgFlag = true;

      this.messages.set(targetId, newMsgs);
      // 更新 loading
      // this.setChatListByHistoryLoading(this.currentChatPerson, false);

      this.isJustLoadHistory = true;

      if (!this.openHasRead) {
        return
      }

      // // 我自己的消息
      let notReadMsgIds = _.difference(myMsgIds, countIds);
      if (notReadMsgIds.length > 0) {
        // 获取消息已读状况
        this.getMsgRead(targetId, notReadMsgIds);
      }

      // // 别人的消息
      let yourNotReadMsgIds = _.difference(yourMsgIds, countIds);
      if (yourNotReadMsgIds.length > 0) {
        setTimeout(() => {
          // 获取消息已读状况
          this.batchSendHasRead(
            yourNotReadMsgIds
              .map(id => newMsgs.filter(msg => msg.id === id)[0])
              .filter(msg => msg),
            targetId
          );
        });
      }
    }
  }

  /**
   * 查询消息历史
   * @param iq
   */
  @action.bound parseSearchedHistory(iq) {
    let {
      searchedHistory: history,
      originIQ
    } = iq;

    const { targetId } = originIQ;

    let newMsgs = [];

    if (history.length > 0) {
      history.forEach(item => {
        const { sendTime, opBody } = item;

        let opBodyObj = tryParse(opBody);
        if (opBodyObj.extra && _.isString(opBodyObj.extra)) {
          opBodyObj.extra = tryParse(opBodyObj.extra);
        }

        item.opBody = opBodyObj;

        let message = parseHistoryMessage(item);
        message.date = moment(parseInt(sendTime));
        newMsgs.unshift(message);
      });

      newMsgs = _.uniqBy(newMsgs, 'id'); // 去重
      newMsgs = _.sortBy(newMsgs, [ function (o) {
        return o.date;
      } ]);

      this.history.set(targetId, newMsgs);
    } else {
      this.history.set(targetId, []);
      this.historyControl.emptyHistory = true;
    }
  }

  /**
   * 查询一堆消息的已读情况~
   */
  @action.bound getMsgRead(targetId, msgIds = []) {
    if (msgIds.length === 0) {
      return;
    }

    const myId = getCurrentUser().base_user_id;
    const newMsgs = toJS(this.messages.get(targetId));

    let self = this;
    let ws = getInstance();

    ws.getMsgRead(msgIds, readStatus => {
      for (let msgId in readStatus.content) {
        for (let msg of newMsgs) {
          if (msgId === msg.id) {
            let hadReadArr = readStatus.content[msgId] || [];
            if (msg.isGroup) {
              // 群聊
              msg.hasRead = hadReadArr;
            } else {
              // 单聊
              msg.hasRead = hadReadArr[0] === msg.to;
            }
          }
        }
      }

      runInAction(() => {
        self.messages.set(targetId, newMsgs);
      });
    });
  }

  @action.bound receiveNewIQ(iq) {
    if (iq.nopushUsers && iq.chatList) {
      this.parseChatList(iq);
    } else if (iq.history) {
      this.parseChatHistory(iq);
    } else if (iq.searchedHistory) {
      this.parseSearchedHistory(iq);
      this.handleChangeHistoryCondition({
        pageSize: iq.pageSize,
        pageNumber: iq.pageNumber,
        pageCount: iq.totalCount,
        loading: false,
      })
    } else if (iq.searchedChat) {
      if (_.isArray(iq.searchedChat)) {
        this.handleChangeChatRecord({
          list: iq.searchedChat,
          chatMessage: iq.chatMessage
        });
      }
    }
  }

  @action.bound openDrawer() {
    this.drawerOpen = true;
  }

  @action.bound closeDrawer() {
    this.drawerOpen = false;
  }

  @action.bound saveWaitRedirectMsg(message) {
    this.waitRedirectMsg = message;
  }

  @action.bound openRedirectMsgModal() {
    this.redirectMsgModalVisible = true;
  }

  @action.bound closeRedirectMsgModal() {
    this.redirectMsgModalVisible = false;
    this.waitRedirectMsg = null;
  }

  @action.bound addPersonToChatList(person) {
    let isExist = false;

    // let chatListClone = toJS(this.chatList);
    this.chatList.forEach(chat => {
      if (isExist) {
        return;
      }

      if (chat.id === person.id) {
        isExist = true;
        chat.isRemoved = false;
        chat.date = moment();
      }
    });

    if (isExist) {
      this.setChatList(this.chatList);
    } else {
      person.historyHasMore = true;
      person.historyLoading = false;
      
      this.chatList.unshift(person);
    }
  }

  @action.bound computeTotalUnreadCount(list) {
    let dummy = 0;
    list.forEach(person => {
      const isDisturb = this.chatListDisturbList.indexOf(person.id) > -1;
      if (!isDisturb && !person.isRemoved) {
        dummy += Number.isNaN(person.unreadCount) ? 0 : person.unreadCount;
      }
    });

    this.totalUnreadCount = dummy;

    if (window.isElectron()) {
      // 未读消息没有了，清除闪烁
      if (this.totalUnreadCount === 0) {
        this.cancelFlash();
      }

      // 否则就闪烁
      // else {
      //   this.playFlash();
      // }
    }

    // return dummy;
  }

  /**
   * 设置 chatlist
   * @param {*} list 
   */
  @action.bound setChatList(list, computeUnread = true) {
    list = _.uniqBy(list, 'id');  // 清空

    let topList = list.filter(chat => chat.isTop);
    let otherList = list.filter(chat => !chat.isTop);
    this.chatList = _.sortBy(topList, [ o => -o.date ])
      .concat(_.sortBy(otherList, [ o => -o.date ]));

    // 如果聊天列表 chatlist 为空
    if (this.chatList.length === 0) {
      return;
    }

    if (this.currentChatPerson) {
      this.currentChatPerson = this.chatList.filter(cl => cl.id === this.currentChatPerson.id)[ 0 ];
    } 
    
    // this.totalUnreadCount = 0;
    if (computeUnread) {
      this.computeTotalUnreadCount(list);
    }

    if (!window.isElectron()) {
      // 有未读消息的消息列表
      const filterList = list.filter(user => user.unreadCount);

      window.parent.eMobileUnreadObject = filterList.length > 0 ? filterList[ 0 ] : null; // 未读消息详细
      window.parent.totalUnreadCount = this.totalUnreadCount; // 未读消息
      // noiframe
      window.totalUnreadCount = this.totalUnreadCount;

      this.iframeClickInterval = setInterval(() => {
        if (!window.eMobileClickId) {
          return;
        }
        
        const u = list.filter(user => user.fromUserId === window.eMobileClickId)[ 0 ];
        window.eMobileClickId = null;
        this.selectPersonToChat(u);
      }, 500);
    }

    // 异步保存到数据库，如果同步会卡
    setTimeout(() => {
      saveCLTODB(list);
    }, 0);
  }

  playAudio() {
    try {
      // 暂停了或者结束了，再继续播放，否则本次提示忽略
      if (globalNewMsgAudio.ended || globalNewMsgAudio.paused) {
        globalNewMsgAudio.play();
      } 
    } catch (e) {
      console.error('audio error', e);
    }
  }

  playFlash() {
    if (window.isElectron()) {
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.send('receive-new-message-to-flash');
    }
  }

  cancelFlash() {
    if (window.isElectron()) {
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.send('cancel-tray-flash');
    }
  }

  @action.bound removeCurrentBadge() {
    let current = this.currentChatPerson;
    if (!current) {
      return;
    }

    this.chatList.forEach(chat => {
      if (chat.id === current.id) {
        // clear 消息也要发
        if (chat.unreadCount !== 0) {
          this.sendClearMsg(current);
        }
        
        // 未读数也要清
        chat.unreadCount = 0;
      }
    });

    this.setChatList(this.chatList);

    // 还要发送未读
    const dummyMsgs = this.messages.get(current.id);
    this.batchSendHasRead(dummyMsgs, current.id);
  }

  /**
   * 指令消息
   */
  directiveMessageTypes = [
    MessageTypes.status,
    MessageTypes.clear,
    MessageTypes.intf
  ];

  /**
   * 不提醒
   */
  dontRemindMessageTypes = [
    MessageTypes.ntf,
    MessageTypes.dntf,
    MessageTypes.clear,
    MessageTypes.status,
    MessageTypes.withdraw
  ];

  @action.bound
  processDntfMessage(message, groupId) {
    let { 
      admins,   // 相关的群主变化了吗
      type,     // 类型
      operator, // 谁操作的
      extension // 主要操作人员
    } = message;

    let currentId = getCurrentUser().base_user_id;
    
    let dummy;
    if (extension) {
      dummy = extension.split('|')[0];
    }

    if (type === 4 && dummy == currentId) {
      // 如果收到了被踢出的消息, 直接删掉
      let index = _.findIndex(this.chatList, (o) => o.id = groupId);
      if (index > -1) {
        this.deletePersonFromChatList(index, this.currentChatPerson);
        this.afterExit(groupId);
      }
    } else {
      this.utilStore.dbStore.getGroupInfo(groupId, true);
    }
  }

  @observable chatListTopList = [];
  @observable chatListDisturbList = [];

  @action.bound
  processConopMessage(message) {
    const { extra, content } = message;
    console.log('process conop message:', extra);

    let opValue = extra.opvalue;
    let targetId = extra.targetid;
    if (targetId.indexOf('|')) {
      // 去掉 udid
      targetId = targetId.split('|')[0];
    }

    let chatListLength = this.chatList.length;

    switch(extra.optype) {
      // 删掉这个人
      case OPMsgTypes.delete:
        // 本地标记删除
        for(let i = 0; i < chatListLength; i++) {
          let currentChat = this.chatList[i];
          if (currentChat.id === targetId) {
            currentChat.isRemoved = true;

            // 如果有下一个
            if ((i + 1) < chatListLength) {
              this.currentChatPerson = this.chatList[ i + 1 ];
            } else if (chatListLength > 0) {
              this.currentChatPerson = this.chatList[ 0 ];
            } else {
              this.currentChatPerson = null;
            }

            this.setChatList(this.chatList);
            break;
          }
        }

        this.messages.delete(targetId);
        break;

      // 删掉这条信息
      case OPMsgTypes.delMsg: 
        let msgId = '';
        if (content && content.indexOf('|') > 0) {
          msgId = content.split('|')[0];
        }

        let currentMsgs = toJS(this.messages.get(targetId));
        this.messages.set(targetId, currentMsgs.filter(item => item.id !== msgId));
        break;

      // 清空聊天记录
      case OPMsgTypes.empty: 
        // 清空聊天记录
        this.messages.set(targetId, []);
        // 
        this.chatList.length > 0 && this.chatList.forEach(chat => {
          if (chat.id === targetId) {
            chat.last = '';
            chat.date = moment();

            chat.historyHasMore = false;
            chat.historyLoading = false;
            chat.pageNumber = 0;
          }
        });

        this.setChatList(this.chatList);
        break;

      // 置顶
      case OPMsgTypes.top:
        // if (opValue === '0') {
        //   this.chatListTopList = this.chatListTopList.filter(id => id !== targetId);
        // } else {
        //   this.chatListTopList.push(targetId);
        // }

        this.chatList.length > 0 && this.chatList.forEach(chat => {
          if (chat.id === targetId) {
            chat.isTop = opValue === '1';
          }
        });

        this.setChatList(this.chatList);
        break;

      // 设置新信息通知
      case OPMsgTypes.noti:
        if (opValue === '0') {
          this.chatListDisturbList = this.chatListDisturbList.filter(id => id !== targetId);
        } else {
          this.chatListDisturbList.push(targetId);
        }

        break;

      default: 
        break;
    }
  }

  /**
   * 简单的删除
   */
  @action.bound
  processWithdrawMessage(message) {
    const { extra } = message;
    const msgId = extra.withdrawId;
    const targetId = message.isRecipt ? message.from : message.to;

    let oldMsgs = this.messages.get(targetId);
    for (let i = 0; i < oldMsgs.length; i++) {
      let msg = oldMsgs[i];
      if (msg.id === msgId) {
        // 如果撤回的是最后一条信息，要改变会话列表
        if (i === oldMsgs.length - 1) {
          const ws = getInstance();
          ws && ws.fetchChatList();
        }

        oldMsgs.splice(i, 1, message);
      }
    }

    this.messages.set(targetId, oldMsgs);
  }

  @action.bound
  processCountMessage(message, ugId) {
    let dummyMessage = this.messages.get(ugId);
    if (!dummyMessage) {
      // 如果之前没有跟他聊天
      dummyMessage = [];
    }

    // 接下来更新消息状态
    let mm = dummyMessage.filter(msg => msg.id === message.id)[0];
    // 如果是 count message 并且没有在找到这条信息，那这条信息是群信息
    if (!mm) {
      let hasFound = false;

      for (let curMessages of this.messages.values()) {
        for (let curMsg of curMessages) {
          if (curMsg.id === message.id) {
            hasFound = true;
            dummyMessage = curMessages;
            mm = dummyMessage.filter(msg => msg.id === message.id)[0];
            break;
          }
        }

        // 找到了就跳出循环
        if (hasFound) {
          break;
        }
      }
    }

    // 真的不存在
    if (!mm) {
      return;
    } 

    // 修改消息已读状态
    if (this.openHasRead && message.objectName === MessageTypes.status) {
      if (mm.isGroup) {
        if (mm.hasRead && mm.hasRead.indexOf(message.from) < 0) {
          mm.hasRead.push(message.from);
        } else if (!mm.hasRead) {
          mm.hasRead = [message.from];
        }
      } else {
        mm.hasRead = true;
      }
    }

    this.messages.set(mm.to, dummyMessage);
  }

  @action.bound
  processClearMessage(message, ugId) {
    // 如果收到全部清空的消息
    if (message.content === 'clearAll') {
      this.chatList.forEach(chat => {
        chat.unreadCount = 0;
      });
    } else {
      let person = this.chatList.filter(item => item.id === ugId && !item.isRemoved)[ 0 ];
      if (!person) {
        return;
      }

      person.unreadCount = 0;
    }

    this.setChatList(this.chatList);
  }

  /**
   * 收到新信息
   * 
   * @param message
   */
  @action.bound receiveNewMessage(message) {
    // 好多种类型的消息
    if (message.objectName === MessageTypes.conop) {
      this.processConopMessage(message);
      return;
    }

    // 消息撤回
    if (message.objectName === MessageTypes.ntf) {
      const { extra } = message;
      if (extra.notiType && extra.withdrawId && extra.notiType === 'noti_withdraw') {
        this.processWithdrawMessage(message);
        return;
      }
    }

    // 抖一抖
    if (message.objectName === MessageTypes.custom && message.extra.pushType === MessageTypes.shake) {
      // 客户端
      if (window.isElectron()) {
        const { ipcRenderer } = window.require('electron');
        ipcRenderer.send('shakeMainWindow');
      }

      // 激活该聊天记录
      if (message.from != getCurrentUser().base_user_id) {
        this.selectPersonToChat(this.utilStore.dbStore.getSimpleUserInfo(message.from));
      } else {
        this.selectPersonToChat(this.utilStore.dbStore.getSimpleUserInfo(message.to));
      }
    }

    const isGroup = message.isGroup;
    const isSync = message.isSync;
    const msgType = message.objectName;

    // 群聊，to 是 群 id
    // 多端同步的信息 toId 就是 ugid
    // 但是正常的信息 fromId 是 ugId
    let ugId = msgType === MessageTypes.clear || isSync || isGroup 
        ? message.to 
        : message.from;

    // 已读消息
    if (msgType === MessageTypes.status) {
      this.processCountMessage(message, ugId);
      return;
    }

    // clear 消息
    if (msgType === MessageTypes.clear) {
      this.processClearMessage(message, ugId);
      return;
    }

    let person = this.chatList.filter(item => item.id === ugId && !item.isRemoved)[ 0 ]; // 得到人的信息 也可能是群
    // 会话不存在, 并且收到的消息不是不提醒的消息
    if (!person && !this.directiveMessageTypes.includes(message.objectName)) { 
      this.addPersonToChatList({
        id: ugId,
        name: '...',
        unreadCount: 0,
        date: moment(),
        lastTime: new Date().valueOf() * 2,
        last: '',
        isGroup   // 判断是不是群组 用这个标识
      });

      // 保证 person 是 observable 的
      person = this.chatList.filter(item => item.id === ugId)[ 0 ];
    }

    // 如果不是回执, 且不提醒
    if (!message.isRecipt 
      && !this.dontRemindMessageTypes.includes(message.objectName)) {
      if (message.pushContent) {
        person.last = message.pushContent;
      }

      // 这个时候收到的回执是没有时间的，只能用当前时间
      // 刷新界面之后可以获取到时间，不在消息体里面
      person.date = message.date;

      // 如果 @了我，或者 @了所有人，会话列表需要有提示
      if (message.isAtAll 
        || (message.atIds && message.atIds.includes(getCurrentUser().base_user_id))) {
        person.showAt = true;
      }
    }

    // 当前客户端窗口
    let focusedWin = null;
    if (window.isElectron()) {
      const { remote } = window.require('electron');
      const BrowserWindow = remote.BrowserWindow;
      focusedWin = BrowserWindow.getFocusedWindow();
    } else {
      focusedWin = window.focused ? 'focused' : null;
    }

    if (!message.isRecipt // 不是回执，回执信息肯定是重复的
      // disturb
      && !this.chatListDisturbList.includes(ugId) 
      // 不在不提示的消息列表中
      && this.dontRemindMessageTypes.indexOf(msgType) < 0 
      // 接收方多端同步，已经在其他端看过，不需要提示
      && !message.isSyncReceiver 
      // 不是我发的
      && message.from !== getCurrentUser().base_user_id 
      && (
        // 窗口有焦点 没有聊天或者当前聊天的人不是发送者
        (focusedWin && (!this.currentChatPerson || (person.id !== this.currentChatPerson.id))) 
        // 窗口没有获得焦点
        || !focusedWin
      )) {

      let count = 0;
      if (!Number.isNaN(person.unreadCount)) {
        count = person.unreadCount;
      }

      count += 1;
      person.unreadCount = count;

      if (this.utilStore.homeStore.voiceSwitch) { // 声音允许
        this.playAudio();
      }

      if (this.utilStore.homeStore.iconSwitch) { // 图标闪烁允许
        this.playFlash();
      }
    }

    // 这里可以更新 chatList 了
    this.setChatList(this.chatList);

    // 每次收到消息都要发送 clear 和 hasRead
    if (this.currentChatPerson && this.currentChatPerson.id && !message.isRecipt) {
      const chatting = this.currentChatPerson.id === ugId;
      // 如果是 electron 环境，就必须 window focus，
      // 如果不是 electron 环境，随他妈意
      if (chatting && (!window.isElectron() || focusedWin)) {
        // 如果跟当前这个人聊天 直接发送 clear
        this.sendClearMsg(this.currentChatPerson);
        this.sendHasRead(message);
      }
    };
    
    let dummyMessage = this.messages.get(ugId);
    if (!dummyMessage) {
      // 如果之前没有跟他聊天
      dummyMessage = [];
    }

    // 接下来更新消息状态
    let mm = dummyMessage.filter(msg => msg.id === message.id)[ 0 ];
    // 消息不存在
    if (!mm) {
      // 如果不是修改信息状态的，添加到消息列表
      // 这几种信息就算收到也不会添加
      if (msgType !== MessageTypes.clear && msgType !== MessageTypes.status) {
        dummyMessage.push(message);

        // 处理群通知
        if (msgType === MessageTypes.dntf) {
          this.processDntfMessage(message, ugId);  // 可能要去重新请求 group 的信息
        }
      }
    }

    // 消息存在
    else {
      // 撤回消息格式
      if (msgType === MessageTypes.withdraw) {
        mm.objectName = MessageTypes.withdraw;
        mm.type = MessageTypes.withdraw;
      }

      // 去掉错误显示
      mm.loading = false;
      mm.error = false;

      // 错误计时器
      if (mm.errorTimeoutId) {
        window.clearTimeout(mm.errorTimeoutId);
      }

      // loading 计时器
      if (mm.loadingTimeoutId) {
        window.clearTimeout(mm.loadingTimeoutId);
      }

      if (mm.objectName === MessageTypes.file) {
        mm.content = message.content;
        delete mm.fileMeta;
      }
    }

    this.messages.set(person.id, dummyMessage);
  }

  @action.bound
  sendClearMsg(current) {
    let ws = getInstance();
    ws && ws.sendClearMsg(current.id, current.isGroup);
  }

  /**
   * 批量已读,
   *     别人的信息发送已读
   */ 
  @action.bound batchSendHasRead(messages = [], targetId) {
    // console.log('batch send messages has read:', messages);

    const myId = getCurrentUser().base_user_id;
    let msgs = toJS(this.messages.get(targetId));

    messages.forEach(msg => {
      msgs && msgs.forEach(m => {
        if (m.id === msg.id) {
          if (m.from !== myId && !msg.hasSend) { // 不是我发的，并且没有发送过已读~
            this.sendHasRead(m);
          }
        }
      });
    });

    // 重新设置一下
    this.messages.set(targetId, msgs);
  }

  /**
   * 发送已读
   */ 
  @action.bound sendHasRead(message = {}) {
    if (!this.openHasRead 
      || this.dontRemindMessageTypes.includes(message.objectName) 
      || message.from === message.to) {
      return;
    }

    let ws = getInstance();
    ws && ws.sendCountMsg(message);
    message.hasSend = true;
  }

  @action.bound selectPersonToChat(groupOrPerson) {
    this.iframeClickInterval && clearInterval(this.iframeClickInterval);
    this.currentChatPerson = groupOrPerson;

    if (groupOrPerson.isGroup) {
      let cache = this.utilStore.dbStore.groupCache.get(groupOrPerson.id);
      if (!cache || !cache.members) {
        this.utilStore.dbStore.getGroupInfo(groupOrPerson.id, true);
      }
    }

    let dummy = this.chatList;

    // 未读消息数量
    for (let item of dummy) {
      if (item.id === groupOrPerson.id) {
        item.unreadCount = 0;
        item.showAt = false; // 点击之后去掉 @ 的提示
      }
    }

    // 如果没有加载过这个人的历史，先设置为空
    let messages = this.messages.get(groupOrPerson.id);
    if (!messages) {
      this.messages.set(groupOrPerson.id, []);
      messages = this.messages.get(groupOrPerson.id);
    }

    this.setChatList(dummy);
    
    // 发送 clear
    if (groupOrPerson.unreadCount > 0) {
      let first = messages.length > 0 ? messages[messages.length - 1] : { id: '' };
      this.sendClearMsg(groupOrPerson);
    }

    setTimeout(() => {
      runInAction(() => {
        if (messages.length === 0) {
          this.fetchHistoryByPage();
        } else {
          console.log('local render messages.......');

          // 发送已读, 已经存在的信息，不包括这次请求的
          this.batchSendHasRead(messages, groupOrPerson.id);
        }
      });
    }, 10);
  }

 /**
  * 发送消息之前的消息拼接
  * 
  * @param {*} type 消息类型
  * @param {*} obj 消息内容
  * @param {*} conversation 传过来的对话框
  * @param {*} countIds 
  * @param {*} lastMessage 聊天的拼接的上一次的内容
  */
  @action.bound spliceMessage(type, obj, conversation, countIds = [], lastMessage = null) {
    const user = getCurrentUser();
    const msgId = uuid.v4();

    const messageBase = {
      from: user.base_user_id,
      to: conversation.id,
      loading: false,
      error: false,
      sendTime: new Date().valueOf(),
      date: moment(),
      inputFlag: true,
      isGroup: conversation.isGroup,
      id: msgId,
      hasRead: conversation.isGroup ? [] : false
    };

    let receiverids = '';
    let pushFlag = false; // 是否应当加入到messages中
    
    if (conversation.isGroup) {
      const { groupCache } = this.utilStore.dbStore;
      const members =  groupCache.get(conversation.id).members || [];
      receiverids = members.join(',');
    } else {
      receiverids = conversation.id;
    }
    
    const extraBase = {
      msg_id: msgId,
      countids: countIds.join(','), // 当前消息之前的 对方发送的消息 数组转为字符串
      receiverids,
      receiverIds: receiverids.split(','),
      bubblecolor: '',
      issetted: '',
      // isPrivate: ''
    }

    switch (type) {
      case 'image':
        const image = obj.image;
        const imageFile = dataURLtoFile(image);

        lastMessage = {
          ...messageBase,
          objectName: MessageTypes.img,
          content: imageFile, // 图片文件
          imageBase64: image,  // 负责暂时显示该图片(base64)
          imgUrl: '',
          extra: {
            ...extraBase,
            imgUri: '',
          },
        };
        pushFlag = true;
        break;

      case 'file':
        const fileObj = obj.file;
        const fileId = fileObj.id;
        const realFile = QuillEditor.filesWaitToUpload[ fileId ];

        lastMessage = {
          ...messageBase,
          objectName: MessageTypes.file,
          fileId,
          imgUrl: '',
          content: fileObj.name,
          contentBase64: realFile,
          extra: {
            ...extraBase,
            fileid: '',
            filePath: realFile.path,
            fileSize: fileObj.size,
            file_name: fileObj.name,
            file_type: fileObj.type,
          },
        };

        pushFlag = true;
        break;

      case 'emoji':
        let emojiText = obj.emoji;
        emojiText = oliEmoji.symbolToEmoji(emojiText);

        if (lastMessage !== null && lastMessage.objectName === MessageTypes.text) {
          lastMessage.content += emojiText;
          pushFlag = false;
        } else {
          lastMessage = {
            ...messageBase,
            content: emojiText,
            objectName: MessageTypes.text,
            extra: {
              ...extraBase
            }
          };
          pushFlag = true;
        }

        break;

      case 'mention':
        const { id, value } = obj.mention;
        const content = `@${value} `;

        if (lastMessage !== null && lastMessage.objectName === MessageTypes.text) {
          lastMessage.content += content;
          if (lastMessage.extra.msg_at_userid) {
            lastMessage.extra.msg_at_userid.push(id); // 多了一个 @ 的人
          } else {
            lastMessage.extra.msg_at_userid = [id];
          }

          pushFlag = false;
        } else {
          lastMessage = {
            ...messageBase,
            content: content,
            objectName: MessageTypes.text,
            extra: {
              ...extraBase,
              msg_at_userid: [id],
            }
          };
          pushFlag = true;
        }

        break;

      case 'link':
        lastMessage = {
          ...messageBase,
          content: `[链接] ${obj.title}`,
          icon_txt: obj.iconTxt,
          icon_url: obj.iconUrl,
          icon_fontcolor: obj.iconFontcolor,
          icon_bgcolor: obj.iconBgcolor,
          title: obj.title,
          description: obj.description,
          url: obj.url,
          imageurl: obj.imageUrl,
          image: obj.image,
          objectName: MessageTypes.link,
          extra: {
            ...extraBase,
            title: obj.title,
            description: obj.description,
            url: obj.url,
            imageurl: obj.imageUrl,
            image: obj.image,
            icon_url: obj.iconUrl,
            icon_txt: obj.iconTxt,
            icon_fontcolor: obj.iconFontcolor,
            icon_bgcolor: obj.iconBgcolor
          }
        }
        pushFlag = true;
        break;

      case 'card':
        lastMessage = {
          ...messageBase,
          objectName: MessageTypes.personCard,
          content: obj.name,
          hrmCardid: obj.hrmCardid,
          extra: {
            ...extraBase,
            hrmCardid: obj.hrmCardid,
          }
        }
        pushFlag = true;
        break;

      case 'news':
        const con = obj.articles && obj.articles.length > 0 ? obj.articles[0].title : '';
        const articles = obj.articles && obj.articles.length > 0 ? obj.articles : [];

        lastMessage = {
          ...messageBase,
          objectName: MessageTypes.news,
          content: `[图文] ${con}`,
          articles: articles,
          extra: {
            ...extraBase,
            articles: articles,
          }
        };
        pushFlag = true;
        break;

      case 'shake':
        lastMessage = {
          ...messageBase,
          objectName: MessageTypes.custom,
          content: '抖一抖',
          extra: {
            ...extraBase,
            pushType: 'weaver_shakeMsg',
          }
        };
        pushFlag = true;
        break;

      case 'text':
        if (lastMessage !== null && lastMessage.objectName === MessageTypes.text) {
          lastMessage.content += obj;
          pushFlag = false;
        } else {
          lastMessage = {
            ...messageBase,
            content: obj,
            objectName: MessageTypes.text,
            extra: {
              ...extraBase,
            }
          };
          pushFlag = true;
        }
        break;

      default:
        break;
    }

    return { lastMessage, pushFlag };
  }

  // 发送消息, isRedirect 为是否转发
  @action.bound sendMessage(msgs, isRedirect) {
    if (!msgs.length) {
      return;
    }

    const self = this;

    msgs.forEach(msg => {
      let toId = msg.to;
      let person = self.chatList.filter(item => item.id === toId)[ 0 ];

      // 如果人存在
      if (person) {
        person.last = getPushContentByType(msg);
        person.date = msg.date;

        let dummy = self.messages.get(person.id);
        if (!dummy) {
          // 如果与当前这个人没有聊天记录
          self.messages.set(person.id, []);
          dummy = self.messages.get(person.id);
        }

        if (!msg.isResend) {
          // 如果不是重新发送
          // 如果是图片，第一次 push 的时候是 base64 编码的。
          // 如果是文件，第一次 push 的时候 fileMeta 保存了文件的信息
          dummy.push(msg);
          self.messages.set(person.id, dummy.filter(item => item !== undefined));
        } else {
          // 如果是重新发送，不添加消息，直接改变之前的状态
          dummy.forEach(item => {
            if (item.id === msg.id) {
              item.loading = false;
              item.error = false;
            }
          });

          self.messages.set(person.id, dummy);
        }
      }

      // 人不存在, 转发的时候可能会出现这种情况
      else {
        self.addPersonToChatList({
          id: toId,
          name: '...',
          unreadCount: 0,
          date: moment(),
          last: getPushContentByType(msg),
          isGroup: msg.isGroup   // 判断是不是群组 用这个标识
        });

        // 添加这一条信息
        self.messages.set(toId, [ msg ]);
      }
    });

    // -------------------------------------------
    // ------> 上面是添加 信息，接下来要发送信息
    // -------------------------------------------

    const ws = getInstance();
    const _sendMsg = (msg, isRedirect) => {
      if (!ws) {
        // 如果上不去网直接修改
        msg.error = true;
        return;
      }

      msg.errorTimeoutId = setTimeout(() => {
        runInAction(() => {
          msg.loading = false;
          msg.error = true;
        });
      }, 15 * 1000); // 15s 后标记发送错误，可以重新发送。

      msg.loadingTimeoutId = setTimeout(() => {
        runInAction(() => {
          msg.loading = true;
        });
      }, 3 * 1000); // ss 后标记loading。

      // 发送信息
      if (msg.isGroup) {
        ws.sendGroupMsg(msg, isRedirect);
      } else {
        ws.sendMsg(msg, isRedirect);
      }
    };

    const __send = (index) => {
      let msg = msgs[ index ];

      let members;
      if (msg.isGroup) {
        const group = self.utilStore.dbStore.groupCache.get(self.currentChatPerson.id) || {};
        members = group.members || [];
      }

      let uploadTarget = {
        from: 'chat',
        targetid: msg.to,
        resourceids: msg.isGroup ? members.join(',') : msg.to
      };

      let dummy = self.messages.get(msg.to);
      let mm = dummy.filter(m => m.id === msg.id)[0];

      switch (msg.objectName) {
        case MessageTypes.text:
        case MessageTypes.link:
        case MessageTypes.personCard:
        case MessageTypes.news:
        case MessageTypes.custom:
          runInAction(() => {
            _sendMsg(mm);
            self.messages.set(mm.to, dummy);

            if (index < (msgs.length - 1)) {
              __send(index + 1); // 发送下一条
            }
          });
          break;

        case MessageTypes.img:
          upload(mm.content, 'image', uploadTarget, 1).then((data) => {
            // 压缩图片获得 base64 编码
            compressImg(mm.imageBase64, {}, (base64) => {
              runInAction(() => {
                mm.imgUri = data.media_id;
                mm.extra.imgUrl = data.media_id;
                mm.content = base64;

                _sendMsg(mm);
                self.messages.set(mm.to, dummy);
   
                if (index < (msgs.length - 1)) {
                  __send(index + 1); // 发送下一条
                }
              });
            });
          });

          break;

        case MessageTypes.file:
          upload(msg.contentBase64, 'file', uploadTarget).then((data) => {
            runInAction(() => {
              mm.extra.fileid = data.media_id;
              // 删掉之前缓存的文件
              delete QuillEditor.filesWaitToUpload[ msg.fileId ];
              delete mm.fileId;
                
              _sendMsg(mm);
              self.messages.set(mm.to, dummy);
        
              if (index < (msgs.length - 1)) {
                __send(index + 1); // 发送下一条
              }
            });
          });

          break;
        
        default: 
          break;
      }
    };

    setTimeout(() => {
      if (!isRedirect) {
        // 正常发送信息
        __send(0);
      } else {
        // 转发
        msgs.forEach(msg => {
          _sendMsg(msg, true);
        })
      }
    }, 0);
  }

  @action.bound
  async redirectMsgs(users) {
    let user = getCurrentUser();
    const msg = this.waitRedirectMsg;

    let dummy = toJS(msg);
    dummy.id = uuid.v4();
    dummy.from = user.base_user_id;
    dummy.date = moment();
    dummy.loading = true;
    dummy.error = false;
    dummy.sendTime = new Date().valueOf();
    dummy.inputFlag = true;

    delete dummy.timestamp;
    delete dummy.chatdivid;
    delete dummy.toUserid;
    delete dummy.errorTimeoutId;
    delete dummy.loadingTimeoutId;

    if (dummy.extra) {
      dummy.extra.msg_id = dummy.id;
    }

    let msgs = users.map(user => {
      dummy.to = user.base_user_id;
      dummy.targetid = user.base_user_id;
      dummy.isGroup = 'members' in user && !('base_user_id' in user);

      if (user.isGroup) {
        dummy.extra.receiverids = user.memebers.join(',');
      } else {
        dummy.extra.receiverids = user.base_user_id;
      }

      return { ...dummy };
    });

    this.sendMessage(msgs, true);
    this.closeRedirectMsgModal();
  }

  @action.bound fetchHistoryByPage(groupOrPerson) {
    if (!groupOrPerson) {
      groupOrPerson = this.currentChatPerson;
    }

    // 设置本地加载为否
    this.localHistoryMsgFlag = false;
    // 更新 loading
    this.setChatListByHistoryLoading(groupOrPerson, true);

    let {
      id, 
      targetType, 
      fromUserId, 
      lastTime 
    } = groupOrPerson;

    if (!lastTime) {
      lastTime = moment().valueOf();
    }
    
    const messages = this.messages.get(id) || [];
    const offlineLength = messages.filter(item => item.offline).length;
    const pageSize = this.PAGE_SIZE + offlineLength;

    const ws = getInstance();
    ws && ws.fetchHistory(
      id,
      targetType,
      getCurrentUser().base_user_id,
      lastTime,
      pageSize,
    );
  }

  /**
   * 点击消息查询按钮
   *
   * @param flag
   */
  @action.bound handleFindHistoryClick = (flag, currentChat) => {
      let showHistory;

      if (flag === 1) {
        showHistory = false;
        this.handleChangeHistoryCondition({
          pageSize: 10,
          pageNumber: 1,
          totalCount: 10,
          keyword: '',
          msgType: '',
          startTime: null,
          endTime: null
        });
        this.clearHistory();
      } else if (flag === 'global') {
        //聊天记录搜索
        this.handleChangeHistoryCondition({
          keyword: this.globalChatRecordData.keyword,
        });
        this.searchHistory(currentChat);
      } else {
        this.handleChangeHistoryCondition({
          pageSize: 10,
          pageNumber: 1,
          totalCount: 10,
          keyword: '',
          msgType: '',
          startTime: null,
          endTime: null
        });
        this.searchHistory();
        showHistory = true;
      }

      this.showHistory = showHistory;
  };

  /**
   * 查询历史消息
   */
  @action.bound searchHistory(currentChat) {
    this.historyControl.loading = true;
    this.historyControl.emptyHistory = false;

    const params = {
      pageNumber: this.historyControl.pageNumber,
      keyword: this.historyControl.keyword,
      msgType: this.historyControl.msgType,
      startTime: this.historyControl.startTime,
      endTime: this.historyControl.endTime
    };

    const pageSize = this.historyControl.pageSize;
    let groupOrPerson = currentChat && currentChat.id ? currentChat : this.currentChatPerson;

    let {
      id,
      targetType,
      lastTime: endTime
    } = groupOrPerson;

    const ws = getInstance();
    ws && ws.fetchHistory(
      id,
      targetType + 1,
      getCurrentUser().base_user_id,
      endTime,
      pageSize,
      'searchHistory',
      {...params}
    );
  }

  /**
   * 全局查询会话记录
   */
  @action.bound globalSearchChat() {
    const params = {keyword: this.globalChatRecordData.keyword};
    const ws = getInstance();

    ws && ws.globalSearchChatRecord(params)
  }

  ///////////////////////////////////////////////////////////////////////////
  //   --- 群组
  // /////////////////////////////////////////////////////////////////////////

  @action.bound showCreateGroupModal() {
    this.createGroupVisible = true;
  }

  @action.bound hideCreateGroupModal() {
    this.createGroupVisible = false;
  }

  @action.bound showCreateGroupChatVisible() {
    this.createGroupChatVisible = true;
  }

  @action.bound hideCreateGroupChatModal() {
    this.createGroupChatVisible = false;
  }

  @action.bound showEditGroupModal() {
    this.editGroupVisible = true;
  }

  @action.bound hideEditGroupModal() {
    this.editGroupVisible = false;
  }

  @action.bound showAddPersonToGroupModal() {
    this.addPersonToGroupChatVisible = true;
  }

  @action.bound hideAddPersonToGroupModal() {
    this.addPersonToGroupChatVisible = false;
  }

  /**
   * 创建群
   * 
   * @param params { name, members, groupIconUrl }
   */
  @action.bound
  async createGroup(params) {
    this.createGroupLoading = true;
    this.hideAddPersonToGroupModal();

    let self = this;

    const ws = getInstance();
    ws.createGroup(params, (msg) => {
      let groupId = msg.content.groupId;
      runInAction(() => {
        // 查询群信息
        self.utilStore.dbStore.getGroupInfo(groupId, true);
        self.createGroupLoading = false;
        self.createGroupVisible = false;
        
        let group = self.chatList.filter(chat => chat.id === groupId)[0];
        if (group) {
          // 
          self.currentChatPerson = group;
        } else {
          // 如果当前群不存在，添加到 chatList，然后设置 currentChatPerson
          let obj = {
            id: groupId,
            isGroup: true,
            name: '...',
            date: moment(),
            lastTime: 6049298978020,
            targetType: 1,
            targetId: groupId,
            last: '',
            fromUserId: getCurrentUser().base_user_id,
            unreadCount: 0,
            historyLoading: false,
            historyHasMore: false
          };

          self.addPersonToChatList(obj);
          self.currentChatPerson = self.chatList.filter(person => person.id = obj.id)[0];
        }
      });
    });
  }

  @action.bound
  async addMemberToGroup(groupId, members) {
    this.editGroupLoading = true;

    const ws = getInstance();
    ws.addPersonToGroup({ groupId, members }, (msg) => {
      runInAction(() => {
        // dbStore 来更新 群组的信息
        this.utilStore.dbStore.getGroupInfo(groupId, true);
        this.editGroupLoading = false;
        this.hideEditGroupModal();
        this.openDrawer();
      });
    });
  }

  /**
   * 退出群聊
   * 
   * @param {*} groupId 
   */
  @action.bound
  async exitFromGroup(groupId) {
    const ws = getInstance();
    ws.exitGroup({ groupId }, (data) => {
      console.log('exit group success:', data);
    
      runInAction(() => {
        let id = this.currentChatPerson.id;
        let index = _.findIndex(this.chatList, (o) => o.id = id);
        this.deletePersonFromChatList(index, this.currentChatPerson);
        this.afterExit(groupId);
      });
    });
  }

  @action.bound
  async cancelGroupManager(groupId, groupManagers) {
    const ws = getInstance();
    ws.cancelGroupManager({ groupId, groupManagers }, (msg) => {
      console.log('delete person from group, msg:', msg);

      runInAction(() => {
        // dbStore 来更新 群组的信息
        this.utilStore.dbStore.getGroupInfo(groupId, true);
      });
    });
  }

  @action.bound
  async setGroupManager(groupId, groupManagers) {
    const ws = getInstance();
    ws.setGroupManager({ groupId, groupManagers }, (msg) => {
      console.log('delete person from group, msg:', msg);

      runInAction(() => {
        // dbStore 来更新 群组的信息
        this.utilStore.dbStore.getGroupInfo(groupId, true);
      });
    });
  }

  @action.bound
  async removeMemberFromGroup(groupId, members) {
    const ws = getInstance();
    ws.deletePersonFromGroup({ groupId, members }, (msg) => {
      console.log('delete person from group, msg:', msg);

      runInAction(() => {
        // dbStore 来更新 群组的信息
        this.utilStore.dbStore.getGroupInfo(groupId, true);
      });
    });
  }

  @action.bound
  async transferGroupOwner(groupId, admins) {
    const ws = getInstance();
    ws.changeOwner({ groupId, admins }, (msg) => {
      console.log('transfer group, msg:', msg);

      runInAction(() => {
        // dbStore 来更新 群组的信息
        this.utilStore.dbStore.getGroupInfo(groupId, true);
      });
    });
  }

  @action.bound
  async changeGroupName(groupId, groupName) {
    const ws = getInstance();
    ws.changeGroupName({ groupId, groupName }, (msg) => {
      console.log('change group name, msg:', msg);

      runInAction(() => {
        // dbStore 来更新 群组的信息
        this.utilStore.dbStore.getGroupInfo(groupId, true);
      });
    });
  }

  @action.bound
  async changeGroupAvatar(groupId, groupIconUrl) {
    const ws = getInstance();
    ws.changeGroupAvatar({ groupId, groupIconUrl }, (msg) => {
      console.log('change group avatar, msg:', msg);

      runInAction(() => {
        // dbStore 来更新 群组的信息
        this.utilStore.dbStore.getGroupInfo(groupId, true);
      });
    });
  }
  /**
   * 退出群或者解散群之后要做的
   */
  @action.bound afterExit(groupId) {
    // 删掉这个回话
    this.currentChatPerson = null;
    this.messages.delete(groupId);
    this.setChatList(this.chatList.filter(c => c.id !== groupId));
  }

  @observable myGroups = [];

  @action.bound fetchAllGroups(pageNumber = 1, pageSize = 30) {
    const self = this;

    this.fetchMyGroupListPending = true;

    let ws = getInstance();
    ws.fetchAllGroup(data => {
      const { content: { allGroups } } = data;
      if (allGroups) {
        runInAction(() => {
          this.fetchMyGroupListPending = false;
          allGroups.forEach(group => {
            group.isGroup = true;
            group.id = group.groupId;
            group.name = group.groupName;

            group.avatar = group.groupIconUrl
              ? { media_id: group.groupIconUrl }
              : { default: '/common/images/group_default.png' };

            self.myGroups.push(group);
          })
        });
      }
    }, {
      pageSize,
      pageNumber,
    });

    console.log(this.myGroups);
  }

  /**
   * 设置或者取消置顶
   * 
   * @param {*} value 
   * @param {*} targetId 
   * @param {*} isGroup 
   */
  @action.bound
  setToTop(person) {
    const isTop = person.isTop;

    const ws = getInstance();
    ws.sendConopMsg(person.id, 'top', isTop ? 0 : 1, person.isGroup);
  }

  /**
   * 查询勿扰状态
   * 
   * @param {*} data 
   * @param {*} callBack 
   */
  // @action.bound 
  // async getDisturbStatus(data = false) {
  //   let req = {};
  //   if (data) {
  //     req = {
  //       targetType: data.isGroup ? '2' : '1',
  //       targetId: data.id
  //     };
  //   }

  //   const ws = getInstance();
  //   ws.disturb(req, data => {
  //     const { content: { nopushUsers } } = data;
  //     console.log('get disturb status:', nopushUsers);

  //     runInAction(() => {
  //       nopushUsers.forEach(user => {
  //         let id = user.targetId;
  //         if (id && id.indexOf('|') > 0) {
  //           id = id.split('|')[0];
  //         }

  //         // 不存在就添加上去
  //         if (this.chatListDisturbList.indexOf(id) < 0) {
  //           this.chatListDisturbList.push(id);
  //         }
  //       });

  //       // 重新计算一次
  //       this.computeTotalUnreadCount(this.chatList);
  //     });
  //   });
  // }

  /**
   * 设置勿扰状态
   * 
   * @param {*} data 
   */
  @action.bound 
  setDisturbStatus(data) {    
    const isDisturb = this.chatListDisturbList.indexOf(data.id) > -1;
    const value = isDisturb ? '0' : '1';

    const ws = getInstance();
    ws.sendConopMsg(data.id, 'noti', value, data.isGroup);
  }

  /**
   * 清空聊天记录
   * 
   * clearMessages
   * @param {*} person 
   */
  @action.bound 
  clearMessages(person) {
    const ws = getInstance();
    ws.sendConopMsg(person.id, 'empty', '', person.isGroup);
  }

  /**
   * 删除 chatlist 中的某项
   */
  @action.bound deletePersonFromChatList(index, item) {
    const ws = getInstance();
    ws.sendConopMsg(item.id, 'delete', '', item.isGroup);

    this.closeDrawer();
  }

  /**
   * 删除消息
   * 
   * @param {*} msgId 
   */
  @action.bound deleteHistoryMessage(msgId) {
    const { id, isGroup } = this.currentChatPerson;

    const ws = getInstance();
    ws.sendConopMsg(id, 'delmsg', msgId, isGroup);
  }

  @observable quillEditor = null;

  @action.bound
  setQuillEditor(quillEditor) {
    this.quillEditor = quillEditor;
  }
  
  // end conop message

  /**
   * 发送撤回消息
   */
  @action.bound
  sendWithdrawMessage(msg) {
    const ws = getInstance();
    ws.sendWithdrawMessage(msg);
  }

}
