import React, { Component } from "react";
import { inject, observer } from "mobx-react";
import { toJS } from "mobx";
import { withRouter } from "react-router-dom";
import TitleBar from "../common/TitleBar";
import OliAvatar from "../common/Avatar";
import Setting from "./Setting";
import CustomUrl from "./CustomUrl";
import Chat from "../chat/Chat";
import Contact from "../contact/Contact";
import AppComponent from "../app/App";
import LookPicture from "../chat/LookPicture";
import { Layout, Tabs, message as antdMessage, Spin } from "antd";
import { getCurrentUser, getCurrentBaseUrl } from "../../lowdb/index";
import SiderTooltip from "./SiderTooltip";
import { appIdenTypesByNum, appIdenTypesByStr } from "../../common/types";

const TabPane = Tabs.TabPane;

@withRouter
@inject(stores => ({
  homeStore: stores.homeStore,
  loginStore: stores.loginStore,
  contactStore: stores.contactStore,
  chatStore: stores.chatStore,
  dbStore: stores.dbStore,
}))
@observer
export default class App extends Component {

  constructor(props) {
    super(props);

    this.state = {
      dblClick: false,
    };

    this.clickCount = 0; // tabpane 点击次数
    
    this.props.chatStore.loadOldChatList();
    this.props.dbStore.loadOldGroups();

    this.unreadInterval = null;
    this.isShine = false; // 浏览器窗体是否获得焦点
  }

  componentDidMount() {
    console.log('[app] - component did mount....');

    // 通知
    if(!window.isElectron() && !window.Notification) {
      // 通知事件（只有在https才有用）
      Notification.requestPermission(); // 获取权限

      let emobileUnread = 0; // 未读消息数量
      let oldTitle = document.title; // 之前设置的title
      let changeTitleInterval = null; // 来回设置title的定时器

      this.unreadInterval = setInterval(() => {
        const flag = emobileUnread !== window.totalUnreadCount;

        if (flag) {
          emobileUnread = window.totalUnreadCount;
          if (emobileUnread) {
            const eMobileUnreadObject = window.eMobileUnreadObject;

            // console.log(eMobileUnreadObject);

            if (this.isShine) {
              const noti = new Notification(eMobileUnreadObject.name, {
                body: eMobileUnreadObject.last,
                icon: 'http://img.zcool.cn/community/010f87596f13e6a8012193a363df45.jpg@1280w_1l_2o_100sh.jpg',
                tag: eMobileUnreadObject.fromUserId ? eMobileUnreadObject.fromUserId : 'unknown',
                renotify: true,
              });
              // 点击通知之后的操作
              noti.onclick = e => {
                const { chatList, selectPersonToChat } = this.props.chatStore;
                const u = chatList.filter(user => user.fromUserId === e.target.tag)[ 0 ];
                // 激活窗口
                window.focus();
                // 选中聊天记录的这个人
                selectPersonToChat(u);
              }
            }
            changeTitle(emobileUnread);
          } else {
            clearInterval(changeTitleInterval);
            changeTitleInterval = null;
            document.title = oldTitle;
          }
        }
      }, 1000);

      // 顶部title修改
      const changeTitle = unread => {
        if (changeTitleInterval) {
          clearInterval(changeTitleInterval);
          changeTitleInterval = null;
        }
        changeTitleInterval = setInterval(() => {
          if (this.isShine) {
            if (/新/.test(document.title)) {
              document.title = '【            】';
            } else {
              document.title = '【你有(' + unread + ')条新消息】';    
            }
          } else {
            document.title = oldTitle;
          }
        }, 500);
      }

      window.onfocus = () => {
        this.isShine = false;
      };

      window.onblur = () => {
        this.isShine = true;
      };

      // for IE
      document.onfocusin = () => {
        this.isShine = false;
      };
      
      document.onfocusout = () => {
        this.isShine = true;
      };
    }

    // 添加token
    if(window.isElectron()) {
      const { ipcRenderer } = window.require('electron');

      ipcRenderer.send('addToken', {
        token: getCurrentUser().access_token,
        baseUrl: getCurrentBaseUrl(),
      });
    }

    const { history, location } = this.props;
    if (location.pathname === '/' && !getCurrentUser()) {
      history.push('/login');
      return;
    }

    const { 
      fetchCompanys,
      fetchMyGroupList,
    } = this.props.contactStore;

    const { 
      startKeepAlive,
      getMsgToken,
      fetchTheme,
      fetchCompany,
      getMessageSetting,
    } = this.props.homeStore;
    
    const { 
      websocketCallback,
    } = this.props.chatStore;

    getMsgToken(websocketCallback);  // 先链接 websocket

    getMessageSetting(); // 获取消息扩展功能列表

    fetchCompanys(true);  // 获取所有公司列表
    // fetchMyGroupList();   // 开局拿红~
    fetchTheme(); // 获取主题配置
    fetchCompany(); // 获取企业列表
    startKeepAlive();

    document.onkeydown = (e) => {
      // 将tab的事件取消
      if (e.keyCode === 9) {
        return false;
      }
    };
  }

