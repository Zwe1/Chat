import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import { toJS } from 'mobx';
import { withRouter } from 'react-router-dom';

import ChatTitle from './ChatTitle';
import ChatMessageList from './ChatMessageList';
import ChatMessagePanel from './ChatMessagePanel';
import ChatMessageContent from './ChatMessageContent';
import ChatList from './ChatList';
import ChatInput from './ChatInput';
import ChatDraggable from './ChatDraggable';
import Drawer from '../common/Drawer';
import AgentList from './AgentList'

import SettingPanel from './SettingPanel';

import { Layout, Icon, Alert } from 'antd';
const { Sider } = Layout;

@withRouter
@inject(stores => ({
  homeStore: stores.homeStore,
  chatStore: stores.chatStore,
  dbStore: stores.dbStore,
}))
@observer
export class Chat extends Component {

  constructor(props) {
    super(props);

    this.state = {
      inputHeight: 160
    };
  }

  handleDrawerClose = () => {
    this.props.chatStore.closeDrawer();
  };

  handleSetSize = (height) => {
    this.setState({
      inputHeight: height
    });
  };

  renderSetting() {
    return <SettingPanel />
  }

  renderContent() {
    const {
      chatList,
      messages,
      currentChatPerson,
      drawerOpen,
      enterPublic,
      isJustLoadHistory,
    } = this.props.chatStore;

    if (!currentChatPerson) {
      return (
        <Layout className="chat-content">
          <Alert
            showIcon
            style={{ margin: 20 }}
            message="选择好友开始聊天~"
            type="info"
          />
        </Layout>
      );
    }

    // 当前聊天需要的人，群组的信息
    const { inputHeight } = this.state;
    const curId = currentChatPerson.id;

    if (curId.substr(0, 7) === 's_phone') {
      return (
        <Layout className="chat-content">
          <div className='chat-content-main'>
            <Icon type="warning" />
            <h1>该模块正在努力开发中哦~</h1>
          </div>
        </Layout>  
      )
    }

    return (
      <Layout className="chat-content">
        <ChatTitle ug={currentChatPerson}/>
        {
          enterPublic
            ? <AgentList/>
            : (
            <div>
              <ChatMessageList 
                activeKey={curId} 
                bottom={currentChatPerson.targetType !== 111 ? inputHeight : 0} // targetType 111 代表 应用消息
              >
                {
                  messages.keys().map(id => {
                    const msgArr = toJS(messages.get(id) || []);
                    // 需要比较 props 的变化，所以要 toJS
                    const realCurrentChatPerson = chatList.filter(chat => chat.id === id)[0];
                    
                    return (
                      <ChatMessagePanel key={id}>
                        <ChatMessageContent
                          globalCurrentChatPerson={toJS(currentChatPerson)}
                          currentChatPerson={toJS(realCurrentChatPerson)}
                          isJustLoadHistory={toJS(isJustLoadHistory)}
                          messages={msgArr}
                        />
                      </ChatMessagePanel>
                    );
                  })
                }
              </ChatMessageList>

              <ChatDraggable height={inputHeight} onDrag={this.handleSetSize}/>

              { 
                currentChatPerson.targetType !== 111 && (
                  <ChatInput
                    ref="chatInput"
                    height={inputHeight}
                    target={currentChatPerson}
                  />
                )
              }

              <Drawer
                header={"设置"}
                overlay={false}
                position={'right'}
                open={drawerOpen}
                onClose={this.handleDrawerClose}
                style={{
                  top: 55,
                  width: 345
                }}
              >
                <div className="setting-wrapper">
                  { this.renderSetting() }
                </div>
              </Drawer>
            </div>
          )
        }
      </Layout>
    );
  }

  render() {
    return (
      <Layout className="chat-chat">
        <Sider width={ 250 } className="chat-list-wrapper">
          <ChatList />
        </Sider>
        { this.renderContent() }
      </Layout>
    );
  }
}

export default Chat;
