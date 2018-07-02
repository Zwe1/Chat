import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import {
  Input,
  Tabs,
  Button,
  LocaleProvider,
  DatePicker
} from 'antd';
import zhCN from 'antd/lib/locale-provider/zh_CN';
import HistoryList from './HistoryList';
import { MessageTypes } from '../../common/types';
const { RangePicker } = DatePicker;
const TabPane = Tabs.TabPane;

@inject((stores) => ({
  chatStore: stores.chatStore
}))
@observer
export default class HistoryContent extends Component {
  constructor(props) {
    super(props);
    
    this.state = {
      placeholder: '输入关键字',
      tabKey: '1'
    }
  }

  handleTabsChange = (key) => {
    this.props.chatStore.clearHistory();
    let msgType = '';

    switch (key) {
      case '1':
        msgType = '';
        break;
      case '2':
        msgType = MessageTypes.file;
        break;
      case '3':
        msgType = MessageTypes.img;
        break;
      case '4':
        msgType = MessageTypes.link;
        break;
    }

    this.setState({tabKey: key});
    this.handleSearch({msgType: msgType, pageNumber: 1, pageSize: key === '3' ? 30 : 10});
  };

  handleKeywordChange = (e) => {
    this.props.chatStore.handleChangeHistoryCondition({keyword: e.target.value});
  };

  handleSearch = (params) => {
    this.props.chatStore.handleChangeHistoryCondition(params);
    this.props.chatStore.searchHistory();
  };

  changeDataRange = (data, datastring) => {
    this.props.chatStore.handleChangeHistoryCondition({
      startTime: datastring[0],
      endTime: datastring[1]
    });
  };

  render() {
    const { placeholder, tabKey } = this.state;
    const { historyControl } = this.props.chatStore;

    return (
      <LocaleProvider locale={zhCN}>
        <div className='history-message-content'>
          <div className="search-bar">
            <Input
              placeholder={placeholder}
              value={historyControl.keyword}
              onChange={this.handleKeywordChange}
              onPressEnter={() => this.handleSearch({pageNumber: 1})}
            />
            <RangePicker
              onChange={this.changeDataRange}
            />
            <Button
              type="primary"
              onClick={this.props.chatStore.searchHistory}
            >搜索</Button>
          </div>
          <Tabs defaultActiveKey='1' onChange={this.handleTabsChange} type="card">
            <TabPane tab="全部" key="1"><HistoryList scrollToEnd/></TabPane>
            <TabPane tab="文件" key="2"><HistoryList tabKey={tabKey}/></TabPane>
            <TabPane tab="图片" key="3"><HistoryList tabKey={tabKey}/></TabPane>
            <TabPane tab="链接" key="4"><HistoryList/></TabPane>
          </Tabs>
        </div>
      </LocaleProvider>
    )
  }
}
