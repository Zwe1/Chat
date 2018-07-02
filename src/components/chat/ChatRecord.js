import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import classnames from 'classnames';
import SearchHistory from './SearchHistory';
import HistoryList from './HistoryList';
import OliAvatar from "../common/Avatar";
import OliSimpleSpan from "../common/prop/SimpleSpan";
import SpringScrollbars from '../common/scrollbar/SpringScrollbars';
import { ContextMenuTrigger } from "react-contextmenu";
import {
  Input,
  Icon,
  Alert
} from 'antd';
let isMounted = false;

@inject((stores) => ({
  chatStore: stores.chatStore
}))
@observer
export default class ChatRecord extends Component {
  constructor(props) {
    super(props);
    this.height = 450;
    this.state = {
      chatItom: null,
      isMounted: false
    };
  }

  componentDidMount() {
    this.setState({isMounted: true});
  };



  renderList(chatList) {

    if (this.state.isMounted && chatList.length === 0) {
      return (
        <Alert
          style={{ margin: 10 }}
          message="无匹配内容"
        />
      );
    }

    return (
      <ul className="chat-list">

        {chatList.map((item, index) => {
          if (item.isRemoved) {
            return '';
          }

          let clazz = classnames({
            'chat-item': true,
            'sticky-top': item.isTop,
          });

          let type = item.isGroup ? 'group' : 'user';

          return (
            <li
              className={clazz}
              key={index}
              onClick={() => this.handleClickChat(item)}
            >
              <ContextMenuTrigger id={`cl-${item.id}`}>
                <div className="left">
                  <OliAvatar size={40} type={type} id={item.id} popover={false}/>
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
                          {this.getMsgContent(item)}
                        </span>
                      )
                    }
                  </div>
                </div>
              </ContextMenuTrigger>
            </li>
          );
        })}
      </ul>
    );
  }

  renderContent = () => {
    const { globalChatRecordData } = this.props.chatStore;
    return (
      globalChatRecordData.chatid &&
        <div className="content-wrapper">
          <header>
            <Icon type="message"/><span onClick={this.gointoChat}>进入聊天</span>
          </header>
          <HistoryList
            chatItom={this.state.chatItom}
            className="record-content"
            chatid={globalChatRecordData.chatid}
            height={this.height - 80}
          />
        </div>
    );
  };

  getMsgContent = (chat) => {
    if (!chat) {
      return ''
    }

    const { globalChatRecordData } = this.props.chatStore;
    let id = chat.isGroup ? chat.id : chat.targetId.split(',').join('-');
    const matchMsg = globalChatRecordData.chatMessage[id];
    if (!matchMsg) {
      return
    }

    if (matchMsg.msgCount && matchMsg.msgCount === '1') {
      return matchMsg.msgContent
    } else {
      return matchMsg.msgCount + '条相关聊天记录'
    }
  };

  gointoChat = () => {
    const {
      currentChatPerson = {},
      selectPersonToChat,
      switchState,
    } = this.props.chatStore;
    const { chatItom } = this.state;

    this.getoutAndClear();

    if (!currentChatPerson || chatItom.id !== currentChatPerson.id) {
      selectPersonToChat(chatItom);
      switchState('enterPublic', false);
    };

  };

  //退出，清空数据
  getoutAndClear = () => {
    const {
      handleOpenChatRecord,
      clearHistory,
      handleChangeChatRecord
    } = this.props.chatStore;

    handleOpenChatRecord(false);
    clearHistory();
    handleChangeChatRecord({
      list: [],
      keyword: '',
      chatid: null
    });
  };

  handleClickChat = (item) => {
    this.props.chatStore.handleChangeChatRecord({
      chatid: item.id
    });
    this.setState({
      chatItom: item
    });
    this.props.chatStore.handleFindHistoryClick('global', item);
  };

  render() {
    const {
      showChatRecord,
      globalChatRecordData,
      handleChangeChatRecord,
      chatRecordList
    } = this.props.chatStore;
    const suffix = globalChatRecordData.keyword !== '' ?
      <Icon type="close-circle" onClick={(e) => handleChangeChatRecord({keyword: ''})}/>
      : null;

    return (
      <SearchHistory
        contentClassName="global-chat-record"
        title="搜聊天记录"
        placeholder="搜索"
        width={700}
        visible={showChatRecord}
        onCancel={() => this.getoutAndClear()}
      >
        <Input
          prefix={<Icon type="search"/>}
          suffix={suffix}
          value={globalChatRecordData.keyword}
          onChange={(e) => handleChangeChatRecord({keyword: e.target.value})}
          onPressEnter={this.props.chatStore.globalSearchChat}
        />
        <section>
          <SpringScrollbars
            className="scroll-bar"
            style={{width: 200, height: this.height}}
            renderTrackHorizontal={null}
          >
            {this.renderList(chatRecordList)}
          </SpringScrollbars>
          {this.renderContent()}
        </section>
      </SearchHistory>
    )
  }
}