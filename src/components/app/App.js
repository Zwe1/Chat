import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { toJS } from 'mobx';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import _ from 'lodash';
import Scrollbars from '../common/scrollbar/SpringScrollbars';
import { getCurrentUser, getCurrentBaseUrl } from '../../lowdb';
import { buildMediaUrl } from '../../services/media';
import TitleBar from '../common/TitleBar';
import {
  Layout,
  Alert,
  Button,
  Spin,
  Avatar,
  Tabs,
  Select,
  Tooltip,
  Dropdown,
  Menu,
  Icon,
  message as antMessage,
  Badge
} from 'antd';

import $ from 'jquery';
//import { getCompanys } from '../../lowdb/lowdbCompany';

const { Sider, Content } = Layout;
const TabPane = Tabs.TabPane;
const ButtonGroup = Button.Group;
const Option = Select.Option;
const SubMenu = Menu.SubMenu;

@withRouter
@inject(stores => ({
  appStore: stores.appStore,
  homeStore: stores.homeStore,
  contactStore: stores.contactStore,
}))
@observer
export class DefaultPage extends Component {
  constructor(props) {
    super(props);

    this.$contentWebview = null;
    this.company = '';

    this.state = {
      // title, id, homeUrlPc, agentName, logo,
      openedTabs: [],
      contentHeight: 0,
      selectKey: null,
      ulKey: true,
      hoverUnRead: '',
      customTitle: '',
    };

    this.data = {};
    this.updateFlag = true;
  };

  componentDidMount() {
    const {
      setCurrentSelectedCompany,
      fetchAgentList,
      agentData,
      corpid,
    } = this.props.appStore;

    const { allCompanys } = this.props.contactStore;
    const companys = allCompanys;

    if (companys && companys.length > 0) {
      const current = companys[ 0 ];
      setCurrentSelectedCompany(current);
      this.company = current.tenant_name;
      fetchAgentList(current.corpid);
    }

    if (window.isElectron()) {
      const electron = window.require('electron');
      const { remote } = electron;

      let currentWindow = remote.getCurrentWindow();

      currentWindow.on('resize', _.throttle(() => {
        setTimeout(() => {

          if (this.$contentWebview) {
            const a = ReactDOM.findDOMNode(this.$contentWebview);
            this.setState({
              contentHeight: a.offsetHeight
            });

            this.state.openedTabs.forEach(item => {
              let webviewInterval = {};
              webviewInterval[ item.index ] = setInterval(() => {
                const webview = document.querySelector(`#app-${item.index}`);

                const resizeHeight = document.querySelector(`div.content-webview-wrapper`).offsetHeight;

                webview.style.height = `${resizeHeight - 43}px`;

                if (webview) {
                  clearInterval(webviewInterval[ item.index ]);
                }
              }, 500);
            })
          }
        }, 0);
      }, 50));

      setTimeout(() => {
        if (this.$contentWebview) {
          const a = ReactDOM.findDOMNode(this.$contentWebview);
          this.setState({
            contentHeight: a.offsetHeight
          })
        }
      }, 0);
    }
  }

  componentDidUpdate() {
    const {
      agentData,
      corpid,
    } = this.props.appStore; 

    if (agentData[ corpid ] && agentData[ corpid ].set_type == 3 && this.updateFlag) {
      this.updateFlag = false;
      const webview = document.querySelector(`#custom-webview`);

      webview.addEventListener('did-start-loading', () => {
        console.log('custom page load start.');
      });

      webview.addEventListener('dom-ready', (event) => {
        this.setState({
          customTitle: webview.getTitle(),
        });
      })

      webview.addEventListener('new-window', (event) => {
        webview.loadURL(event.url);
      });

      webview.addEventListener('did-get-redirect-request', (e) => {
        console.log('custom-did-get-redirect-request', e);
      });

      webview.addEventListener('will-navigate', (e) => {
        console.log('custom-will-navigate', e);
      });
    }
  }

  arrangeElementList(list) {
    const obj = {};

    for (let item of list) {
      const eList = item.elementlist;
      if (eList && eList.length > 0) {
        for (let eItem of eList) {
          obj[ eItem.index ] = eItem;
        }
      }
    }

    return obj;
  }

  handleTabEdit = (e) => {
    console.log('edit:', e);

    let currentIndex = 0;
    let oldTabs = this.state.openedTabs.map(item => _.clone(item));
    let newTabs = oldTabs.filter((tab, index) => {
      if (tab.index === e) {
        currentIndex = index;
      }

      return tab.index !== e;
    });

    if (currentIndex === 0) {

    } else if (currentIndex > 0) {
      currentIndex--;// 设置为之前的一个
    }

    if (newTabs.length === 0) {
      // 没有 tab 咋么办
      currentIndex = -1;
    }

    let newTab = newTabs[ currentIndex ];
    this.setState({
      openedTabs: newTabs,
      selectKey: newTab ? newTab.index : -1
    });

  };

