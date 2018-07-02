import React, { Component } from "react";
import { observer, inject } from 'mobx-react';

import _ from "lodash";

import classNames from "classnames";

import QuillEditor from '../common/quilljs/QuillEditor';

import { getCurrentUser } from "../../lowdb";
import { Button, message } from "antd";


@inject(stores => ({
  chatStore: stores.chatStore,
  dbStore: stores.dbStore,
}))
@observer
export default class ChatInput extends Component {

  quillEditor;

  emptyContent = {
    ops: []
  };

  constructor(props) {
    super(props);

    this.state = {
      isHover: false,
      content: {
        ops: []
      },
    };
  }

  componentDidUpdate() {
    if (this.quillEditor) {
      this.props.chatStore.setQuillEditor(this.quillEditor);
    }
  }

  componentWillReceiveProps(nextProps) {
    const { target } = this.props;
    const { target: nextTarget } = nextProps;

    // 换人聊天，清空输入框
    if (target.id !== nextTarget.id) {
      this.setState({
        content: ''
      });
    }
  }

  handleSendMsg = () => {
    const {
      spliceMessage,
      sendMessage,
    } = this.props.chatStore;

    let msgs = this.state.content;
    if (!msgs) {
      msgs = { ...this.emptyContent };
    }

    let opts = msgs.ops;
    opts.forEach(opt => {
      if (_.isString(opt.insert)) {
        opt.insert = opt.insert.trim();
      }
    });

    // 去掉空字符串
    opts = opts.filter(opt => _.isString(opt.insert) ? !!opt.insert : true);

    let firstOpt = opts[ 0 ];
    if (!firstOpt || !firstOpt.insert) {
      // message.error('信息为空~ 不能发送~');
      this.setState({
        content: ''
      });
      return;
    }

    const currentPerson = this.props.target;

    let ops = opts;
    let messages = [];
    let lastMessage = null;
    const user = getCurrentUser();

    let members = [];

    if (currentPerson.isGroup) {
      members = this.props.dbStore.groupCache.get(currentPerson.id).members || [];
      if (members.indexOf(user.base_user_id) < 0) {
        message.warning('您当前不在这个群组了哦~');
        this.setState({
          content: ''
        });
        return
      }
    }

    const countIds = [];
    if (!currentPerson.isGroup) {
      const msgsBefore = this.props.chatStore.messages.get(currentPerson.id) || [];
      for (let i = msgsBefore.length - 1; i >= 0; i--) {
        let m = msgsBefore[i];
        
        // 遇见第一条不是对方的信息，就跳出
        if (m.from === getCurrentUser().base_user_id) {
          break;
        }

        countIds.push(m.id);
      }
    }

    ops.forEach(msg => {
      if (_.isPlainObject(msg.insert)) {
        let keys = Object.keys(msg.insert);

        const result = spliceMessage(keys[ 0 ], msg.insert, currentPerson, countIds, lastMessage);
        lastMessage = result.lastMessage;

        if (result.pushFlag) {
          messages.push(lastMessage);
        }
      } else {
        // 文字消息
        const result = spliceMessage('text', msg.insert, currentPerson, countIds, lastMessage);
        lastMessage = result.lastMessage;

        if (result.pushFlag) {
          messages.push(lastMessage);
        }
      }
    });

    sendMessage(messages);
    this.setState({
      content: ''
    });
  };

  /**
   *
   * @param content delta
   */
  handleContentChange = (content) => {
    this.setState({
      content: content
    });
  };

  /**
   * 
   */
  handleEnterPress = (evt) => {
    this.handleSendMsg();
  };

  handleEditorKeyDownload = (event) => {
    // if (event.which === 13) { // enter
    //   event.preventDefault();
    //   this.handleSendMsg();
    // }
  };

  handleMouseEnter = () => {
    this.setState({ isHover: true });
  };

  handleMouseLeave = () => {
    this.setState({ isHover: false });
  };

  /**
   * 触发 @ 的时候
   *  1. 当前是不是群
   *  2. 群成员
   *  3. 过滤出需要的信息
   * 
   */
  handleMention = () => {
    const { currentChatPerson } = this.props.chatStore;
    const { groupCache, userCache } = this.props.dbStore;

    // 如果不是群，就算了
    if (!currentChatPerson.isGroup) {
      return [];
    }

    const group = groupCache.get(currentChatPerson.id);
    if (!group) {
      return [];
    }

    const memberIds = group.members;
    let realMembers = [];
    memberIds.forEach(id => {
      let m = userCache.get(id);
      if (m && !m.loading) {
        realMembers.push({
          id: m.id,
          value: m.name
        });
      }
    });

    if (realMembers.length > 0) {
      realMembers.unshift({
        id: 'msg_at_all',
        value: '所有人'
      });
    }

    return realMembers;
  };

  render() {
    const { content } = this.state;
    const { height } = this.props;
    const editorHeight = height - 80;

    let clazz = classNames({
      'chat-chat-input': true,
      'hover': this.state.isHover,
    });

    const {
      currentChatPerson,
    } = this.props.chatStore;

    return (
      <div
        className={clazz}
        onMouseEnter={this.handleMouseEnter}
        onMouseLeave={this.handleMouseLeave}
        style={{ height }}
      >
        <QuillEditor
          ref={el => this.quillEditor = el}
          height={editorHeight}
          content={content}
          onEnterPress={this.handleEnterPress}
          onKeyDown={this.handleEditorKeyDownload}
          onChange={this.handleContentChange}
          onMention={this.handleMention}
          isGroup={currentChatPerson.isGroup}
        />
        <div className="btn-send-wrapper">
          <Button
            className="btn-send"
            type="small"
            onClick={this.handleSendMsg}
          >发送</Button>
        </div>
      </div>
    );
  }
};

ChatInput.defaultProps = {
  height: 160,
  disabled: false,
};
