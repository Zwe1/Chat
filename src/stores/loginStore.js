import { observable, action, runInAction } from 'mobx';
import { message } from 'antd';
import uuid from 'uuid';

import {
  addBaseUrl,
  getCurrentBaseUrl,
  setCurrentBaseUrl,
  getAllloginid,
  getloginidAndPassword,
  setCurrentUser,
  setLastUserByDomain,
  removeByloginid,
  getCurrentUser,
  setLoginType,
  getLoginType,
} from '../lowdb';

import { operateBaseUserId } from '../lowdb/lowdbUtil';

import { generateKey, encrypt } from '../common/aes';

import {
  getSetting,
  loginByPhoneAndCode,
  loginByUsernameAndPassword,
  logout as realLogout,
  update as updateLoginInfo,
  regist as registService,
  resetpwd,
  sendSMSCode,
  keepAlive,
  resetpwdByOld,
  getCode,
  qrcodeImg,
  getCodeState,
  cancelCodeLogin,
} from '../services/login';

import {
  update as updateBUInfo,
  get as getBaseInfo,
} from '../services/baseuser';

export default class LoginStore {

  constructor(utilStore) {
    this.utilStore = utilStore;
  }

  // 是否是 设置 url 的界面
  @observable uiMode = 'url'; // login
  // 当前在什么模式，登录，注册，忘记密码
  @observable mode = 'login'; // 'forget', 'regist'
  @observable activeTab = '';

  // login hint
  @observable allUsernames = [];
  @observable allUsernameAndPasswords = [];

  @observable allDomainUrls = [];

  // 当前进行到第几步
  @observable currentStep = 0;

  // 用户的基本信息
  @observable baseUserInfo = null;

  // 登录验证码
  @observable captchaKey = uuid.v4();

  // 二维码登录图片
  @observable codeLoginImg = '';
  // 事件流
  eventSource;
  // 二维码是否过期
  @observable isQrCodeExpire = false;
  // 二维码状态
  @observable qrCodeState = 1;
  // 扫描二维码的用户信息
  @observable qrCodeUser = {};
  // 二维码code
  qrCode = '';

  /*
   * pending
   */
  @observable logoutPending = false;
  @observable loginByUpPending = false;
  @observable loginByPcPending = false;
  @observable sendSmsPending = false;
  @observable autoLoginPending = false;
  @observable getUrlSettingsPending = false;
  @observable getUrlSettingsError = false;
  @observable updateInfoPending = false;
  @observable getBaseInfoPending = false;
  @observable updateBaseUserInfoPending = '';
  @observable updatePasswordPending = false;
  @observable resetPasswordByOldPending = '';
  @observable registPending = false;
  @observable codeLoginPending = false;

  @action.bound setResetPasswordByOldPending(flag) {
    this.resetPasswordByOldPending = flag;
  }

  // 监控二维码状态
  @action.bound monitorQrcodeState(json) {
    // 设置当前Store中二维码状态
    this.qrCodeState = json.qrcode_state;
    // 关闭刷新层
    this.isQrCodeExpire = false;

    // 登录成功
    if (json.qrcode_state == 5) {
      // 重置二维码状态为1(解决系统注销后重新登录的问题)
      this.qrCodeState = 1;
      // 关闭长链接，销毁对象
      this.eventSource.close();
      delete this.eventSource;
      // 保存用户信息
      setCurrentUser(json);
      setLoginType('code');

      // 登录成功跳转
      this.afterLogin();
    }
    // 取消登录重新生成二维码
    else if (json.qrcode_state == 6) {
      this.eventSource.close();
      delete this.eventSource;
      // 生成新二维码，不改变提示文字(二维码状态)
      this.qrCodeState = 4;
      this.getCodeLogin();
    }
    // 二维码过期
    else if (json.qrcode_state == 2) {
      this.eventSource.close();
      delete this.eventSource;
      // 显示刷新层
      this.isQrCodeExpire = true;
    }
    // 扫码成功
    else if (json.qrcode_state == 3) {
      this.qrCodeUser = json;
    }
  }