  handleClickApp = e => {
    const { agentData, corpid } = this.props.appStore;

    this.listObj = this.arrangeElementList(agentData[ corpid ].portal.categorylist);
    const item = this.listObj[ e.key ];

    let oldTabs = this.state.openedTabs.map(item => _.clone(item));
    let isExist = oldTabs.filter(tab => tab.index == item.index)[ 0 ];
    const baseUrl = getCurrentBaseUrl();

    if (isExist) {
      // 如果存在 则 切换，
      this.setState({
        selectKey: isExist.index
      });
      return;
    }

    let height = this.state.contentHeight - 45;
    item.finishName = (<Tooltip overlayClassName='sider-tooltip' mouseEnterDelay={0.5} placement='top'
                                title={<span>{item.element_name}-{this.company}</span>}>
      <span className='pane-title'>{item.element_name}-{this.company}</span>
    </Tooltip>);
    if (item.element_type === 1) {
      item.content =
        <webview 
          className='app-tabs-webview'
          id={`app-${item.index}`} 
          src={item.agent.home_url_pc ? item.agent.home_url_pc : item.agent.home_url}
          style={{ height }}
        ></webview>;
    } else if (item.element_type === 3) {
      item.content = <webview className='app-tabs-webview' id={`app-${item.index}`} src={item.element_set1} style={{ height }}></webview>;
    }

    oldTabs.push(item);

    this.setState({
      openedTabs: oldTabs,
      selectKey: item.index
    }, () => {
      let webview = document.querySelector(`#app-${item.index}`);

      webview.addEventListener('did-start-loading', () => {
        console.log('page load start.');
      });

      webview.addEventListener('did-finish-load', () => {
        if (item.agent && item.agent.count_url) {
          this.props.appStore.getUnread(item.agent.count_url, e.key);
        }
        console.log('page load finish.');
      });

      webview.addEventListener('new-window', (event) => {
        webview.loadURL(event.url);
      });

      webview.addEventListener('did-get-redirect-request', (e) => {
        console.log('did-get-redirect-request', e);
      });

      // /emp/api/connect/oauth2/authorize
      // #emobilet_redirect
      webview.addEventListener('will-navigate', (e) => {
        console.log('will-navigate', e);
      });
    });
  };

  handleTabClick = (e) => {
    console.log('tab click:', e);
    this.setState({
      selectKey: e,
    }, () => {
      $(`#app-${e}`).css('display', 'block');
      setTimeout(() => {
        $(`#app-${e}`).css('display', 'flex');
      }, 20);
    });
  };

  handleCompanySelect = (e) => {
    console.log('on select:', e);

    const { allCompanys } = this.props.contactStore;
    const companys = allCompanys;
    let current = companys.filter(com => com.id === e)[ 0 ];
    console.log('current company:', current);

    const { setCurrentSelectedCompany, fetchAgentList } = this.props.appStore;
    setCurrentSelectedCompany(current);
    this.company = current.tenant_name;
    fetchAgentList(current.corpid);
  };

  renderDropdown(type = '') {
    const { allCompanys } = this.props.contactStore;
    const companys = allCompanys;
    const { currentSelectedCompany } = this.props.appStore;

    if (!companys || companys.length < 1 || !currentSelectedCompany) {
      return (
        <Select
          className='btn-choose-company top'
          size='large'
          notFoundContent='没有公司~'
          disabled={true}
        />
      )
    }

    if (companys.length === 1) {
      return (
        <div className={`btn-choose-company top ${type}`}>
          <Tooltip 
            placement='topRight'
            mouseEnterDelay={0.5}
            overlayClassName='app-tooltip'
            title={<span>{companys[ 0 ].tenant_name}</span>}
          >
            <div className='dd-option-company'>
              <span className='name'>{companys[ 0 ].tenant_name}</span>
            </div>
          </Tooltip>
        </div>
      )
    }

    return (
      <Select
        className={`btn-choose-company top ${type}`}
        size='large'
        disabled={false}
        onChange={this.handleCompanySelect}
        value={currentSelectedCompany.id}
      >
        {companys.map(item => {
          return (
            <Option key={item.id} value={item.id} title={item.tenant_name}>
              <Tooltip 
                placement='topRight'
                mouseEnterDelay={0.5}
                overlayClassName='app-tooltip'
                title={<span>{item.tenant_name}</span>}
              >
                <div className='dd-option-company'>
                  <span className='name'>{item.tenant_name}</span>
                </div>
              </Tooltip>
            </Option>
          );
        })}
      </Select>
    );
  }

