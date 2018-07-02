import React, { Component } from 'react';
import { toJS } from 'mobx';
import { withRouter } from 'react-router-dom';
import { inject, observer } from 'mobx-react';

import _ from 'lodash';
import moment from 'moment';

import { FaVenus, FaMars } from 'react-icons/lib/fa';
import classnames from 'classnames';

import { Button, Spin, Icon } from 'antd';

import Scrollbars from './scrollbar/SpringScrollbars';
import OliAvatar from '../common/Avatar';

import { getCurrentUser } from '../../lowdb';
import { generateLogoBg } from '../../common/generateLogoBg';

@withRouter
@inject(stores => ({
  homeStore: stores.homeStore,
  chatStore: stores.chatStore,
  contactStore: stores.contactStore,
  utilStore: stores.utilStore,
}))
@observer
export default class PersonInfo extends Component {

  constructor(props) {
    super(props);
  }

  handleNavi = (id, companyId) => {
    console.log('部门跳转');
    
    /* const { activeBar, changeActiveBar, mainTheme } = this.props.homeStore;
  	const { handleHidePop } = this.props;
    const bar = mainTheme.navlist.filter(v => v.nav_func === -2);
  	handleHidePop && handleHidePop();

    // 1. tab 切换
    if (activeBar !== `${bar.nav_func}_${bar.nav_id}`) {
  	  changeActiveBar(`${bar.nav_func}_${bar.nav_id}`);
      document.querySelector('.contact').click();
    }

    const {
      setExpandedDeptKeys,
      setSelectedDeptKeys,
      setSelectedCompanyKeys,
      setCurrentDropdownSelectedItem,
      setCurrentItem,
      setSelectCompanyId,
      setInputClose,
      setKeyWord,
      deptExpandedKeys: [],
      deptSelectedKeys: [],
      companyExpandedKeys: [],
      companySelectedKeys: [],
    } = this.props.contactStore;

    const allDepts = getContacts();

    let list = null;
    let dummy = allDepts.filter(dept => dept.id === companyId);

    if (dummy && dummy.length > 0) {
      list = dummy[ 0 ].depts;
    }

    if (!list) {
      list = [];
    }

    setSelectCompanyId(companyId);
    setCurrentDropdownSelectedItem(list, companyId, 'org');
    setSelectedCompanyKeys([ `${companyId}-org` ]);
    setExpandedDeptKeys(id);
    setSelectedDeptKeys([ id[ id.length - 1 ] ]);

    const item = this.getItemByArr(_.uniq(id), list);
    setCurrentItem(item);

    // 搜索关闭,搜索输入框置空
    setCurrentItem(null, true);
    setInputClose(false);
    setKeyWord(); */
  };

  getItemByArr(arr, list, parent) {
    if (arr.length === 0) {
      return parent;
    }

    for (let i of list) {
      if (i.id !== arr[ 0 ]) {
        continue;
      }

      return this.getItemByArr(arr.splice(1, arr.length - 1), i.children, i);
    }
  }

  handleChatClick = (user) => {
    const { handleHidePop } = this.props;
    handleHidePop && handleHidePop(false);

    const { forwardToChat } = this.props.utilStore;
    forwardToChat(user);
  };

  handleHidePop() {
    const { handleHidePop } = this.props;
    handleHidePop && handleHidePop();
  }

  handleAvatar = () => {
    const { handleHidePop } = this.props;
    handleHidePop && handleHidePop();
  }

  renderCompanyAttr(obj = {}, name, label) {
    if (name in obj) {  // 属性不存在
      if (obj[name]) {  // 属性为空
        if (name === 'mobile') {
          return (
            <div className="company-attr">
              <span className="attr-label">手机</span>
              <span>{obj['mobile_prefix']}-{obj[name]}</span>
            </div>
          );
        }

        return (
          <div className="company-attr">
            <span className="attr-label">{label}</span>
            <span>{obj[name]}</span>
          </div> 
        );
      } else {
        if (name === 'nick_name' || name === 'english_name') {
          return '';
        }
        return (
          <div className="company-attr">
            <span className="attr-label">{label}</span>
            <span className='attr-no-data'>未设置</span>
          </div> 
        );
      }
    } else {
      return '';
    }
  }

