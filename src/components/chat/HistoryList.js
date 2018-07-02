import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import { toJS } from 'mobx';
import {
  List,
  Spin,
  Pagination
} from 'antd';
import { buildMediaUrl } from '../../services/media';
import SpringScrollbars from '../common/scrollbar/SpringScrollbars';
import ChatMessage from './ChatMessage';
import OliSpan from '../common/prop/Span';

@inject((stores) => ({
  chatStore: stores.chatStore
}))
@observer
export default class HistoryList extends Component {
  constructor(props) {
    super(props);
    this.$history = null;
    this.emptyText = '无匹配数据';
    this.state = {
      history: [],
      loading: false
    };
  }

  scrollToEnd = () => {
    this.$history && this.$history.scrollToBottom();
  };

  componentDidUpdate(prevprops) {
    prevprops.scrollToEnd && !prevprops.chatStore.historyControl.loading && this.scrollToEnd();
  }

  renderItem = (item, index) => {
    const { history, currentChatPerson } = this.props.chatStore;
    const { chatid, tabKey } = this.props;
    let id = '';
    if (chatid) {
      id = chatid;
    } else if (currentChatPerson) {
      id = currentChatPerson.id;
    }

    const className = tabKey === '2' ? 'history-item file-history' : 'history-item';

    return (
      <List.Item key={item.id} className={className}>
        <ChatMessage
          index={index}
          historyMsg
          highLight
          historyFileList={tabKey === '2'}
          messages={history.get(id)}
          message={item}
        />
        <div className="time">{item.date.format('YYYY-MM-DD hh:mm:ss')}</div>
        {tabKey === '2' && <div className="name"><OliSpan userId={item.from} prop="base_user_name"/></div>}
      </List.Item>
    );
  };

  renderImage = (msgs) => {
    if (msgs && msgs.length > 0) {
      let imageSrc = '';
      return msgs.map((message, index) => {
        if (message.content && _.isString(message.content)) {
          imageSrc = 'data:image/png;base64,' + message.content;
        } else if (message.imgUri) {
          imageSrc = buildMediaUrl(message.imgUri);
        } else {
          imageSrc = message.imageBase64;
          message.local = true; // 本地
        }

        return (
          <div
            key={'img'+index}
            className="image-wrapper"
            title={message.date.format('YYYY-MM-DD hh:mm:ss')}
            onClick={() => this.handleBigPicture(msgs, index)}
          >
            <img
              className="history-image"
              src={imageSrc}
            />
          </div>
        );
      })
    }

    const text = this.props.chatStore.historyControl.emptyHistory ? this.emptyText : '';
    return <div className="ant-list-empty-text">{text}</div>
  };

  // 查看大图
  handleBigPicture = (messages, index) => {
    const imgArray = messages
      .filter((v, i) => {
        v.messageIndex = i;
        return (v.extra && v.extra.imgUrl) || v.imageBase64;
      })
      .map(v => {
        return {
          messageIndex: v.messageIndex,
          imgUrl: v.extra && v.extra.imgUrl ? buildMediaUrl(v.extra.imgUrl) : '',
          imageBase64: v.imageBase64
        };
      });

    if (window.isElectron()) {
      const { ipcRenderer } = window.require('electron');

      ipcRenderer.sendSync('openPic', {
        url: location.origin,
        filename: { i: index, imgArray: imgArray }
      });
    } else {
      const {
        setLookPicture,
        setPictureMessage,
        setLookPictureIndex
      } = this.props.chatStore;

      setLookPicture(true);
      setPictureMessage(imgArray);
      setLookPictureIndex(index);
    }
  };

  handleSearch = (params) => {
    this.props.chatStore.handleChangeHistoryCondition(params);
    this.props.chatStore.searchHistory(this.props.chatItom);
  };

  render() {
    const { history, historyControl, currentChatPerson } = this.props.chatStore;
    const { chatid, tabKey } = this.props;
    const emptyText = historyControl.emptyHistory ? this.emptyText : '';
    let dataSource = [];

    if (chatid) {
      dataSource = history.get(chatid);
    } else if (currentChatPerson) {
      dataSource = history.get(currentChatPerson.id);
    }

    if (tabKey === '2' || tabKey === '3') {
      dataSource = dataSource && toJS(dataSource).reverse();
    }

    return (
        <div className="history-list-content-wrapper">
          <Spin
            size="large"
            spinning={historyControl.loading}
            wrapperClassName={tabKey === '2' ? 'no-border-file' : ''}
            delay={500}
          >
            <SpringScrollbars
              style={{ height: this.props.height || 370 }}
              renderTrackHorizontal={null}
              ref={(ref) => this.$history = ref}
              className={this.props.className || ''}
            >
              {
                tabKey === '3' ?
                  this.renderImage(dataSource) :
                  <List
                    locale={{emptyText: emptyText}}
                    dataSource={dataSource}
                    renderItem={this.renderItem}
                  />
              }
            </SpringScrollbars>
          </Spin>
          <Pagination
            size="small"
            showSizeChanger
            current={historyControl.pageNumber}
            pageSize={historyControl.pageSize}
            total={historyControl.pageCount}
            showTotal={total => `共 ${total} 条`}
            onChange={(page) => this.handleSearch({pageNumber: page})}
            onShowSizeChange={(current, size) => this.handleSearch({pageSize: size})}
          />
        </div>
    )
  }
}