  componentWillUnmount() {
    this.unreadInterval && clearInterval(this.unreadInterval);
  }

  handleTabClick = (ids) => {
    const { activeBar, appShowSetting } = this.props.homeStore;
    const idArr = ids.split('_');
    if (ids === activeBar) { // 点击和激活面板相同
      this.clickCount++;
      if (this.clickCount >= 2) {
        this.handleTabdblClick(idArr[ 0 ]);
      }

      setTimeout(() => this.clickCount = 0, 200);
      return;
    }

    if (idArr[ 0 ] == appIdenTypesByStr.app && appShowSetting === 2) { // appShowSetting 为1的时候 不打开新窗口，2的时候打开新窗口
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.send('open-workBench');
      return;
    }

    if (!appIdenTypesByNum[ idArr[ 0 ] ]) {
      antdMessage.warning('该模块正在努力开发中~');
      return;
    }

    if (idArr[ 0 ] == appIdenTypesByStr.custom) {
      if (this.renderCustom(idArr, 1) === false) {
        return;
      }
    }

    this.props.homeStore.changeActiveBar(ids);
  };

  // 双击按钮
  handleTabdblClick = (id) => {
    if (id === appIdenTypesByStr.chat) {  // 消息
      const { chatList, selectPersonToChat, chatListScrollbars } = this.props.chatStore;
      const chatListArr = toJS(chatList);
      for (let i in chatListArr) {
        const list = chatListArr[ i ];
        if (list.unreadCount) { // 如果有未读消息
          const height = document.querySelector('li.chat-item').offsetHeight || 0; // 每一列消息的高度
          chatListScrollbars.scrollTopWithAnimation(i * height - 1); // 将该列消息置顶
          selectPersonToChat(list);
          return;
        }
      }

      chatListScrollbars.scrollTopWithAnimation(0); // 滚动到顶部
      return;
    }

    if (id == appIdenTypesByStr.contact) {  // 通讯录
      const { fetchCompanys, setSelectedCompanyKeys } = this.props.contactStore;
      fetchCompanys(true);  // 重新获取通讯录
      setSelectedCompanyKeys([]);
    }

    this.setState({
      dblClick: true,
    }, () => {
      setTimeout(() => {
        this.setState({
          dblClick: false
        });
      }, 600);
    });
  };

  renderContent(id, ids) {
    switch (parseInt(id)) {
      case parseInt(appIdenTypesByStr.chat) :
        return <Chat />;
      case parseInt(appIdenTypesByStr.contact) :
        return <Contact />;
      case parseInt(appIdenTypesByStr.app) :
        return <AppComponent />;
      case parseInt(appIdenTypesByStr.custom) :
        return this.renderCustom(ids);
    }
  }

  renderCustom(ids, type) {
    const { navlist } = this.props.homeStore.mainTheme;
    const custom = navlist.filter(v => v.nav_func === parseInt(ids[ 0 ]) && v.nav_id === ids[ 1 ]);
    const url = custom[ 0 ].nav_func_set1;
    switch (custom[ 0 ].nav_func_set2) {
      case '1' :
        return <CustomUrl url={url}/>
      case '2' :
        if (type) {
          const { ipcRenderer } = window.require('electron');
          ipcRenderer.send('open-custom', {
            custom: custom[ 0 ],
          });
        }
        return false;
      case '3' :
        const { shell } = window.require('electron');
        shell.openExternal(url);
        return false
    }
  }

