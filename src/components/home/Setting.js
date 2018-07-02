import React, { Component } from 'react';
import ForgetPassWord from '../common/ForgetPassWord';
import PersonSetting from '../common/PersonSetting';
import ChangeThemeSetting from '../common/ChangeThemeSetting';
import ChangeMainCompany from '../common/ChangeMainCompany';
import SystemSetting from '../common/SystemSetting';
import AboutUs from '../common/AboutUs';
import { Dropdown, Menu } from 'antd';

import { getCurrentDomainSetting } from '../../lowdb';

export default class Setting extends Component {
  constructor(props) {
    super(props);
    this.state = {
      forgetVisible: false,
      changeThemeVisible: false,
      changeMCVisible: false,
      SyVisible: false,
      AuVisible: false,
    }
  }

  handleMenuSelect = (e) => {
    switch (e.key) {
      case 'exchange':
        this.props.onLogout(e.key);
        break;

      case 'password':
        this.handleModal('forgetVisible', true);
        break;

      case 'about':
        this.handleModal('AuVisible', true);
        break;

      case 'changeTheme':
        this.handleModal('changeThemeVisible', true);
        break;

      case 'changeCompany':
        this.handleModal('changeMCVisible', true);
        break;

      case 'setting':
        this.handleModal('SyVisible', true);
        break;

      case 'personSetting':
        const { baseUserId, getBaseUserInfo } = this.props;
        getBaseUserInfo(baseUserId);

        this.props.setPsVisible(true);
        break;
    }
  };

  handleModal(key, visible) {
    this.setState({
      [key]: visible
    });
  }

  render() {
    const { forgetVisible, changeThemeVisible, changeMCVisible, SyVisible, AuVisible } = this.state;
    const { user, getBaseInfoPending, companyList, psVisible, setPsVisible } = this.props;

    const urlSetting = getCurrentDomainSetting();

    const showPass = urlSetting && urlSetting.enable_update_password;

    return (
      <div className='setting-div'>
        <Dropdown
          trigger={[ 'click' ]}
          overlayClassName='sider-drop'
          overlay={
            <Menu onClick={this.handleMenuSelect}>
              <Menu.Item key='personSetting'>个人设置</Menu.Item>
              <Menu.Item key='setting'>系统设置</Menu.Item>
              {showPass && <Menu.Item key='password' className='line'>修改密码</Menu.Item>}
              <Menu.Item key='changeTheme' className={`${showPass ? '' : 'line'}`}>切换主题</Menu.Item>
              {companyList && companyList.length > 1 && <Menu.Item key='changeCompany' className='line'>切换主企业</Menu.Item>}
              <Menu.Item key='about' className='line'>关于</Menu.Item>

              <Menu.Item key='exchange'>注销</Menu.Item>
              <Menu.Item key='exit'>退出</Menu.Item>
            </Menu>
          }
        >
          <span className='setting'/>
        </Dropdown>
        <ForgetPassWord
          visible={forgetVisible}
          handleModal={this.handleModal.bind(this)}
        />
        <SystemSetting
          visible={SyVisible}
          handleModal={this.handleModal.bind(this)}
        />
        <AboutUs
          visible={AuVisible}
          handleModal={this.handleModal.bind(this)}
        />
        <PersonSetting
          visible={psVisible}
          setPsVisible={setPsVisible}
          info={user}
          loading={getBaseInfoPending}
        />
        <ChangeThemeSetting
          visible={changeThemeVisible}
          handleModal={this.handleModal.bind(this)}
          visibleKey='changeThemeVisible'
        />
        <ChangeMainCompany
          visible={changeMCVisible}
          handleModal={this.handleModal.bind(this)}
          visibleKey='changeMCVisible'
        />
      </div>
    )
  }
}