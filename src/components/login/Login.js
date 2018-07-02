import React, { Component } from 'react';
import * as mobx from 'mobx';

import moment from 'moment';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';

import qs from 'qs';

import AvatarUpload from '../common/AvatarUpload';
import { getAllDomainUrls, getLastUserByDomain } from '../../lowdb';
import { tryParse } from '../../common/jsonUtil';

import {
  getCurrentUser,
  getCurrentBaseUrl,
  getCurrentDomainSetting
} from '../../lowdb';

import OliAvatar from '../common/Avatar';

import { decrypt } from '../../common/aes';

import {
  AutoComplete,
  Form,
  Icon,
  Input,
  Button,
  Checkbox,
  Tabs,
  Row,
  Col,
  message,
  Steps,
  Spin,
  Radio,
  DatePicker,
  Tooltip
} from 'antd';

const FormItem = Form.Item;
const TabPane = Tabs.TabPane;
const Step = Steps.Step;
const RadioGroup = Radio.Group;

@withRouter
@inject(stores => ({
  loginStore: stores.loginStore,
  homeStore: stores.homeStore,
}))
@observer
export class DefaultPage extends Component {

  constructor(props) {
    super(props);
    this.lastUser = getLastUserByDomain();
    this.state = {
      btnSendText: '获取',
      waitTime: 60,
      currentTime: 60,
      // forgetSteps: [
      //   {
      //     title: '验证手机',
      //     content: () => this.renderValidPhone(false, 'forget')
      //   },
      //   {
      //     title: '修改密码',
      //     content: () => {
      //       return this.renderSetPassword()
      //     }
      //   },
      // ],
      registSteps: [
        {
          title: '验证手机',
          content: () => this.renderValidPhone(false, 'regist')
        },
        {
          title: '基础信息',
          content: () => {
            return this.renderSetBaseInfo()
          }
        },
        {
          title: '个人信息',
          content: () => {
            return this.renderSetPersonInfo()
          }
        }
      ],
    };

    this.codeInterval = null;
  }

  next = () => {
    const { currentStep } = this.props.loginStore;
    this.props.loginStore.setCurrentStep(currentStep + 1)
  };

  prev = () => {
    const { currentStep } = this.props.loginStore;

    this.props.loginStore.setCurrentStep(currentStep - 1)
  };

  componentWillMount() {
    const {
      getUrlSettings,
      initTab,
    } = this.props.loginStore;

    initTab();

    // 不是 electron 环境，并且 currentBaseUrl 为空
    // currentBaseUrl 不为空
    // 
    if ((!window.isElectron() && getCurrentBaseUrl() === '') 
      || getCurrentBaseUrl()) {
      getUrlSettings();
    }
  }

  componentDidMount() {
    console.log('login did mount .............');

    const {
      autoLogin,
    } = this.props.loginStore;

    let user = getCurrentUser();
    let autoLoginFlag = user && user.auto;

    if (autoLoginFlag) {
      // 记住密码了怎么办~
      if (user.access_token) {
        autoLogin();
      }
    }

    console.log('getLastUserByDomain:', getLastUserByDomain());
  }

  handleSubmit = (e) => {
    e.preventDefault();

    const {
      validateFields,
      getFieldsValue
    } = this.props.form;

    const {
      loginByUp
    } = this.props.loginStore;

    validateFields((err, values) => {
      if (err) {
        console.log('Error of form: ', err);
        return;
      }

      const data = getFieldsValue();
      const { username, password, upcaptcha, upremember, upauto } = data;
      const { captchaKey } = this.props.loginStore;

      loginByUp(username, password, upcaptcha, captchaKey, upremember, upauto);
    });
  };

  haveDomainUrls = () => {
    const urls = getAllDomainUrls();
    if (urls.length <= 0) {
      if (window.isElectron()) {
        const { ipcRenderer } = window.require('electron');
        ipcRenderer.send('change-to-url-input-page', { autoJump: false });
      }
    }
  };