  // 长连接
  @action.bound createLongConnection(code) {
    const tempMonitorQrcodeState = this.monitorQrcodeState;
    // 长连接,二维码是否过期
    if (typeof(EventSource) !== "undefined") {
      // 长链接对象不存在，则新建长链接对象
      if (this.eventSource == undefined) {
        this.eventSource = new EventSource(`${getCurrentBaseUrl()}/emp/passport/scanlogin/getstate?code=${code}`);
        // 监听 message 事件，等待接收服务器端发送过来的数据
        this.eventSource.addEventListener('message', function (event) {
          // 服务器发送的数据
          let json = JSON.parse(event.data);
          // 监控二维码状态
          tempMonitorQrcodeState(json);
        }, false);
      }
    }
    else {
      message.info("当前版本不支持SSE协议，请升级版本或联系管理员");
    }
  }

  // 二维码扫描成功取消
  @action.bound
  async cancelCodeLogin() {
    this.codeLoginPending = true;

    try {
      await cancelCodeLogin(this.qrCode);
      // 关闭长链接，销毁对象
      if (this.eventSource) {
        this.eventSource.close();
        delete this.eventSource;
      }

      runInAction(() => {
        this.qrCodeState = 6;
        this.getCodeLogin();
      });

    } catch (error) {
      console.log(error);

      runInAction(() => {
        this.codeLoginPending = false;
      });
    }
  }

  // 获取二维码登录图片
  @action.bound
  async getCodeLogin() {
    this.codeLoginPending = true;

    try {
      const dataCode = await getCode();
      const dataImg = await qrcodeImg(dataCode.code);

      this.qrCode = dataCode.code;

      const b64Response = btoa(String.fromCharCode.apply(null, new Uint8Array(dataImg)));
      const url = 'data:image/png;base64,' + b64Response;

      this.createLongConnection(dataCode.code);

      runInAction(() => {
        this.codeLoginPending = false;
        this.codeLoginImg = url;
      })
    } catch (error) {
      console.log(error);
      message.error('获取二维码失败了~');

      runInAction(() => {
        this.codeLoginPending = false;
      });
    }
  }

  // 获取登录主题配置
  @action.bound
  async getUrlSettings() {
    this.getUrlSettingsPending = true;
    this.getUrlSettingsError = false;

    try {
      const data = await getSetting();
      console.log('get url setting:', data);

      runInAction(() => {
        addBaseUrl({
          ...data,
          url: getCurrentBaseUrl()
        });

        let usernames = getAllloginid();
        if (usernames.length === 1 && usernames[ 0 ] === undefined) {
          usernames = [];
        }

        let usernamePasswords = getloginidAndPassword();

        // this.uiMode = 'login';
        this.allUsernames = usernames || [];
        this.allUsernameAndPasswords = usernamePasswords;
        this.getUrlSettingsPending = false;
        this.getUrlSettingsError = false;
      });
    } catch (error) {
      message.error('获取服务器设置失败了~');

      console.log(error);

      runInAction(() => {
        this.getUrlSettingsPending = false;
        this.getUrlSettingsError = true;

        // 如果错了 就回到 填写 url 的界面。
        // if (window.isElectron()) {
        //   const { ipcRenderer } = window.require('electron');
        //   ipcRenderer.send('change-to-url-input-page', { autoJump: false });
        // }
      })
    }
  }

  // 验证码修改
  @action.bound changeCaptchaKey() {
    this.captchaKey = uuid.v4();
  }

  @action.bound changeMode(mode = 'login') {
    this.mode = mode;
  }

  // 初始化激活的tab
  @action.bound initTab() {
    this.activeTab = getLoginType() ? getLoginType() : 'usp';

    if (this.activeTab === 'code') {
      this.getCodeLogin();
    }
  }

  @action.bound changeTab(newTab) {
    this.activeTab = newTab;
    // 获取二维码
    if (newTab === 'code') {
      this.getCodeLogin();
    } else {
      if (this.eventSource) {
        this.eventSource.close();
        delete this.eventSource;
      }
    }
  }

  @action.bound changeUiMode(uiMode) {
    this.uiMode = uiMode;
    this.allUsernames = [];
    this.allUsernameAndPasswords = [];
  }

  @action.bound setCurrentStep(step) {
    this.currentStep = step;
  }

  @action.bound
  checkError(data) {
    if (data.isException && data.code === 500) {
      let msg = data.msg.split(';')[1];
      message.error(msg);

      this.loginByPcPending = false;
      this.loginByUpPending = false;
      return true;
    }

    return false;
  }

