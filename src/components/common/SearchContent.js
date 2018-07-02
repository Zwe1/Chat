import React, { Component } from 'react';
import { Tabs, List, Spin, Icon, Alert } from 'antd';
import _ from 'lodash';
import OliAvatar from '../common/Avatar';
import { ChatRecord } from '../common'

import {
  setSearch,
  getSearch,
  clearSearch,
} from '../../lowdb/lowdbSearch';

import SpringScrollbars from '../common/scrollbar/SpringScrollbars';
import { inject, observer } from 'mobx-react';
import { toJS } from 'mobx';

import $ from 'jquery';

const SearchTabValue = {'1': 'all', '2': 'users', '3': 'groups'};

const TabPane = Tabs.TabPane;
const Item = List.Item;

const FirstNum = 3;	// 第一次加载的数量
const ListNum = 30;	//	加载更多的时候加载数量
const ListHeight = 67; // 每一个List的高度

@inject(stores => ({
  contactStore: stores.contactStore,
  utilStore: stores.utilStore,
  dbStore: stores.dbStore,
  appStore: stores.appStore,
  chatStore: stores.chatStore
}))
@observer
export default class SearchContent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showMoreNet: {users: true, groups: true},
      netUser: [],
      netGroup: [],
    };
    this.keyword = '';	// 搜索关键字
    this.updateFlag = true; // 是否更新视图
    this.netFlag = true;
    this.SearchTab = '1'; // 默认的tabs选项
    this.listKey = '0'; // 上下按键
    this.enterKey = '0'; // 回车键
    this.updateBaseUserInfo = 0; // 个人设置更新

    this.netUser = []; // 网络搜索联系人
    this.netGroup = []; // 网络搜索群组

    this.enterFlag = ''; // enter按键
  }

  componentWillReceiveProps(props) {
    const { SearchTab, keyword, searchChange, keyChange } = props;

    if (searchChange && keyword !== '') {
      this.netFlag = true;
    }

    if (keyChange && keyword !== '') {
      this.netFlag = true;
    }

  }

  shouldComponentUpdate(props) {
    const { searchChange, keyChange, updateBaseUserInfo } = props;

    // tab键切换，更新视图
    if (searchChange) {
      return true;
    }

    // 敲下回车键
    // if (this.enterKey !== enterKey) {
    //   this.enterKey = enterKey;
    //   this.enterFlag = true;
    //   return true;
    // }
    
    // listKey 变化，更新视图
    // if (this.listKey !== listKey) {
    //   this.listKey = listKey;
    //   this.outFlag = false;
    //   return true;
    // }

    // 搜索字变化，更新视图
    if (keyChange) {
      return true;
    }

    // filterUser变化，更新视图
    if (this.updateFlag) {
      return true;
    }

    // 鼠标移动
    // if (this.moveFlag) {
    //   this.moveFlag = false;
    //   return true;
    // }

    // 个人设置变更
    if (this.updateBaseUserInfo !== updateBaseUserInfo) {
      return true;
    }

    return false;
  }

	componentWillUpdate(nextprops) {
		const { 
      keyword,
      SearchTab,
      updateBaseUserInfo,
      networkUserList,
      networkGroupList,
      changeSearchChange,
      changekeyChange,
      listKey,
      enterKey,
    } = nextprops;

    const {
      fetchUserSearchPending,
    } = this.props.contactStore;

    if (!keyword && this.keyword !== keyword) {
      this.keyword = keyword;
      this.setState({
        netUser: [],
        netGroup: [],
      });
      this.updateFlag = true;
      return;
    }

    this.keyword = keyword;
    this.SearchTab = SearchTab;
    this.updateBaseUserInfo = updateBaseUserInfo;

		// 搜索字清空，filterUser, groups置空

    if (this.netFlag && !fetchUserSearchPending[SearchTabValue[SearchTab]]) {
      this.updateFlag = true;

      this.netFlag = false;

      if (networkUserList.length > 0) {
        changeSearchChange(false);
        changekeyChange(false);

        this.netUser = _.cloneDeep(toJS(networkUserList));

        this.netUser.length <= FirstNum
        ? (this.setState({
          showMoreNet: Object.assign(this.state.showMoreNet, {users: false}),
        }))
        : (this.setState({
          showMoreNet: Object.assign(this.state.showMoreNet, {users: true}),
        }));

        const arr = this.netUser.splice(0, FirstNum);

        this.setState({
          netUser: arr,
        });
      } else {
        this.setState({
          netUser: [],
        });
      }

      if (networkGroupList.length > 0) {
        changeSearchChange(false);
        changekeyChange(false);

        this.netGroup = _.cloneDeep(toJS(networkGroupList));

        this.netGroup.length <= FirstNum
        ? (this.setState({
          showMoreNet: Object.assign(this.state.showMoreNet, {groups: false}),
        }))
        : (this.setState({
          showMoreNet: Object.assign(this.state.showMoreNet, {groups: true}),
        }));

        const arr = this.netGroup.splice(0, FirstNum);

        this.setState({
          netGroup: arr,
        });
      } else {
        this.setState({
          netGroup: [],
        });
      }

    }

    // 上下方向键
    const onKeyCodeArr = listKey.split(',');
    const onKeyCode = onKeyCodeArr[ onKeyCodeArr.length - 1 ];
    const scrollbar = this.refs[`searchScrollbars-${SearchTab}`];

    if (onKeyCode === 'up' && this.listKey != onKeyCodeArr[ 0 ]) {
      const { listIndex, setListIndex } = this.props.appStore;
      this.listKey = onKeyCodeArr[ 0 ];

      const i = listIndex > 0 ? listIndex - 1 : 0;

      setListIndex(i);
      scrollbar.scrollTo( i * ListHeight );
    }

    if (onKeyCode === 'down' && this.listKey != onKeyCodeArr[ 0 ]) {
      const { netUser, netGroup } = this.state;
      const { listIndex, setListIndex } = this.props.appStore;
      this.listKey = onKeyCodeArr[ 0 ];

      let total = 0;

      if (SearchTab == 1) { // 全部
        if (this.state.showMoreNet['users'] && this.state.showMoreNet['groups']) {
          total = netUser.length + netGroup.length + 1;
        }
        if (!this.state.showMoreNet['users'] || !this.state.showMoreNet['groups']) {
          total = netUser.length + netGroup.length;
        }
        if (!this.state.showMoreNet['users'] && !this.state.showMoreNet['groups']) {
          total = netUser.length + netGroup.length - 1;
        }
      } else if (SearchTab == 2) { // 联系人
        total = netUser.length;
      } else if (SearchTab == 3) { // 群组
        total = netGroup.length;
      }

      const i = listIndex < total ? listIndex + 1 : listIndex;

      setListIndex(i);
      scrollbar.scrollTo( i * ListHeight );
    }

    const onEnterKeyArr = enterKey.split(',');
    const onEnterKey = onEnterKeyArr[ onEnterKeyArr.length - 1 ];

    if (onEnterKey === 'true' && this.enterFlag !== onEnterKeyArr[ 0 ]) {
      this.enterFlag = onEnterKeyArr[ 0 ];
      $('.ant-tabs-tabpane-active').find('.all-search-li.active').click();
    }
  }

  componentDidUpdate() {}

  // 加载更多
  handleLoadMore = (nflag) => {
    if (nflag === 'users') {
      if (this.netUser.length <= ListNum) {
        this.setState({
          showMoreNet: Object.assign(this.state.showMoreNet, {users: false}),
        });
      }

      this.setState({
        netUser: [ ...this.state.netUser, ...this.netUser.splice(0, ListNum) ],
      });
    }

    if (nflag === 'groups') {
      if (this.netGroup.length <= ListNum) {
        this.setState({
          showMoreNet: Object.assign(this.state.showMoreNet, {groups: false}),
        });
      }

      this.setState({
        netGroup: [ ...this.state.netGroup, ...this.netGroup.splice(0, ListNum) ],
      });
    }

    this.updateFlag = true;
  };

  // 点击跳转聊天
  handleChatClick = (userOrGroup, noSave = false) => {
    const { handleHidePop } = this.props;
    const { forwardToChat } = this.props.utilStore;
    handleHidePop && handleHidePop(false);
    forwardToChat(userOrGroup);

    if (noSave) {
      return;
    }

    if (userOrGroup.id) {
      userOrGroup.type = 'user';
      setSearch(userOrGroup, 'users')
    } else {
      userOrGroup.type = 'group';
      setSearch(userOrGroup, 'groups')
    }
  };

  // 清除历史查询记录
  clearSearchHistory = flag => {
    const { changeUpdateBaseUserInfo } = this.props.dbStore;
    clearSearch(flag);
    changeUpdateBaseUserInfo();
  };

  handleLiMouseEnter = i => {
    this.props.appStore.setListIndex(i);
  };

  // tab点击事件
  handleTabClick = value => {
    const { 
      changeSearchTab, 
      changeSearchTabFlag
    } = this.props;
    changeSearchTab && changeSearchTab(value);
    changeSearchTabFlag && changeSearchTabFlag(value);

    this.props.appStore.setListIndex(0);

    $('.input-all-search').find('input').focus(); // 全局搜索框获取焦点，阻止tabs的默认上下左右事件
  };

  // 历史搜索按钮
  handleHistory = (e) => {
    e.preventDefault();
    const { handleHidePop, chatStore } = this.props;
    chatStore.handleOpenChatRecord(true);
    handleHidePop && handleHidePop(false);
  };

  renderUser = (item, keyword, reg, i) => {
    const userName = item.name.replace(reg, `<span>${keyword}</span>`);
    const { listIndex } = this.props.appStore;

    return (
      <div
        className={`user-list all-search-li ${listIndex === i ? 'active' : ''}`}
        onClick={() => this.handleChatClick(item)}
        key={i}
        onMouseEnter={() => this.handleLiMouseEnter(i)}
      >
        <OliAvatar
          size={40}
          avatarMap={item.avatar}
          id={item.id}
          popover={false}
        />
        <div className='user-content'>
          <h3 className='single' dangerouslySetInnerHTML={{__html: userName}} />
          {/*<h4>{item.deptlist && item.deptlist.length > 0 ? item.deptlist[0].path : '部门'}</h4>
          <h5>{item.position}</h5>*/}
        </div>
      </div>
    )
  };

  renderGroup = (item, keyword, reg, i) => {
    const groupName = item.groupName ? item.groupName.replace(reg, `<span>${keyword}</span>`) : '';
    const { listIndex } = this.props.appStore;
    const avatarMap = { media_id: item.groupIconUrl };

    return (
      <div
        className={`group-list all-search-li ${listIndex === i ? 'active' : ''}`}
        onClick={() => this.handleChatClick(item)}
        key={i}
        onMouseEnter={() => this.handleLiMouseEnter(i)}
      >
        <OliAvatar
          size={40}
          avatarMap={avatarMap}
          id={item.groupId}
          popover={false}
          type="group"
        />
        <div className='group-content'>
          <h3 dangerouslySetInnerHTML={{ __html: groupName }}/>
          <h4>包含：{item.groupMemberSize}人</h4>
        </div>
      </div>
    )
  };

  // 网络搜索列表
  renderNetWork = (list, keyword, nflag) => {
    const { showMoreNet } = this.state;
    const { listIndex } = this.props.appStore;

    if (nflag === 'all') {
      let userList = [];

      let groupList = [];

      list.map(item => {
        if (item.id) {
          userList = [...userList, item];
        } else if (item.groupId) {
          groupList = [...groupList, item];
        }
      });

      const loadMoreUser = showMoreNet['users'] ? (<div 
          className={`load-more all-search-li ${listIndex === userList.length ? 'active' : ''}`} 
          onClick={() => this.handleLoadMore('users')}
          onMouseEnter={() => this.handleLiMouseEnter(userList.length)}
        >
        <h2><Icon type='search'/>查看更多搜索结果</h2>
      </div>) : <div className='load-over'>已经加载完毕了哦~</div>;

      const loadMoreGroup = showMoreNet['groups'] ? (<div
          className={`load-more all-search-li ${listIndex === (showMoreNet['users'] ? (userList.length + groupList.length + 1) : (userList.length + groupList.length)) ? 'active' : ''}`} 
          onClick={() => this.handleLoadMore('groups')}
          onMouseEnter={() => this.handleLiMouseEnter(userList.length + groupList.length)}
        >
        <h2><Icon type='search'/>查看更多搜索结果</h2>
      </div>) : <div className='load-over'>已经加载完毕了哦~</div>;

      return (
        <div>
          {userList.length > 0 ? <div className='network-search'>
            <div className='network-head'>联系人</div>
            {
              userList.map((item, i) => {
                const reg = new RegExp(`${keyword}`, 'g');

                return this.renderUser(item, keyword, reg, i);
              })
            }
            {loadMoreUser}
          </div> : null}
          {groupList.length > 0 ? <div className='network-search'>
            <div className='network-head'>群组</div>
            {
              groupList.map((item, i) => {
                const reg = new RegExp(`${keyword}`, 'g');
                const index = showMoreNet['users'] ? (i + userList.length + 1) : (i + userList.length) ;

                return this.renderGroup(item, keyword, reg, index);
              })
            }
            {loadMoreGroup}
          </div> : null}
        </div>
      )
    } else {
      const headName = nflag === 'users' ? '联系人' : '群组';

      const loadMore = showMoreNet[nflag] ? (<div 
          className={`load-more all-search-li ${listIndex === list.length ? 'active' : ''}`}
          onClick={() => this.handleLoadMore(nflag)}
          onMouseEnter={() => this.handleLiMouseEnter(list.length)}
        >
        <h2><Icon type='search'/>查看更多搜索结果</h2>
      </div>) : <div className='load-over'>已经加载完毕了哦~</div>;

      return (
        <div className='network-search'>
          <div className='network-head'>{headName}</div>
          {
            list.map((item, i) => {
              const reg = new RegExp(`${keyword}`, 'g');

              if (item.id) {
                return this.renderUser(item, keyword, reg, i);
              } else if (item.groupId) {
                return this.renderGroup(item, keyword, reg, i);
              }
            })
          }
          {loadMore}
        </div>
      )
    }
  };

  // 最近搜索
  renderLately = flag => {
    const searchList = getSearch(flag) || [];
    const reverseSearchList = _.cloneDeep(searchList);
    const finalSearchList = reverseSearchList.reverse().slice(0, 5);

    if (!searchList.length) {
      return null;
    }

    return (
      <div className='lately-search'>
        <div className='lately-header'>
          <div className='title'>最近搜索</div>
          <div className='clear' onClick={() => this.clearSearchHistory(flag)}>清空历史</div>
        </div>
        <div className='lately-content'>
          <div className='lately-list-content'>
            {finalSearchList.map((item, i) => {
              if (item.id) {
                return (
                  <div 
                    className='lately-list'
                    onClick={() => this.handleChatClick(item, true)}
                    key={`history-${i}`}
                  >
                    <OliAvatar
                      size={34}
                      avatarMap={item.avatar}
                      id={item.id}
                      popover={false}
                    />
                    <div className='lately-name'>{item.name}</div>
                  </div>
                )
              } else {
                return (
                  <div 
                    className='lately-list'
                    onClick={() => this.handleChatClick(item, true)}
                    key={`history-${i}`}
                  >
                    <OliAvatar
                      size={34}
                      avatarMap={item.avatar}
                      id={item.groupId}
                      type="group"
                      popover={false}
                    />
                    <div className='lately-name'>{item.groupName}</div>
                  </div>
                )
              }
            })}            
          </div>
        </div>
      </div>
    )
  };

  // 历史搜索
  renderHistory = () => {
    return (
      <div className='search-content-history' onClick={this.handleHistory}>
        <div className='search-history-head'>聊天记录</div>
        <div className='search-history-main'>
          <Icon type="search" />
          搜聊天记录
        </div>
      </div>
    );
  }

  // 本地搜索没有结果(现在皆为网络搜索，没有本地搜索)
  renderNoData = flag => {
  	const { keyword, networkBtn } = this.props;
    const { netUser, netGroup } = this.state;
    const { fetchUserSearchPending } = this.props.contactStore;

    // 加载loading
    if (fetchUserSearchPending[flag]) {
      return (
        <div className='network-spin'>
          <Spin />
        </div>
      )
    }

    // 关键字不为空
    if (keyword !== '') {
      // 网络搜索结果不为空
      if (flag === 'users' && netUser.length > 0) {
        return this.renderNetWork(netUser, keyword, flag);
      } else if (flag === 'groups' && netGroup.length > 0) {
        return this.renderNetWork(netGroup, keyword, flag);
      } else if (flag === 'all' && (netUser.length > 0 || netGroup.length > 0)) {
        return this.renderNetWork([...netUser, ...netGroup], keyword, flag);
      } else {
        if (networkBtn[flag]) {
          return (
            <Alert className='network-no-data' message="啊哦，没有找到结果哦~请重新输入关键字吧" type="warning" showIcon />
          )
        }
      }
    }

    return (
      <div className='no-data'>
        {this.renderLately(flag)}
        {this.renderHistory()}
        <ChatRecord/>
        <div className='no-data-img'/>
        <div className='no-data-tips'>按键盘“tab”快速切换分类</div>
      </div>
    );
  };

  // 滚动组件
  renderScrollBars = (children, i) => {
    return (
      <SpringScrollbars
        autoHide
        autoHeightMin={'100%'}
        autoHeightMax={'100%'}
        style={{
          height: '100%',
          position: 'relative'
        }}
        ref={`searchScrollbars-${i}`}
      >
        {children}
      </SpringScrollbars>
    )
  };

  render() {
    const { SearchTab } = this.props;

    return (
      <Tabs
        defaultActiveKey='1'
        activeKey={SearchTab}
        animated={false}
        onTabClick={this.handleTabClick}
      >
        <TabPane tab='全部' key='1' className='search-list all-list' forceRender={false}>
          {this.renderScrollBars(this.renderNoData('all'), 1)}
        </TabPane>
        <TabPane tab='联系人' key='2' className='search-list contact-list' forceRender={false}>
          {this.renderScrollBars(this.renderNoData('users'), 2)}
        </TabPane>
        <TabPane tab='群组' key='3' className='search-list search-group-list' forceRender={false}>
          {this.renderScrollBars(this.renderNoData('groups'), 3)}
        </TabPane>
      </Tabs>
    )
  }
}