  handleMinWindow = (e) => {
    const { remote } = window.require('electron');
    const win = remote.getCurrentWindow();
    win.minimize();
  };

  handleCloseWindow = (e) => {
    const { remote } = window.require('electron');
    const win = remote.getCurrentWindow();
    win.close();
    remote.app.quit();
  };

  handleForgetClick = () => {
    const {
      changeMode,
      setCurrentStep
    } = this.props.loginStore;

    changeMode('forget');
    setCurrentStep(0);
  };

  handleRegistClick = () => {
    console.log('regist click');

    const {
      changeMode,
      setCurrentStep
    } = this.props.loginStore;

    changeMode('regist');
    setCurrentStep(0);
  };

  handleGoBack = () => {
    const {
      changeMode
    } = this.props.loginStore;

    changeMode('login');
  };

  handleAvatarUploadSuccess = (id) => {
    console.log('avatar upload success');

    const { setFieldsValue } = this.props.form;
    setFieldsValue({ 'avatar': id });
  };

  getPassword = (id) => {
    if(!id) {
      return '';
    }

    const {
      allUsernameAndPasswords
    } = this.props.loginStore;

    let result = allUsernameAndPasswords.filter(u => u.loginid === id);
    if (!result || result.length === 0) {
      return '';
    }

    // 匹配到了
    let dummy = result[0];
    if (mobx.isObservableObject(dummy)) {
      dummy = mobx.toJS(dummy);
    }

    let password = !dummy.password 
                  ? '' 
                  : decrypt(dummy.password, dummy.key);

    return password
  };

  handleUsernameChange = (e) => {
    const { setFieldsValue } = this.props.form;
    const {
      allUsernameAndPasswords
    } = this.props.loginStore;

    let result = allUsernameAndPasswords.filter(u => u.loginid === e);
    if (!result || result.length === 0) {
      setFieldsValue({ password: '' });
      return;
    }

    // 匹配到了
    let dummy = result[0];
    if (mobx.isObservableObject(dummy)) {
      dummy = mobx.toJS(dummy);
    }

    let password = !dummy.password 
                  ? '' 
                  : decrypt(dummy.password, dummy.key);
    setFieldsValue({ password });
  };

  /**
   * 返回到 url 输入界面
   */
  handleUiModeClick = () => {
    if (window.isElectron()) {
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.send('change-to-url-input-page', { autoJump: false });
    }
  };

  renderServerUrlField() {
    const baseUrl = window.isElectron() ? getCurrentBaseUrl() : window.baseURL;

    return (
      window.isElectron() ? <FormItem className="server-url">
        <Tooltip placement='top' title={<div>{baseUrl}</div>}>
          <span className="ant-form-text"> {baseUrl} </span>
        </Tooltip>
        {
          window.isElectron() ? (
            <Tooltip placement='top' title={<div>切换</div>} overlayClassName='title-btn-tooltip'>
              <Icon className="change-baseurl-i" type="swap" onClick={this.handleUiModeClick}/>
            </Tooltip>
          ) : ''
        }
      </FormItem> : null
    );
  }

