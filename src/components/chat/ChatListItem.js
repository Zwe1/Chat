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

import { getCurrentUser } from "../../lowdb";
import { appIdenTypesByStr } from "../../common/types";

export default class ChatListItem extends Component {

  constructor(props) {
    super(props);

    this.state = {
      isHover: false,
    };

    this.handleDNDM = this.handleDNDM.bind(this);
    this.handleChatDelete = this.handleChatDelete.bind(this);
    this.handleStickTop = this.handleStickTop.bind(this);
    this.handleClearHistory = this.handleClearHistory.bind(this);
  }

  shouldComponentUpdate(nextProps, nextState) {
    // console.log('chat list item - should component update', nextProps.item.unreadCount);

    const { isHover } = this.state;
    const { isHover: nextHover } = nextState;

    if (isHover != nextHover) {
      return true;
    }

    const {
      isDisturb: oldDisturb,
      isTop: oldTop, 
      isActive: oldActive, 
      item: oldItem,
    } = this.props;

    const {
      isDisturb, 
      isTop, 
      isActive, 
      item
    } = nextProps;

    // console.log('chat list item - should component update, old', oldItem.unreadCount);

    if (item.date !== oldItem.date 
      || item.last !== oldItem.last 
      || item.unreadCount !== oldItem.unreadCount) {
      return true;
    }

    if (oldDisturb !== isDisturb 
      || oldTop !== isTop 
      || oldActive !== isActive) {
      return true;
    }
    
    return false;
  }

  handleLiMouseEnter = () => {
    this.setState({
      isHover: true
    });
  };

  handleLiMouseLeave = () => {
    this.setState({
      isHover: false
    });
  };

  handleChatPersonSelect = (event) => {
    const { item, isActive } = this.props;

    const {
      selectPersonToChat,
      switchState
    } = this.props;

    if (!isActive) {
      console.log('select person to chat:', item);
      selectPersonToChat(item);
    }
  };

  /**
   * 删除会话
   */
  handleChatDelete = (event) => {
    event && event.stopPropagation();

    const { index, item } = this.props;
    this.props.deletePersonFromChatList(index, item);
  };

  /**
   * 打开聊天的同时打开设置页面
   */
  handleSetting = () => {

  };

  /**
   * 设置或者取消勿扰模式
   */
  handleDNDM = (event) => {
    event && event.stopPropagation();

    const { item } = this.props;
    this.props.setDisturbStatus(item);
  };

  /**
   * 设置或者取消置顶
   */
  handleStickTop = (event) => {
    event && event.stopPropagation();

    const { item } = this.props;
    this.props.setToTop(item);
  };
  
  /**
   * 清空历史记录
   */
  handleClearHistory = (event) => {
    event && event.stopPropagation();

    const { item } = this.props;
    this.props.clearMessages(item);
  };

  render() {
    // console.log('chatlist item render');
    
    const { isDisturb, isTop, isActive, item } = this.props;
    const { isHover } = this.state;

    let type = item.isGroup ? 'group' : 'user';
    let dateString = formatShort(item.date);

    let clazz = classnames({
      'chat-item': true,
      'active': isActive,
      'sticky-top': isTop,
    });

    return (
      <li
        className={clazz}
        onClick={this.handleChatPersonSelect}
        onMouseEnter={this.handleLiMouseEnter}
        onMouseLeave={this.handleLiMouseLeave}
      >
        <ContextMenuTrigger id={`cl-${item.id}`}>
          <div className="left">
            {
              isHover 
                && <b className='close' onClick={this.handleChatDelete}/>
            }

            <OliAvatar size={40} type={type} id={item.id} popover={false} />

            <div className="name-message">
              <h3>
                {
                  item.isGroup
                    ? <OliSimpleSpan groupId={item.id} prop="groupName" defaultValue={item.name}/>
                    : <OliSimpleSpan userId={item.id} prop="base_user_name" defaultValue={item.name}/>
                }
              </h3>
              {
                item.last 
                  && (
                  <span>
                    { isDisturb && item.unreadCount > 0 ? `[${item.unreadCount} 条]` : '' }
                    { item.showAt && <span style={{ color: 'red', fontSize: 12, display: 'inline'}}>[有人@你]</span> }
                    { oliEmoji.emojiToSymbol(item.last) }
                  </span>
                )
              }
            </div>
          </div>

          <div className="right">
            <p className="date">{dateString}</p>
            <div>
              { isDisturb && <FaBellSlash className="dndm" /> }
              {
                isDisturb && item.unreadCount > 0
                  ? <Badge status="error" /> // 免打扰显示红点
                  : <Badge count={item.unreadCount || 0} overflowCount={99}/> // 否则显示数字
              }
            </div>
          </div>
        </ContextMenuTrigger>
        <ContextMenu id={`cl-${item.id}`}>
          <MenuItem data={item} onClick={this.handleStickTop}>{isTop ? '取消置顶' : '置顶会话'}</MenuItem>
          <MenuItem data={item} onClick={this.handleDNDM}>{isDisturb ? '允许消息通知' : '消息免打扰'}</MenuItem>
          <MenuItem data={item} onClick={this.handleChatDelete}>删除会话</MenuItem>
          {/*<MenuItem data={item} onClick={this.handleClearHistory}>清空聊天记录</MenuItem>*/}
          {/* <MenuItem data={item} onClick={this.handleSetting}>设置</MenuItem> */}
        </ContextMenu>
      </li>
    );
  }
}

ChatListItem.defaultProps = {
  key: 0,
  index: 0, // 这就是 index
  isTop: false,
  isDisturb: false,
  isActive: false,
  item: {},
  selectPersonToChat: () => {},
  clearMessages: () => {},
  setToTop: () => {},
  setDisturbStatus: () => {},
  deletePersonFromChatList: () => {},
};