  // flag用来判断是否在自定义链接里面
  handleGoBackClick = (flag = '') => {
    const { selectKey } = this.state;
    const webview = flag === 'custom' ? document.querySelector('#custom-webview') : document.querySelector(`#app-${selectKey}`);

    webview.goBack();
  };

  handleGoForwardClick = (flag = '') => {
    const { selectKey } = this.state;
    const webview = flag=== 'custom' ? document.querySelector('#custom-webview') : document.querySelector(`#app-${selectKey}`);
    webview.goForward();
  };

  handleReloadClick = (flag = '') => {
    const { selectKey } = this.state;
    const webview = flag=== 'custom' ? document.querySelector('#custom-webview') : document.querySelector(`#app-${selectKey}`);

    // webview.reloadIgnoringCache();
    webview.reload();
  };

  handleMenuSelect = (flag = '', e) => {
    const { selectKey } = this.state;
    const electron = window.require('electron');
    const { clipboard, shell } = electron;

    // 判断是否是自定义链接
    const url = flag=== 'custom' ? document.querySelector('#custom-webview').src : document.querySelector(`#app-${selectKey}`).src;
    
    switch (e.key) {
      case 'copy':
        clipboard.writeText(url);
        antMessage.success('已复制到粘贴板');
        break;

      case 'open':
        shell.openExternal(url);
        break;
    }
  };

  renderExtraContent() {
    return (
      <ButtonGroup className='app-tabs-btnG'>
        <Button icon='left' onClick={this.handleGoBackClick}/>
        <Button icon='right' onClick={this.handleGoForwardClick}/>
        <Button icon='reload' onClick={this.handleReloadClick}/>
        <Dropdown 
          overlay={
            <Menu
              onClick={this.handleMenuSelect.bind(this, '')}
            >
              <Menu.Item key='copy'>复制链接地址</Menu.Item>
              <Menu.Item key='open'>在默认浏览器打开</Menu.Item>
            </Menu>
          }
          trigger={[ 'click' ]}
        >
          <Icon type='ellipsis'/>
        </Dropdown>
      </ButtonGroup>
    );
  }

  renderTabs() {
    const tabs = this.state.openedTabs;
    console.log('tabs:', tabs);

    if (tabs.length === 0) {
      return <div className='tips'><span>请点击左边的应用~</span></div>
    }

    return (
      <Tabs
        hideAdd
        tabBarExtraContent={this.renderExtraContent()}
        type='editable-card'
        onEdit={this.handleTabEdit}
        activeKey={this.state.selectKey}
        onTabClick={this.handleTabClick}
        className='app-tabs'
      >
        {tabs.map(pane => {
          return <TabPane tab={pane.finishName} key={pane.index}>{pane.content}</TabPane>
        })}
      </Tabs>
    );
  }

  renderNoAppList() {
    return (
      <div style={{ padding: 10 }}>
        <Alert message='暂无应用' type='info' showIcon/>
      </div>
    );
  }

  renderAppListItem(item, index) {
    const {
      getUnread,
      unRead,
    } = this.props.appStore;

    item.index = index;

    if (item.agent && item.agent.count_url && (!unRead[ index ] || Object.keys(unRead[ index ]).length === 0)) {
      getUnread(item.agent.count_url, index);
    }

    const unReadIndex = toJS(unRead[ index ]);

    this.data[ index ] = unReadIndex && Object.keys(unReadIndex.data).length > 0 ? unReadIndex : this.data[ index ];

    return (
      <Menu.Item
        key={index}
        className='app-list-li'
        onMouseEnter={() => this.handleAppListEnter(index)}
        onMouseLeave={() => this.handleAppListLeave(index)}
      >
        <Avatar
          shape='circle'
          src={buildMediaUrl(item.icon_default)}
        />
        <Tooltip placement='topRight' mouseEnterDelay={0.5} overlayClassName='app-tooltip'
                 title={<span>{item.element_name}</span>}>
          <span className='app-name'>{item.element_name}</span>
        </Tooltip>
        {this.renderUnRead(unReadIndex, index)}
      </Menu.Item>
    )
  }

  handleAppListEnter = (index) => {
    this.setState({
      hoverUnRead: index,
    });
  };

  handleAppListLeave = (index) => {
    this.setState({
      hoverUnRead: '',
    });
  };

