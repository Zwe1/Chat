import React, { Component } from 'react';
import ChatMessage from './ChatMessage'
import { inject, observer } from 'mobx-react';

import SpringScrollbars from '../common/scrollbar/SpringScrollbars';
import GroupMemberModal from './GroupMemberModal';

import { Spin } from 'antd';

import $ from 'jquery';
import { MessageTypes } from '../../common/types';

@inject(stores => ({
  contactStore: stores.contactStore,
  chatStore: stores.chatStore,
}))
@observer
export default class ChatMessageContent extends Component {

  $scrollbar = null;

  constructor(props) {
    super(props);

    this.state = {
      oldListHeight: 0,
      totalNewMsg: 0,  // 统计有多少条新消息
    };

    // 滚动栏之前的高度
    this.height = 0;

    // 之前的读取的消息的位置
    // this.oldHistoryPosition = 0;

    // 滚动条当前的高度
    this.scrollNowHeight = 0;

    // 滚动条滚动到最底的高度
    this.scrollToBottomHeight = 0;

    // 是否滑到最底
    this.bottomFlag = false;

    // 加载历史记录的flag
    this.historyFlag = false;

    // 当加载还在ing的时候 人为又滚动的记录
    this.loadingScroll = 0;

    // 是否为网络加载的标记
    this.netWork = false;
  }

  componentDidMount() {
    this.scrollToBottom();
    this.height = this.$scrollbar.getScrollHeight();
  }