  renderLoginUPForm() {
    const { getFieldDecorator } = this.props.form;
    const {
      loginByUpPending,
      allUsernames,
      captchaKey
    } = this.props.loginStore;

    const baseUrl = getCurrentBaseUrl();
    const urlSetting = getCurrentDomainSetting();
    let defaultId = '';
    let defaultPassWord = '';

    // const sessionUser = sessionStorage.getItem('getCurrentUser');
    // if (sessionUser && sessionUser !== 'undefined' && sessionUser !== 'null') {
    //   let ret = tryParse(sessionUser) || {};
    //   defaultId = ret.loginid;
    //   defaultPassWord = this.getPassword(defaultId);
    // }

    if (this.lastUser) {
      defaultId = this.lastUser.loginid;
      defaultPassWord = this.getPassword(defaultId)
    }

    if (defaultPassWord === '') {
      defaultId = ''
    };

    return (
      <Form onSubmit={this.handleSubmit} className="login-form">
        {this.renderServerUrlField()}

        <FormItem>
          {getFieldDecorator('username', {
            rules: [{ required: true, message: '请输入登录名~' }],
            initialValue: defaultId
          })(
            <AutoComplete
              dataSource={allUsernames}
              onChange={this.handleUsernameChange}
              filterOption={
                (inputValue, option) => option.props.children.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
              }
            >
              <Input className="input-username" prefix={<Icon type="user"/>} placeholder="登录名"/>
            </AutoComplete>
          )}
        </FormItem>
        <FormItem>
          {getFieldDecorator('password', {
            rules: [{ required: true, message: '请输入密码~' }],
            initialValue: defaultPassWord
          })(
            <Input
              prefix={<Icon type="lock" />}
              type="password"
              placeholder="密码"
            />
          )}
        </FormItem>
        {
          urlSetting.enable_login_captcha ? (
            <FormItem>
              <Row gutter={8}>
                <Col span={12}>
                  {getFieldDecorator('upcaptcha', {
                    rules: [
                      { required: true, message: '请填写验证码~' }
                    ],
                  })(
                    <Input placeholder="验证码" style={{verticalAlign: 'middle'}}/>
                  )}
                </Col>
                <Col span={12}>
                  <img
                    alt=""
                    className="captcha-img"
                    src={`${baseUrl}/emp/captcha?key=${captchaKey}`}
                    onClick={this.handleClickCaptchaImg}
                  />
                </Col>
              </Row>
            </FormItem>
          ) : null
        }

        <Row gutter={8}>
          <Col span={12} className="col-login-actions">
            <FormItem>
              {getFieldDecorator('upremember', {
                valuePropName: 'checked',
                initialValue: true,
              })(
                <Checkbox>记住密码</Checkbox>
              )}
            </FormItem>
          </Col>
          <Col span={12} className="col-login-actions">
            <FormItem>
              {getFieldDecorator('upauto', {
                valuePropName: 'checked',
                initialValue: getCurrentUser().auto || false,
              })(
                <Checkbox>自动登录</Checkbox>
              )}
            </FormItem>
          </Col>
        </Row>

        <Row>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            className="login-form-button"
            loading={loginByUpPending}
          >登录</Button>
          <div className="forget-regist-wrapper">
            {urlSetting.enable_retrieve ? <a onClick={this.handleForgetClick}>忘记密码</a> : null}
            {urlSetting.enable_register ? <a onClick={this.handleRegistClick}>注册</a> : null}
          </div>
        </Row>
      </Form>
    );
  }

  renderCodeLogin() {
    const { codeLoginImg, codeLoginPending, isQrCodeExpire, qrCodeState, getCodeLogin, qrCodeUser, cancelCodeLogin } = this.props.loginStore;

    if (codeLoginPending) {
      return (
        <div className='code-login-spin'>
          <Spin />
        </div>
      );
    }

    return (
      <div className='code-login'>
        {qrCodeState && qrCodeState === 3 ? <div className='user-code-img'>
          <OliAvatar
            size={80}
            avatarMap={qrCodeUser.base_user_avatar}
            popover={false}
          />
          <h2>{qrCodeUser.base_user_name}</h2>
        </div> : <img src={codeLoginImg} />}
        {isQrCodeExpire ? <div className='overlay'>
          您的二维码已经失效，请点击下方的刷新按钮
        </div> : null}
        {isQrCodeExpire ? <div className='remarks'>
          <Icon type='exclamation-circle icon-warning' />
          <span className='marginL'>
            当前二维码已过期
            <a onClick={getCodeLogin}><Icon type='retweet' />刷新</a>
          </span>
        </div> : null}
        <div className='remarks'>
          {qrCodeState && qrCodeState === 1 ? <span>请使用移动端扫码登录</span> : null}
          {qrCodeState && qrCodeState === 3 ? <div>
            <Icon type='check-circle icon-success' />
            <div className='text'>
              <h3>扫描成功</h3>
              <h3>移动端中点击确认登录</h3>
            </div>
            <a className='user-code-cancel' onClick={cancelCodeLogin}>取消</a>
          </div> : null}
          {qrCodeState && qrCodeState === 4 ? <div>
            <Icon type='close-circle' />
            <div className='text'>
              <h3>你已取消此次操作</h3>
              <h3>正在重新为您生成二维码</h3>
            </div>
          </div> : null}
        </div>
      </div>
    );
  }