  @action.bound
  async loginByPc(phone, code) {
    this.loginByPcPending = true;

    try {
      const data = await loginByPhoneAndCode(phone, code);
      setCurrentUser(data);

      if (data.status === 2) {
        message.warn('请完善个人信息~');
        runInAction(() => {
          // 用户未注册
          this.loginByPcPending = false;
          this.mode = 'regist';
          this.currentStep = 1;
        });

        return;
      }

      this.saveUrl();

      setLoginType('sms');


      runInAction(() => {
        // 登录成功
        this.afterLogin();
      });
    } catch (error) {
      message.error('登录失败了~');

      runInAction(() => {
        this.loginByPcPending = false;
      });
    }
  }

  @action
  afterLogin() {
    // 如果是 electron，需要调整界面的大小
    if (window.isElectron()) {
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.on('main-window-opened', (event, arg) => {
        window.oliHistory.push('/');
        this.loginByUpPending = false;
        this.autoLoginPending = false;
        this.loginByPcPending = false;
      });

      ipcRenderer.send('open-main-window', {});
    } else {
      window.oliHistory.push('/');
      this.loginByUpPending = false;
      this.autoLoginPending = false;
      this.loginByPcPending = false;
    }
  }

  saveUrl() {
    const url = window.isElectron() ? getCurrentBaseUrl() : window.baseURL;
    setCurrentBaseUrl(url);

    getSetting()
      .then(data => {
        // 保存当前 url 设置
        addBaseUrl({
          ...data,
          url,
        });
      })
      .catch((error) => {
        console.log('error', error);
      });
  }

  @action.bound
  async loginByUp(loginid, password, captchaText, key, remember, auto) {
    this.loginByUpPending = true;
    this.loginByPcPending = true;

    try {
      const data = await loginByUsernameAndPassword(loginid, password, captchaText, key);
      operateBaseUserId(data.base_user_id);

      let user = {
        ...data,
        auto,
        remember,
        loginid
      };

      // 添加到 users
      if (remember) {
        const key = generateKey();
        user.key = key;
        user.password = encrypt(password, key);
        console.log('encrypt password:', password, user.password, key);

        setCurrentUser(user);
      } else {
        // 从 users 里面删除
        removeByloginid(loginid);
      }

      // 这个是当前的用户信息 必须要保存的，只是在没有记住密码的时候不保存密码。
      // 这个是 currentUser
      setCurrentUser(user);
      setLoginType('usp');
      //根据服务器地址保存登录用户id
      setLastUserByDomain(data.base_user_id);

      runInAction(() => {
        this.afterLogin();
      });
    } catch (error) {
      message.error(error.msg);
      
      runInAction(() => {
        this.loginByUpPending = false;
        this.loginByPcPending = false;
        this.changeCaptchaKey();

        // if (error.isException) {
        //   switch (error.code) {
        //     case 103: 
        //       message.error(error.msg);
        //       break;

        //     default:
        //       // let msg = error.msg.split(';')[1];
        //       message.error(error.msg);
        //       break;
        //   }
        // }
      });
    }
  }

  @action.bound
  async autoLogin() {
    this.autoLoginPending = true;

    try {
      await keepAlive();

      setTimeout(() => {
        runInAction(() => {
          this.afterLogin();
        });
      }, 500);
    } catch (error) {
      message.error('登录失败了~');
      runInAction(() => {
        this.autoLoginPending = false;
        this.loginByUpPending = true;
      });
    }
  }

  /**
   *
   * @param {*} key
   * @param {*} ignore
   */
  @action.bound
  async logout(key, ignore) {
    this.logoutPending = true;

    try {
      if (ignore) {
        const data = await realLogout();
        console.log('get url setting:', data);
      }

      const user = getCurrentUser();

      setCurrentUser({
        ...user,
        auto: false
      });
      this.utilStore.homeStore.cancelKeepAlive();

      switch (key) {
        case 'quit':
          if (window.isElectron()) {
            const { ipcRenderer } = window.require('electron');
            ipcRenderer.send('quit-close-all');
          }

          break;

        case 'exchange':
          if (window.isElectron()) {
            const { ipcRenderer } = window.require('electron');
            ipcRenderer.send('exchange-user');
          } else {
            window.oliHistory.replace('/login');
          }

          // 清空
          // setCurrentBaseUrl('');
          location.reload();
          break;

        default:
          break;
      }

      runInAction(() => {
        this.logoutPending = false;
      });
    } catch (error) {
      runInAction(() => {
        this.logoutPending = false;
      });
    }
  }