  renderUnRead(unread, index) {
    if (!unread || !this.data[ index ]) {
      return null;
    }

    const { hoverUnRead } = this.state;

    const data = this.data[ index ].data;

    // hover选中
    if (hoverUnRead == index) {
      return (
        <div className='un-read'>
          {'unread' in data && <span
            className={`un-read-span ${'count' in data && data.count != 0 ? '' : 'single'}`}>{data.unread < 100 ? data.unread : '99+'}</span>}
          {('count' in data && data.count != 0) && <b className='sp-line'>/</b>}
          {('count' in data && data.count != 0) &&
          <span className='count-span'>{data.count < 100 ? data.count : '99+'}</span>}
        </div>
      )
    }

    return (
      <div className='un-read'>
        <Badge count={data.unread} overflowCount={99}/>
      </div>
    )

  }

  renderAppList(list, corpid) {
    return (
      list.map((ele, i) => {
        if (ele.isshowtitle) {
          const header = <div>
            {ele.icon_default && <Avatar
              shape='circle'
              src={buildMediaUrl(ele.icon_default)}
            />}
            <div className={`ul-name ${ele.icon_default ? 'ul-name-padding' : ''} `}>
              {ele.category_name}
            </div>
          </div>

          return (
            <SubMenu key={i} title={header}>
              {ele.elementlist && ele.elementlist.length > 0 && ele.elementlist.map((item, j) => this.renderAppListItem(item, `${corpid}_${i}_${j}`))}
            </SubMenu>
          )
        } else {
          return ele.elementlist && ele.elementlist.length > 0 && ele.elementlist.map((item, j) => this.renderAppListItem(item, `${corpid}_${i}_${j}`))
        }
      })
    )
  }

  renderApp() {
    const { agentData, corpid, fetchAgentListPending, fetchCompanysPending, appOpenKeys } = this.props.appStore;

    if (fetchAgentListPending || fetchCompanysPending) {
      return (
        <div className='app-list-spin'>
          <Spin />
        </div>
      )
    }

    if (!agentData[ corpid ]) {
      return this.renderNoAppList();
    }

    if (!agentData[ corpid ].portal || !agentData[ corpid ].portal.categorylist) {
      return this.renderNoAppList();
    }

    if (agentData[ corpid ].portal.categorylist.length === 0 || agentData[ corpid ].portal.categorylist[0].elementlist.length === 0) {
      return this.renderNoAppList();
    }

    let flag = true;

    agentData[ corpid ].portal.categorylist.map(item => {
      if (item.elementlist && item.elementlist.length > 0) {
        flag = false;
      }
    });

    if (flag) {
      return this.renderNoAppList();
    }

    return (
      <Scrollbars>
        <Menu
          className='app-list'
          mode='inline'
          onClick={this.handleClickApp}
          defaultOpenKeys={toJS(appOpenKeys)}
        >
          {this.renderAppList(agentData[ corpid ].portal.categorylist, corpid)}
        </Menu>
      </Scrollbars>
    );
  }

  render() {
    const { appShowSetting } = this.props.homeStore;
    const { agentData, corpid } = this.props.appStore;
    const { customTitle } = this.state;

    return (
      <Layout className='app-default-page'>
        {appShowSetting === 2 ? <TitleBar title='应用' close={true} btnType={'appModal'}/> : null}
        <Layout className={`custom-layout ${agentData[ corpid ] && agentData[ corpid ].set_type == 3 ? '' : 'no-show'}`}>
          {this.renderDropdown('custom')}
          <div className='custom-tool clearfix'>
            <div className='left'>
              {customTitle}
            </div>
            <div className='right'>
              <Button icon='left' onClick={() => this.handleGoBackClick('custom')}/>
              <Button icon='right' onClick={() => this.handleGoForwardClick('custom')}/>
              <Button icon='reload' onClick={() => this.handleReloadClick('custom')}/>
              <Dropdown
                overlay={
                  <Menu
                    onClick={this.handleMenuSelect.bind(this, 'custom')}
                  >
                    <Menu.Item key='copy'>复制链接地址</Menu.Item>
                    <Menu.Item key='open'>在默认浏览器打开</Menu.Item>
                  </Menu>
                }
                trigger={[ 'click' ]}
              >
                <Icon type='ellipsis'/>
              </Dropdown>
            </div>
          </div>
          <webview id='custom-webview' className='custom-webview' src={agentData[ corpid ] && agentData[ corpid ].set_value}/> 
        </Layout>
        <Layout className={`${agentData[ corpid ] && agentData[ corpid ].set_type == 3 ? 'no-show' : ''}`}>
          <Sider>
            {this.renderDropdown()}
            <div className='app-list-wrapper'>
              {this.renderApp()}
            </div>
          </Sider>
          <Layout ref={(item) => {
            this.$contentWebview = item;
          }}>
            <Content className='content-webview-wrapper'>
              {this.renderTabs()}
            </Content>
          </Layout>
        </Layout>
      </Layout>
    );
  }
}

export default DefaultPage;