  handleTabChange = (e) => {
    console.log('tab change', e);

    const { changeTab } = this.props.loginStore;
    changeTab(e);
  };

  renderLoginForm() {
    const { activeTab } = this.props.loginStore;
    const urlSetting = getCurrentDomainSetting();

    if (!urlSetting.login_mode_pc) {
      return <div></div>
    }

    return (
      <Tabs
        activeKey={ activeTab }
        onChange={ this.handleTabChange }
      >
        {urlSetting.login_mode_pc.indexOf('1') >= 0 && <TabPane tab="密码登录" key="usp">
          <div className="login-form-wrapper">
            { activeTab === 'usp' && this.renderLoginUPForm() }
          </div>
        </TabPane>}
        {urlSetting.login_mode_pc.indexOf('3') >= 0 && <TabPane tab="扫码登录" key="code">
          <div className="login-form-wrapper">
            { activeTab === 'code' && this.renderCodeLogin()}
          </div>
        </TabPane>}
        {urlSetting.login_mode_pc.indexOf('2') >= 0 && <TabPane tab="手机登录" key="sms">
          <div className="login-form-wrapper">
            { activeTab === 'sms' && this.renderValidPhone(true, 'login') }
          </div>
        </TabPane>}
      </Tabs>
    );
  }

  async handleGetCode(mode = 'regist') {
    const { getFieldValue, getFieldsValue } = this.props.form;
    const { sendSms, captchaKey } = this.props.loginStore;
    const urlSetting = getCurrentDomainSetting();

    const data = getFieldsValue();
    console.log('form data:', data);

    const phone = getFieldValue('rgphone');
    console.log('手机号：', phone);
    if (!phone) {
      // 提示错误
      message.error('请输入手机号~');
      return;
    }

    const isPhone = /^1[3|5|7|8]\d{9}$/gi;
    if (!isPhone.test(phone)) {
      // 提示错误
      message.error('手机号格式不对~');
      return;
    }

    const captcha = getFieldValue('rgcaptcha');
    if (urlSetting.enable_sms_captcha) {
      if (!captcha) {
        message.error('请输入验证码~');
        return;
      }
    }

    let sendType = mode === 'forget' ? 1 : 0;

    // 发送验证码
    const sendResult = await sendSms(phone, captcha, captchaKey, sendType);

    // 验证码发送成功
    if (sendResult) {
      this.setState({
        currentTime: this.state.waitTime,
        btnSendText: this.state.waitTime,
        btnSendDisabled: true,
      }, () => {
        let interval = setInterval(() => {
          let current = this.state.currentTime;
          current--;

          this.setState({
            currentTime: current,
            btnSendText: current
          });

          if (current <= 1) {
            window.clearInterval(interval);
            this.setState({
              currentTime: this.state.waitTime,
              btnSendText: '获取',
              btnSendDisabled: false
            });
          }
        }, 999);
      });
    }
  }

  /**
   * 忘记密码和注册，但是跟手机验证码登陆使用的是同一个 接口
   * @param mode
   */
  handleValidPhone = (mode) => {
    const {
      validateFields,
    } = this.props.form;

    console.log('validate fields');

    validateFields((err, values) => {
      if (err) {
        console.log('Error of form: ', err);
        return;
      }

      let { rgphone, rgcode } = values;
      const { regist } = this.props.loginStore;
      regist(rgphone, rgcode, mode);
    });

    // this.next();
  };