  @action.bound
  async regist(phone, code, mode) {
    this.registPending = true;

    try {
      const data = await registService({ phone, code, mode });
      message.success('注册成功了~');

      if (mode !== 'forget') {
        // 注册成功之后，会返回 access_token, 相当于 login
        setCurrentUser(data);
      }

      if (mode === 'regist' && data.status === 1) {
        if (window.isElectron()) {
          const { ipcRenderer } = window.require('electron');
          ipcRenderer.send('open-main-window', {});
        } else {
          window.location.href = '/'
        }

        runInAction(() => {
          this.registPending = false;
          this.mode = 'login';
          this.currentStep = 0;
        });
        
        return;
      }

      runInAction(() => {
        this.registPending = false;
        this.currentStep = 1;
      });
    } catch (error) {
      message.error('注册失败了~');

      runInAction(() => {
        this.changeCaptchaKey();
        this.registPending = false;
      });
    }
  }

  @action.bound
  async getBaseUserInfo(base_user_id) {
    this.getBaseInfoPending = true;

    try {
      const data = await getBaseInfo(base_user_id);

      runInAction(() => {
        this.baseUserInfo = data;
        this.getBaseInfoPending = false;
      });
    } catch (error) {
      message.error('获取个人信息失败~');
      runInAction(() => {
        this.getBaseInfoPending = false;
      });
    }
  }

  @action.bound
  async updateBaseUserInfo(baseUser, type = 1) {
    this.updateBaseUserInfoPending = 'pending';

    try {
      await updateBUInfo(baseUser);

      const user = getCurrentUser();
      const uploadAvatar = baseUser.avatar ? { media_id: baseUser.avatar } : {};
      const lastAvatar = Object.assign(user.avatar, uploadAvatar);
      const lastUser = Object.assign(user, {
        birthday: baseUser.birthday,
        email: baseUser.email,
        gender: baseUser.gender,
        base_user_name: baseUser.base_user_name,
        avatar: lastAvatar
      });

      setCurrentUser(lastUser);

      if (type) {
        message.success('注册成功了~');
        runInAction(() => {
          this.changeUiMode('login');
        });
      } else {
        message.success('修改个人信息成功了~');
      }

      runInAction(() => {
        this.updateBaseUserInfoPending = 'success';
      });
      
      return true;
    } catch (error) {
      message.error('更新用户信息失败了~');
      runInAction(() => {
        this.updateBaseUserInfoPending = 'failed';
      });
      return false;
    }
  }

  @action.bound
  async updateInfo(params) {
    this.updateInfoPending = true;

    try {
      const data = await updateLoginInfo(params);
      console.log('updateInfo:', data);

      runInAction(() => {
        this.updateInfoPending = false;
        this.currentStep += 1;
      });
    } catch (error) {
      message.error('更新用户信息失败了~');
      runInAction(() => {
      })
    }
  }

  @action.bound
  async updatePassword(params) {
    this.updatePasswordPending = true;

    try {
      await resetpwd(params);
      message.success('密码修改成功');
      this.changeMode('login');

      runInAction(() => {
        this.updatePasswordPending = false;
      });
    } catch (error) {
      message.error('修改密码失败了~');

      runInAction(() => {
        this.changeCaptchaKey();
        this.updatePasswordPending = false;
      });
    }
  }

  @action.bound
  async resetPasswordByOld(params) {
    this.resetPasswordByOldPending = 'pending';
    try {
      await resetpwdByOld(params);

      const user = getCurrentUser();
      const key = generateKey();
      user.key = key;
      user.password = encrypt(params.new_pwd, key);
      setCurrentUser(user);

      message.success('密码修改成功');

      runInAction(() => {
        this.resetPasswordByOldPending = 'success';
      })
    } catch (error) {
      console.log(error);
      message.error('修改密码失败了~');

      runInAction(() => {
        this.resetPasswordByOldPending = 'failed';
      })
    }
  }

  @action.bound
  async sendSms(phone, captcha, captchaKey, sendType) {
    this.sendSmsPending = true;

    try {
      const data = await sendSMSCode(phone, captcha, captchaKey, sendType);
      console.log('sendSms:', data);

      message.success('验证码发送成功~');

      runInAction(() => {
        this.sendSmsPending = false;
      });

      return true;
    } catch (error) {
      message.error('验证码发送失败了~');

      runInAction(() => {
        this.changeCaptchaKey();
        this.sendSmsPending = false;
      });

      return false;
    }
  }

}