  colorDarken(color) {
    color = color || '#399c9c';

    const reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/;

    let sColor = color.toLowerCase();
    if (sColor && reg.test(sColor)) {
      if (sColor.length === 4) {
        let sColorNew = "#";
        for (let i = 1; i < 4; i += 1) {
          sColorNew += sColor.slice(i, i + 1).concat(sColor.slice(i, i + 1));
        }
        sColor = sColorNew;
      }

      let change = [];
      for (let i = 1; i < 7; i += 2) {
        change = [ ...change, parseInt(`0x${sColor.slice(i, i + 2)}`) ];
      }

      let result = change.map(v => {
        return (v - 15) < 0 ? 0 : (v - 15);
      });

      return `RGB(${result.join(",")})`;
    }

    return sColor;
  }

  render() {
    const { location } = this.props;
    console.log('app render', location);

    const {
      dblClick,
    } = this.state;

    const {
      logout,
      getBaseUserInfo,
      getBaseInfoPending,
    } = this.props.loginStore;

    const {
      activeBar,
      mainTheme,
      companyList,
      psVisible,
      setPsVisible,
    } = this.props.homeStore;

    const {
      lookpicture
    } = this.props.chatStore;

    const {
      fetchCompanysPending,
    } = this.props;

    const currentUser = getCurrentUser();

    const bgColor = mainTheme && mainTheme.nav_bgcolor ? mainTheme.nav_bgcolor : '#499BFA';
    const darkenColor = this.colorDarken(bgColor);

    const SiderOther = currentUser ? (
      <div className='order-tablist'>
        <OliAvatar
          id={currentUser.base_user_id}
          size={40}
          className='tab-avatar'
          overlayClassName={`${window.isElectron() ? 'tab-popover' : ''}`}
          avatarMap={currentUser.avatar}
        />
        <Setting
          baseUserId={currentUser.base_user_id}
          getBaseUserInfo={getBaseUserInfo}
          onLogout={logout}
          user={currentUser}
          getBaseInfoPending={getBaseInfoPending}
          companyList={companyList}
          psVisible={psVisible}
          setPsVisible={setPsVisible}
        />
      </div>
    ) : null;

    return (
      <div className={`home-div ${window.isElectron() ? '' : 'home-linear-gradient'}`}>
        <div className={`home-app ${window.isElectron() ? '' : 'home-web'}`}>
          <TitleBar type='mainPanel' />
          <Tabs
            tabPosition='left'
            animated={false}
            activeKey={`${activeBar}`}
            className='tabs-app'
            tabBarStyle={{
              background: `linear-gradient(180deg, ${bgColor}, ${darkenColor})`
            }}
            tabBarExtraContent={SiderOther}
            onTabClick={this.handleTabClick}
          >
            {
              mainTheme
              && mainTheme.navlist
              && mainTheme.navlist.length > 0
              && mainTheme.navlist.sort((v1, v2) => v1.showorder - v2.showorder).map((v, i) => {
                const id = `${v.nav_func}_${v.nav_id}`;
                if (v.nav_func != appIdenTypesByStr.chat && v.nav_func != appIdenTypesByStr.contact && !window.isElectron()) {
                  return null;
                  }
                return (
                  <TabPane
                    key={id}
                    tab={
                      <SiderTooltip
                        mainTheme={mainTheme}
                        navlist={v}
                        className={`${activeBar === id ? 'active' : ''} ${appIdenTypesByNum[ v.nav_func ] ? `${appIdenTypesByNum[ v.nav_func ]}` : ''}`}
                        key={i}
                        active={activeBar === id}
                      />
                    }
                  >
                    {
                      dblClick || fetchCompanysPending
                        ? <Layout className='layout-content-spin'><Spin size='large'/></Layout>
                        : (
                        <Layout>
                          {
                            v.nav_func != appIdenTypesByStr.custom
                              ? this.renderContent(v.nav_func)
                              : this.renderContent(v.nav_func, id.split('_'))
                          }
                        </Layout>
                      )
                    }
                  </TabPane>
                )
              })
            }
          </Tabs>
        </div>
        {!window.isElectron() && lookpicture ? <LookPicture /> : null}
      </div>
    );
  }
}