  componentWillReceiveProps(nextProps) {
    const {
      globalCurrentChatPerson: nextPerson,
      currentChatPerson: nextCurrentChatPerson,
    } = nextProps;

    const {
      globalCurrentChatPerson: currentPerson,
      currentChatPerson,
    } = this.props;

    // console.log('[chat message content] - componentWillReceiveProps', currentPerson, nextPerson);

    if (nextCurrentChatPerson.id !== nextPerson.id) {
      this.scrollToBottom();

      // const self = this;
      setTimeout(() => {
        this.scrollToBottom();
      }, 100);
    }

    // 获取了新的分页信息，要调整滚动条
    if (nextCurrentChatPerson.lastTime < currentChatPerson.lastTime) {
      this.setState({
        oldListHeight: this.$scrollbar.getScrollHeight()  // 记录之前的 高度
      });

      // return;
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    const {
      messages: newMessages,
      currentChatPerson: newPerson,
    } = nextProps;

    const {
      messages,
      currentChatPerson,
    } = this.props;

    const { totalNewMsg: newTotalNewMsg } = nextState;
    const { totalNewMsg } = this.state;
    
    const { currentChatPerson: realPerson } = this.props.chatStore;
    
    if (totalNewMsg !== newTotalNewMsg) {
      return true;
    }

    if (newPerson.historyLoading !== currentChatPerson.historyLoading
      || newPerson.historyHasMore !== currentChatPerson.historyHasMore) {
      return true;
    }

    return true;
  }

  /**
   * 
   * 组件更新
   * 
   * @param {*} prevProps 
   * @param {*} prevState 
   */
  componentDidUpdate(prevProps, prevState) {
    const {
      messages: oldMessages,
      currentChatPerson: oldPerson,
    } = prevProps;
    
    const {
      messages,
      currentChatPerson,
      isJustLoadHistory,
      globalCurrentChatPerson: currentPerson,
    } = this.props;

    if (currentPerson.id !== currentChatPerson.id) {
      return;
    }

    // console.log('[chat message content] - componentDidUpdate', currentChatPerson);

    const {
      localHistoryMsgFlag,
    } = this.props.chatStore;
    
    // 信息多了
    if (messages.length - oldMessages.length === 1) {
      const item = messages[ messages.length - 1 ];
      
      // 自己chatInput发出的消息
      if (item && item.inputFlag) { 
        this.netWork = false;

        if (item.objectName !== MessageTypes.img) { // 发出的信息不是图片信息
          this.scrollToBottom();
          this.setState({
            totalNewMsg: 0,
          });

          this.scrollToBottomHeight = this.$scrollbar.getScrollTop();
          this.scrollNowHeight = this.$scrollbar.getScrollHeight();
        }
      } 
      
      // 不是自己发出的消息
      else { 
        // 在最底下，则自动下滑
        if (this.bottomFlag) {
          this.scrollToBottom();
          this.scrollToBottomHeight = this.$scrollbar.getScrollTop();
          this.scrollNowHeight = this.$scrollbar.getScrollHeight();
        } else { 
          // 不在最底下, 停留在当前位置
          this.setState({
            totalNewMsg: this.state.totalNewMsg + 1,
          });

          this.scrollToBottomHeight += (this.$scrollbar.getScrollHeight() - this.scrollNowHeight);
          this.scrollNowHeight = this.$scrollbar.getScrollHeight();
        }
      }

      return;
    }

    const msg = messages.filter(item => !item.inputFlag);
    // const oldMsg = oldMessages.filter(item => !item.inputFlag);
    const length = msg.length - oldMessages.length;

    if (!currentChatPerson.historyLoading && oldPerson.historyLoading) {
      let oldHeight = this.state.oldListHeight;
      if (oldHeight) {
        let scrollH = this.$scrollbar.getScrollHeight();
        this.netWork = true;

        scrollH = this.$scrollbar.getScrollHeight() - oldHeight;

        // 加载时 loading 还存在的情况下 滚动的值
        if (this.loadingScroll && this.loadingScroll > 0) {
          scrollH += this.loadingScroll + 1; // 1为偏差值
        }

        const imgMsgLength = messages.filter(item => item.objectName === MessageTypes.img).length;
        // 若历史加载有图片，且为服务器加载
        if (imgMsgLength > 0 && (length > 0 || localHistoryMsgFlag)) {
          this.$scrollbar.scrollTo(scrollH);
        } else {
          this.$scrollbar.scrollTo(scrollH);
          this.height = this.$scrollbar.getScrollHeight();
        }
      } else {
        this.height = this.$scrollbar.getScrollHeight();
      }
    }

    // 消息列表数量没有变，但是消息列表的内容变了，比如 hasRead
    if (!currentChatPerson.historyLoading
      && isJustLoadHistory
      && messages.length > 0) {
      // 加载了历史 不管怎么样都要发送已读
      // 而且是批量的
      this.props.chatStore.batchSendHasRead(messages, currentChatPerson.id);
      this.props.chatStore.setIsJustLoadHistory(false);
    }
  }

  handleImageLoaded = msg => {
    const {
      localHistoryMsgFlag,
    } = this.props.chatStore;

    // 发送图片的时候为本地加载
    if (msg.local) {
      this.scrollToBottom();

      this.height = this.$scrollbar.getScrollHeight();
      this.setState({
        totalNewMsg: 0,
      });

      this.scrollToBottomHeight = this.$scrollbar.getScrollTop();
      this.scrollNowHeight = this.$scrollbar.getScrollHeight();

      return;
    }

    let scrollH = 0;
    const scrollbarScrollHeight = this.$scrollbar.getScrollHeight();
    if (scrollbarScrollHeight > this.height) {
      scrollH = scrollbarScrollHeight - this.height;

      // if (localHistoryMsgFlag) {
      //   scrollH = this.$scrollbar.getScrollHeight() - this.height;     
      // } else {
      //   if (this.netWork) {
      //     scrollH = this.$scrollbar.getScrollHeight() - this.height;
      //   }
      // }

      if (this.loadingScroll && this.loadingScroll > 0) {
        scrollH += this.loadingScroll + 1; // 1为偏差值
      }

      if (this.netWork) {
        this.$scrollbar.scrollTo(this.scrollToBottomHeight + scrollH);
      } 

      else {
        if (this.bottomFlag) {
          this.scrollToBottom();
        }
      }

      this.height = scrollbarScrollHeight;
    }

    if (this.netWork && this.bottomFlag) {
      return;
    }

    // if (!this.netWork && this.bottomFlag) {
    //   this.scrollToBottom();
    //   return;
    // }
  };

  handleMLWheel = (event) => {
    const { currentChatPerson } = this.props;
    if (currentChatPerson.historyLoading && this.historyFlag) {
      this.historyFlag = false;
      return;
    }
    
    let scrollTop = this.$scrollbar.getScrollTop();
    if (currentChatPerson.historyLoading) {
      this.loadingScroll = scrollTop;
    }
    
    // 没有滚到底，要显示计数小气泡
    if (scrollTop >= (this.scrollToBottomHeight - 10)) {
      this.bottomFlag = true;

      this.setState({
        totalNewMsg: 0
      });
    } else {
      this.bottomFlag = false;
    }
    
    const { deltaY } = event;
    if (deltaY < 0 // 向上滚动
      && scrollTop < 10
      && !currentChatPerson.historyLoading
      && currentChatPerson.historyHasMore) {
      // 显示 loading
      this.historyFlag = true;
      
      // 加载历史消息（服务器历史消息，本地历史消息）
      const { fetchHistoryByPage } = this.props.chatStore;
      fetchHistoryByPage();
    }
  };

  scrollToTop = () => {
    this.$scrollbar && this.$scrollbar.scrollToTop();
  };

  scrollToBottom = () => {
    this.$scrollbar && this.$scrollbar.scrollToBottom();
    this.bottomFlag = true;
  };

  /**
   * 确认开始转发信息
   */
  handleMessageRedirectSubmit = (values, memberList, checkedUsers) => {
    // console.log('before redirect:', memberList, checkedUsers);
    this.props.chatStore.redirectMsgs(checkedUsers);
  };

  handleMessageRedirectCancel = () => {
    this.props.chatStore.closeRedirectMsgModal();
  };

  /**
   * 点击了小气泡，滚到最下面
   */
  handleNewMsg = () => {
    this.scrollToBottom();

    this.setState({
      totalNewMsg: 0,
    });
  };

  handleFindHistoryClick = (e) => {
    this.props.chatStore.handleFindHistoryClick();
  };

  handleSeeMoreMessagesClick = (e) => {
    console.log('see more messages');

    // 显示 loading
    this.historyFlag = true;
    
    // 加载历史消息（服务器历史消息，本地历史消息）
    const { fetchHistoryByPage } = this.props.chatStore;
    fetchHistoryByPage();
  };

  renderMessages(messages = []) {
    let lastMessage = null;

    return messages.map((item, index) => {
      const ret = (
        <ChatMessage
          key={item.id}
          index={index}
          message={item}
          onImgLoaded={this.handleImageLoaded}
          messages={messages}
          lastMessage={lastMessage}
        />
      );

      lastMessage = item;
      return ret;
    });
  }

  render() {
    const {
      messages,
      currentChatPerson
    } = this.props;
    
    // console.log('chat message content - render', currentChatPerson.id);

    const {
      redirectMsgModalVisible,
      redirectMsgModalLoading,
      handleFindHistoryClick
    } = this.props.chatStore;

    const {
      totalNewMsg,
    } = this.state;

    const allMessages = this.renderMessages(messages);

    return (
      <div style={{ height: '100%' }}>
        <SpringScrollbars
          style={{ height: '100%' }}
          renderTrackHorizontal={null}
          onWheel={this.handleMLWheel}
          ref={el => this.$scrollbar = el}
        >
          <div className="messages-top-flag">
            {
              currentChatPerson.historyLoading && <div className='message-loading-more'><Spin /></div>
            }

            {
              (!currentChatPerson.historyLoading && currentChatPerson.historyHasMore && allMessages.length > 0) 
                && <div className=""><a href="#" onClick={this.handleSeeMoreMessagesClick}>查看更多信息</a></div>
            }

            {
              (!currentChatPerson.historyHasMore && !currentChatPerson.historyLoading)
                && <div className='no-more-data'>更多消息请在 <a href="#" onClick={this.handleFindHistoryClick}>消息记录</a> 中查看</div>
            }
          </div>

          {allMessages}
          {/*<audio id="chat-message-audio" src="">不支持 audio 标签</audio>*/}
          <div style={{height: 10}}></div>
        </SpringScrollbars>

        { totalNewMsg > 0 && <div className='tip-new-msg' onClick={this.handleNewMsg}>{totalNewMsg}</div> }

        {
          redirectMsgModalVisible ?
            <GroupMemberModal
              title="转发"
              maxCount={100}
              mode="redirect"
              showForm={false}
              visible={redirectMsgModalVisible}
              formLoading={redirectMsgModalLoading}
              onSubmit={this.handleMessageRedirectSubmit}
              onCancel={this.handleMessageRedirectCancel}
            /> : null
        }
      </div>
    );
  }

}

ChatMessageContent.defaultProps = {
  messages: [],
  bottom: 120,
  currentChatPerson: {},
};

