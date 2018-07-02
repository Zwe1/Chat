import React, { Component } from "react";
import { Spin, Alert, Badge } from "antd";
import classnames from "classnames";
import { inject, observer } from "mobx-react";
import { ContextMenu, MenuItem, ContextMenuTrigger } from "react-contextmenu";

import { FaBellSlash } from "react-icons/lib/fa";

import SpringScrollbars from "../common/scrollbar/SpringScrollbars";

import OliAvatar from "../common/Avatar";
import OliSimpleSpan from "../common/prop/SimpleSpan";
import { formatShort } from "../../common/dateFormat";
import oliEmoji from "../common/emoji/oli-emoji";

import { toJS } from 'mobx';

import { getCurrentUser } from "../../lowdb";
import { appIdenTypesByStr } from "../../common/types";

import ChatListItem from "./ChatListItem";

@inject(stores => ({
  dbStore: stores.dbStore,
  homeStore: stores.homeStore,
  chatStore: stores.chatStore,
}))
@observer
export default class ChatList extends Component {

  componentDidMount() {
    if (window.isElectron()) {
      const { remote } = window.require('electron');
      const BrowserWindow = remote.BrowserWindow;

      let wins = BrowserWindow.getAllWindows();
      let mainWin = wins.filter(win => win.oliType === 'mainModal')[ 0 ];
      mainWin && mainWin.on('focus', () => {
        // console.log('----------------------------- window focus', appIdenTypesByStr);
        
        const { activeBar = '' } = this.props.homeStore;
        if (activeBar.split('_')[0] === appIdenTypesByStr.chat) {
          this.props.chatStore.removeCurrentBadge();
        }
      });
    }

    const { setChatListScrollbars } = this.props.chatStore;
    setChatListScrollbars(this.refs.chatListScrollbars);
  }

  // handleChatCompanySelect = (company) => {
  //   this.props.chatStore.switchState('enterPublic', true);
  // };

  renderChatList() {
    const {
      chatList,
      fetchChatListPending,
      currentChatPerson,
      chatListTopList,
      chatListDisturbList,
      selectPersonToChat,
      clearMessages,
      setToTop,
      setDisturbStatus,
      deletePersonFromChatList,
    } = this.props.chatStore;

    if (fetchChatListPending) {
      return (
        <Spin>
          <Alert
            style={{ margin: 10 }}
            message="加载中"
            type="error"
          />
        </Spin>
      );
    }

    if (chatList.length === 0) {
      return (
        <Alert
          style={{ margin: 10 }}
          message="聊天列表为空~"
          type="error"
        />
      );
    }
    
    return (
      <ul>
        {/*
          <li
            className="chat-item sticky-top"
            onClick={this.handleChatCompanySelect.bind(this, { tenantId: 'sssdsd' })}
          >
           <div className="react-contextmenu-wrapper">
              <div className="left">
                <OliAvatar size={40} popover={false}/>
                <div className="name-message">
                  <h3>泛微软件公司</h3>
                  <span>{oliEmoji.emojiToSymbol('你好')}</span>
                </div>
              </div>

              <div className="right">
                <p className="date">12:00</p>
                <div>
                  <FaBellSlash className="dndm"/>
                  <Badge count={0} overflowCount={99}/>
                </div>
              </div>
            </div>
          </li> 
        */}

        {chatList.map((item, index) => {
          if (item.isRemoved) {
            return '';
          }

          const isDisturb = chatListDisturbList.indexOf(item.id) > -1;
          const isTop = item.isTop;
          const isActive = currentChatPerson != null && item.id === currentChatPerson.id;

          return (
            <ChatListItem 
              key={item.id}
              index={index}
              isTop={isTop} 
              isDisturb={isDisturb}
              isActive={isActive}
              item={toJS(item)}
              selectPersonToChat={selectPersonToChat}
              clearMessages={clearMessages}
              setToTop={setToTop}
              setDisturbStatus={setDisturbStatus}
              deletePersonFromChatList={deletePersonFromChatList}
            />
          );
        })}
      </ul>
    );
  }

  render() {
    return (
      <div className="chat-chat-list">
        <SpringScrollbars
          ref='chatListScrollbars'
          style={{
            position: 'relative'
          }}
        >
          {this.renderChatList()}
        </SpringScrollbars>
      </div>
    );
  }
}