  handleClickCaptchaImg = () => {
    const { changeCaptchaKey } = this.props.loginStore;
    changeCaptchaKey();
  };

  /**
   * 手机验证码登陆，使用的是单独的 action
   */
  handleClickLoginWithPC = () => {
    const {
      validateFields,
    } = this.props.form;

    validateFields((err, values) => {
      if (err) {
        console.log('Error of form: ', err);
        return;
      }

      let { rgphone, rgcode } = values;
      const { loginByPc } = this.props.loginStore;
      loginByPc(rgphone, rgcode);
    });
  };

  renderValidPhone(isLogin, mode = 'login') {
    const { getFieldDecorator } = this.props.form;
    const {
      registPending,
      loginByUpPending,
      sendSmsPending,
      captchaKey
    } = this.props.loginStore;

    const baseUrl = getCurrentBaseUrl();
    const urlSetting = getCurrentDomainSetting();

    return (
      <Form className="login-form">
        { isLogin && this.renderServerUrlField() }

        <FormItem>
          {getFieldDecorator('rgphone', {
            rules: [
              { required: true, message: '请填写手机号~' }
            ],
          })(
            <Input placeholder="手机号"/>
          )}
        </FormItem>

        {
          urlSetting.enable_sms_captcha ? (
            <FormItem>
              <Row gutter={8}>
                <Col span={12}>
                  {getFieldDecorator('rgcaptcha')(
                    <Input placeholder="验证码"/>
                  )}
                </Col>
                <Col span={12}>
                  <img
                    alt=""
                    className="captcha-img"
                    src={`${baseUrl}/emp/captcha?key=${captchaKey}`}
                    onClick={this.handleClickCaptchaImg}
                  />
                </Col>
              </Row>
            </FormItem>
          ) : null
        }

        <FormItem>
          <Row gutter={8}>
            <Col span={16}>
              {getFieldDecorator('rgcode', {
                rules: [
                  { required: true, message: '请填写收到的短信验证码~' }
                ],
              })(
                <Input placeholder="短信验证码"/>
              )}
            </Col>
            <Col span={8}>
              <Button
                loading={sendSmsPending}
                disabled={this.state.btnSendDisabled}
                onClick={this.handleGetCode.bind(this, mode)}
              >{this.state.btnSendText}</Button>
            </Col>
          </Row>
        </FormItem>

        {
          isLogin ? (
            <FormItem>
              <Button
                type="primary"
                htmlType="button"
                onClick={this.handleClickLoginWithPC}
                className="login-form-button"
                loading={loginByUpPending}
              >
                登录
              </Button>
              {urlSetting.enable_register && <div className="forget-regist-wrapper">
                <a href="#" onClick={this.handleRegistClick}>注册</a>
              </div>}
            </FormItem>
          ) : (
            mode !== 'forget' && <FormItem>
              <Button
                type="primary"
                onClick={this.handleValidPhone.bind(this, mode)}
                loading={registPending}
              >
                下一步
              </Button>
              <Button className="btn-back" onClick={this.handleGoBack}> 返回登录 </Button>
            </FormItem>
          )
        }
      </Form>
    );
  }

  checkSetPassword = (rule, value, callback) => {
    const form = this.props.form;

    if (value && value !== form.getFieldValue('setpassword')) {
      callback('重复密码要跟密码相同~');
    } else {
      callback();
    }
  };

  checkPassword = (rule, value, callback) => {
    const form = this.props.form;

    if (value && value !== form.getFieldValue('bipassword')) {
      callback('重复密码要跟密码相同~');
    } else {
      callback();
    }
  };

  /**
   * 修改很重要的信息，包括密码和用户名，姓名
   */
  handleUpdateInfo = () => {
    const {
      validateFields,
    } = this.props.form;

    validateFields((err, values) => {
      if (err) {
        console.log('Error of form: ', err);
        return;
      }

      let user = getCurrentUser();
      console.log('Received values of form: ', values, user);

      let { bipassword, userName, loginid } = values;
      const { updateInfo } = this.props.loginStore;
      updateInfo({
        password: bipassword,
        base_user_name: userName,
        loginid: loginid
      });
    });

    // this.next();
  };