  renderAttrs(hrmUser, key, length) {
    let companyPath = '';
    let firstDept;
    
    if (hrmUser.deptlist && hrmUser.deptlist.length > 0) {
      firstDept = hrmUser.deptlist[ 0 ];
    }

    if (firstDept && firstDept.path.length > 0) {
      companyPath = firstDept.path.map((v, i) => {
        if (i === 0 && firstDept.path.length !== 1) {
          return;
        }

        if (i === firstDept.path.length - 1) {
          return (
            <b key={i} onClick={this.handleNavi.bind(this, firstDept.pathid.slice(0, i + 1), hrmUser.corpid)} >{v}</b>
          );
        } else {
          return (
            <i key={i}>
              <b onClick={this.handleNavi.bind(this, firstDept.pathid.slice(0, i + 1), hrmUser.corpid)}>{v} / </b>
            </i>
          );
        }
      });
    }

    return (
      <div className="company-item" key={key}>
        {length > 1 && <p className="company-name">{hrmUser.tenant_name}</p>}
        { length > 1 && this.renderCompanyAttr(hrmUser, 'name', '姓名') }
        { this.renderCompanyAttr(hrmUser, 'nick_name', '昵称') }
        { this.renderCompanyAttr(hrmUser, 'english_name', '英文名') }
        { this.renderCompanyAttr(hrmUser, 'mobile', '手机') }
        { this.renderCompanyAttr(hrmUser, 'telephone', '座机') }
        { this.renderCompanyAttr(hrmUser, 'email', '邮箱') }
        { this.renderCompanyAttr(hrmUser, 'manager_name', '上级') }
        { 
          companyPath 
            ? <div className="company-attr">
                <span className="attr-label">部门</span>
                <span>{companyPath}</span>
              </div>
            : ''
        }
        { this.renderCompanyAttr(hrmUser, 'position', '职位') }
        {
          hrmUser.extattr && hrmUser.extattr.attrs.map((attr, index) => {
            return (
              <div className="company-attr" key={index}>
                <span className="attr-label">{attr.name}</span>
                <span>{attr.value}</span>
              </div>
            )
          })
        }
      </div>
    );
  }

  render() {
    let { baseUser, className, handleHidePop, loadingFlag = true, type = '' } = this.props;

    if (!baseUser) {
      baseUser = this.props.homeStore.baseUser;
    }

    if ((!baseUser || !baseUser.main_tenant_id && loadingFlag) && type !== 'contact') {
      return (
        <Spin />
      )
    }

    if ((!baseUser || baseUser.loading) && loadingFlag && type !== 'contact') {
      return (
        <Spin />
      )
    }

    const mainUser = getCurrentUser();

    const { avaSize = 40 } = this.props;

    const bgImg = mainUser ? generateLogoBg(mainUser.base_user_name, mainUser.mobile) : '';

    let avatarClass = classnames({
      'avatar': true,
      'famale': baseUser && baseUser.gender === 2,
      'male': baseUser && baseUser.gender === 1,
      'male-famale': baseUser && baseUser.gender === 0
    });

    const psShowFlag = mainUser.base_user_id === baseUser.base_user_id;

    return (
      Object.keys(baseUser).length > 0 ?
        <div className={`person-info ${className ? className : ''}`}>
          {handleHidePop && <div className='close' onClick={this.handleHidePop.bind(this)}></div>}
          <div className='title'>
            <div className="left">
              <div className="name-gender">
                <h2 className="name">{baseUser.base_user_name || ''} </h2>
                <span className={avatarClass}>{baseUser.gender === 2 ? <FaVenus /> : baseUser.gender === 1 ? <FaMars/> :
                  <Icon type="question"/>}</span>
              </div>
              <p className="main-tenant-name">{baseUser.main_tenant_name || ''}</p>
            </div>
            <div className='right'>
              <OliAvatar
                size={avaSize}
                avatarMap={baseUser.avatar}
                className='pop-avatar'
                popover={false}
                psShowFlag={psShowFlag}
                handleAvatar={this.handleAvatar.bind(this)}
              />
            </div>
          </div>
          <div className="company-info-wrapper" style={{ backgroundImage: `url(${bgImg})` }}>
            <Scrollbars className={handleHidePop ? 'company-poper' : 'company-list'}>
              {
                baseUser.userlist
                  ? baseUser.userlist.map((hrmUser, key) => this.renderAttrs(hrmUser, key, baseUser.userlist.length))
                  : ''
              }
            </Scrollbars>
            <div className='btn-div'>
              <Button
                className="btn-chat"
                size="large"
                icon="message"
                type="primary"
                onClick={this.handleChatClick.bind(this, baseUser)}
              >
                发消息
              </Button>
            </div>
          </div>
          {
            (!baseUser || !baseUser.main_tenant_id || baseUser.loading && loadingFlag) && type === 'contact' 
              ? <Spin className='contact-spin' /> 
              : null
          }
        </div>
        : <div className='no-data'>暂无数据</div>
    )
  }
}
