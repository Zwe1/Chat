import React, { Component } from 'react';
import SearchContent from '../common/SearchContent';
import { Icon, Input, Popover } from 'antd';
import { inject, observer } from 'mobx-react';

const SearchTabValue = {'1': 'all', '2': 'users', '3': 'groups'};
const SearchTabs = ['1', '2', '3'];

@inject(stores => ({
  dbStore: stores.dbStore,
  contactStore: stores.contactStore,
  appStore: stores.appStore,
}))
@observer
export default class InputSearch extends Component {
  constructor(props) {
    super(props);
    this.visibleFlag = 0;
    this.SearchTabFlag = 0; // search面板的tab选项默认第一个
    this.state = {
      visible: false,
      inputClose: false,
      inputStyle: {},
      keyword: '',
      SearchTab: SearchTabs[this.SearchTabFlag], // search面板的tab选项
      searchChange: false,
      keyChange: false,
      listKey: '0', // 上下按键
      enterKey: '0', // 回车键
      networkBtn: {users: false, groups: false}, // 是否进行网络搜索过
  }

  }

  bindOnkeyDown(type = false) {
    if (!type) {
      window.onkeydown = null;
      return
    }

    window.onkeydown = (e) => {
      // 9: tab 38: 上 40: 下 enter: 13
      if (e && e.preventDefault && (e.keyCode === 9 || e.keyCode === 38 || e.keyCode === 40 || e.keyCode === 13)) {
        e.preventDefault(); 
      }
      if (e.keyCode === 38) {
        this.changeListIndex('up');
        return false;
      }
      if (e.keyCode === 40) {
        this.changeListIndex('down');
        return false;
      }
      if (e.keyCode === 9) {
        this.changeSearchTab(SearchTabs[++this.SearchTabFlag % SearchTabs.length]);
      }
      if (e.keyCode === 13) {
        this.enterPerson();
      }
    }
  }

  changeNetworkBtn = networkBtn => {
    const obj = Object.assign(this.state.networkBtn, networkBtn);
    this.setState({
      networkBtn: obj,
    });
  };

  enterPerson = () => {
    const arr = this.state.enterKey.split(',');
    const i = parseInt(arr[ 0 ]);
    this.setState({
      enterKey: `${i + 1},true`,
    });
  };

  changeListIndex = key => {
    const { listKey } = this.state;
    const finalKey = `${parseInt(listKey) + 1},${key}`;
    this.setState({
      listKey: finalKey,
    });
  };

  changeSearchTab = async (SearchTab) => {
    this.setState({
      SearchTab,
      listKey: '0',
      enterKey: '0',
    });

    const netKey = SearchTabValue[SearchTab];
    const { keyword } = this.state;

    if (keyword.length > 0) {
      await this.props.contactStore.fetchUserOrGroupSearch(keyword, netKey);
      this.changeNetworkBtn({[netKey]: true});
      this.changeSearchChange(true);
      this.props.appStore.setListIndex(0);
    }
  };

  changeSearchChange = flag => {
    this.setState({
      searchChange: flag,
    });
  };

  changekeyChange = flag => {
    this.setState({
      keyChange: flag,
    });
  };

  changeSearchTabFlag = flag => {
    this.SearchTabFlag = parseInt(flag) - 1;
  };

  // 搜索框内容改变
  handleSearchChange = async (e) => {
    let inputClose = e.target.value.length > 0;

    // this.props.contactStore.clearUserOrGroup();
    const netKey = SearchTabValue[this.state.SearchTab];

    this.setState({
      keyword: e.target.value,
      listKey: '0',
      enterKey: '0',
      inputClose
    });

    if (e.target.value.length === 0) {
      this.setState({
        networkBtn: {users: false, groups: false},
      });
    }

    if (e.target.value.length > 0) {
      await this.props.contactStore.fetchUserOrGroupSearch(e.target.value, netKey);
      this.props.appStore.setListIndex(0);
      this.changeNetworkBtn({[netKey]: true});
      this.changekeyChange(true);
    }
  };

  // 搜索框获取焦点
  handleSearchFocus = (e) => {
    e.target.value.length > 0 && this.setState({ inputClose: true });
  };

  // 设置popover visible
  handleSetPopoverVisible = (visible) => {
    this.setState({
      visible,
    });
    visible ? this.bindOnkeyDown(true) : this.bindOnkeyDown();
  };

  handleVisibleChange = (visible) => {
    if (this.visibleFlag === 1) { // 点击搜索框
      this.setState({
        visible: true,
        inputStyle: {
          background: '#f2f8f8',
          width: '310px',
        },
      });
      this.visibleFlag = 0;
      this.bindOnkeyDown(true);
      return;
    }

    // 只有点击空白地方会进入这里
    this.bindOnkeyDown();
    this.visibleFlag = 0;
    this.setState({
      visible,
      inputStyle: {},
      inputClose: false,
    });
  };

  // 搜索框点击
  handleSearchClick = () => {
    this.visibleFlag = 1;
  };

  // 删除搜索框内容
  handleclearInput = () => {
    // this.props.contactStore.clearUserOrGroup();
    this.setState({
      keyword: '',
      inputClose: false,
      listKey: '0',
      enterKey: '0',
      networkBtn: {all: false, users: false, groups: false},
    });
  };

  render() {
    const { 
      visible,
      inputStyle, 
      keyword, 
      inputClose, 
      SearchTab, 
      networkBtn,
      searchChange,
      keyChange,
      listKey,
      enterKey,
      changeListIndex,
    } = this.state;

    const {
      updateBaseUserInfo,
    } = this.props.dbStore;

    const {
      networkUserList,
      networkGroupList,
    } = this.props.contactStore;

    const content = <SearchContent 
      keyword={keyword}
      keyChange={keyChange}
      handleHidePop={this.handleSetPopoverVisible}
      SearchTab={SearchTab}
      searchChange={searchChange}
      changekeyChange={this.changekeyChange}
      changeSearchTab={this.changeSearchTab}
      changeSearchChange={this.changeSearchChange}
      changeSearchTabFlag={this.changeSearchTabFlag} 
      networkBtn={networkBtn}
      networkUserList={networkUserList}
      networkGroupList={networkGroupList}
      updateBaseUserInfo={updateBaseUserInfo}
      listKey={listKey}
      enterKey={enterKey}
      changeListIndex={changeListIndex}
    />;

  return (
    <div className='input-all-search'>
      <Popover
        overlayClassName={`search-popover`}
        placement="bottomLeft"
        content={content}
        visible={visible}
        trigger='click'
        onVisibleChange={this.handleVisibleChange}
      >
        <Input.Search
          placeholder='通过关键字可搜索联系人，群组'
          onChange={this.handleSearchChange}
          onFocus={this.handleSearchFocus}
          onClick={this.handleSearchClick}
          style={inputStyle}
          value={keyword}
          tabIndex={-1}
          prefix={inputClose ? <Icon type='close-circle-o' onClick={this.handleclearInput}/> : ''}
        />
        </Popover>
      </div>
    )
  }
}