  renderSetBaseInfo() {
    const { getFieldDecorator } = this.props.form;
    const {
      updateInfoPending
    } = this.props.loginStore;

    return (
      <Form className="login-form">
        <FormItem>
          {getFieldDecorator('userName', {
            rules: [
              { required: true, message: '请输入你的姓名~' }
            ],
          })(
            <Input
              prefix={<Icon type="user" style={{ fontSize: 13 }}/>}
              type="text"
              placeholder="真实姓名"/>
          )}
        </FormItem>
        <FormItem>
          {getFieldDecorator('loginid', {
            rules: [
              { required: true, message: '请输入你的登录名~' }
            ],
          })(
            <Input
              prefix={<Icon type="user" style={{ fontSize: 13 }}/>}
              type="text"
              placeholder="登录名"
            />
          )}
        </FormItem>
        <FormItem>
          {getFieldDecorator('bipassword', {
            rules: [
              { required: true, message: '请输入密码~' },
              // { validator: this.checkConfirm }
            ],
          })(
            <Input
              prefix={<Icon type="lock" style={{ fontSize: 13 }}/>}
              type="password"
              placeholder="设置密码"
            />
          )}
        </FormItem>
        <FormItem>
          {getFieldDecorator('birepassword', {
            rules: [
              { required: true, message: '请重复输入密码~' },
              { validator: this.checkPassword }
            ],
          })(
            <Input
              prefix={<Icon type="lock" style={{ fontSize: 13 }}/>}
              type="password"
              placeholder="重复密码"
            />
          )}
        </FormItem>
        <FormItem>
          <Button
            onClick={this.handleUpdateInfo}
            type="primary"
            loading={updateInfoPending}
          >修改</Button>
          <Button className="btn-back" onClick={this.handleGoBack}> 返回 </Button>
        </FormItem>
      </Form>
    );
  }

  /**
   * 修改密码，使用 resetpwd
   */
  handleUpdatePassword = () => {
    const {
      validateFields,
    } = this.props.form;

    validateFields((err, values) => {
      if (err) {
        console.log('Error of form: ', err);
        return;
      }

      let user = getCurrentUser();
      console.log('Received values of form: ', values, user);

      const { updatePassword } = this.props.loginStore;
      updatePassword(values);
    });

    // this.next();
  };

  renderSetPassword() {
    const { getFieldDecorator } = this.props.form;
    const {
      updatePasswordPending
    } = this.props.loginStore;

    return (
      <Form className="login-form">

        <FormItem>
          {getFieldDecorator('setpassword', {
            rules: [
              { required: true, message: '请输入密码~' },
            ],
          })(
            <Input
              prefix={<Icon type="lock" style={{ fontSize: 13 }}/>}
              type="password"
              placeholder="设置密码"
            />
          )}
        </FormItem>
        <FormItem>
          {getFieldDecorator('setrepassword', {
            rules: [
              { required: true, message: '请重复输入密码~' },
              { validator: this.checkSetPassword }
            ],
          })(
            <Input
              prefix={<Icon type="lock" style={{ fontSize: 13 }}/>}
              type="password"
              placeholder="重复密码"
            />
          )}
        </FormItem>
        <FormItem>
          <Button
            onClick={this.handleUpdatePassword}
            type="primary"
            loading={updatePasswordPending}
          >修改</Button>
          <Button className="btn-back" onClick={this.handleGoBack}> 返回 </Button>
        </FormItem>
      </Form>
    );
  }

  /**
   * 修改可有可无的信息。
   */
  handleUpdatePersionInfo = () => {
    const {
      validateFields
    } = this.props.form;

    validateFields((err, values) => {
      if (err) {
        console.log('Error of form: ', err);
        return;
      }

      let dummy = values;
      dummy.birthday = moment(dummy.birthday).format('YYYY-MM-DD 00:00:00');
      dummy.gender = Number(dummy.gender);

      const { updateBaseUserInfo } = this.props.loginStore;
      updateBaseUserInfo(dummy);
    });
  };

  renderSetPersonInfo() {
    const { getFieldDecorator } = this.props.form;
    const {
      updateInfoPending
    } = this.props.loginStore;

    return (
      <Form className="login-form">
        <FormItem>
          {getFieldDecorator('avatar')(
            <AvatarUpload uploadSuccess={this.handleAvatarUploadSuccess}/>
          )}
        </FormItem>

        <FormItem>
          {getFieldDecorator('gender', {
            initialValue: '1',
            rules: [
              { required: true, message: '请选择您的性别~' }
            ],
          })(
            <RadioGroup>
              <Radio value="1">男</Radio>
              <Radio value="2">女</Radio>
            </RadioGroup>
          )}
        </FormItem>
        <FormItem>
          {getFieldDecorator('email', {
            rules: [
              { type: 'email', message: '邮箱格式不正确~', },
            ],
          })(
            <Input placeholder="邮箱"/>
          )}
        </FormItem>

        <FormItem>
          {getFieldDecorator('birthday')(<DatePicker placeholder="生日"/>)}
        </FormItem>

        <FormItem>
          <Button
            onClick={this.handleUpdatePersionInfo}
            loading={updateInfoPending}
            type="primary"
          >提交</Button>
          <Button className="btn-back" onClick={this.handleGoBack}> 跳过 </Button>
        </FormItem>
      </Form>
    );
  }

  // 重置密码页面
  renderForget() {
    return (
      <div className="step-wrapper">
        <div className="steps-content">
          <div className="login-form-wrapper">
            <div className='forget-form'>
              <h3>重置密码</h3>
              {this.renderValidPhone(false, 'forget')}
              {this.renderSetPassword()}
            </div>
          </div>
        </div>
      </div>
    );
  }

  renderRegist() {
    const { registSteps } = this.state;
    const { currentStep } = this.props.loginStore;

    return (
      <div className="step-wrapper">
        <Steps current={currentStep}>
          {registSteps.map(item => <Step key={item.title} title={item.title}/>)}
        </Steps>

        <div className="steps-content">
          <div className="login-form-wrapper">
            {registSteps[currentStep].content()}
          </div>
        </div>
      </div>
    );
  }

  handleGoLogin = () => {
    const {
      changeUiMode
    } = this.props.loginStore;

    changeUiMode('login');
  };

  renderContent() {
    const {
      mode,
      autoLoginPending,
      getUrlSettingsPending,
    } = this.props.loginStore;

    if (getUrlSettingsPending) {
      return (
        <div className="login-loading-wrapper">
          <Spin />
        </div>
      );
    }

    if (autoLoginPending) {
      return (
        <div style={{ textAlign: 'center', paddingTop: 100 }}>
          <Spin size="large" tip={autoLoginPending && '登录中...'}/>
        </div>
      );
    }

    switch (mode) {
      case 'login':
        return this.renderLoginForm();

      case 'forget':
        return this.renderForget();

      case 'regist':
        return this.renderRegist();

      default:
        return;
    }
  }

  render() {
    // console.log('login render');
    return (
      <div className={`login-default-page ${window.isElectron() ? '' : 'login-linear-gradient'}`}>
        {window.isElectron() ? <div className="login-header">
          <h1>E-Mobile</h1>
          <div className="operations">
            <Icon type="minus" onClick={this.handleMinWindow.bind(this)}/>
            <Icon type="close" onClick={this.handleCloseWindow.bind(this)}/>
          </div>
        </div> : null}
        <div className={`${window.isElectron() ? '' : 'home-login'}`}>
          {this.renderContent()}
        </div>
      </div>
    );
  }
}

export default Form.create()(DefaultPage);
