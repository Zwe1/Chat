import { observable, action, runInAction } from 'mobx';
import { message } from 'antd';

import getInstance from '../websocket';

import { getToken } from '../services/msg';
import { keepAlive as live, messageSetting } from '../services/login';
import { fetchTheme, selectTheme } from '../services/theme';
import { fetchCompanyList, setMainCompany } from '../services/company'

import { setShortCut, getShortCut, setSwitch, getSwitch, setPanelSelect, getPanelSelect, setSendMsgSelect, getSendMsgSelect } from '../lowdb/lowdbShortCut';
import { getCurrentUser, setCurrentUser } from '../lowdb';

export default class HomeStore {

  constructor(utilStore) {
    this.utilStore = utilStore;
  }

  @observable activeBar = '-1';
  @observable activeTitle = null; // 激活的siderbar
  @observable mainTheme = null; // 当前应用的主题
  @observable btnList = []; // 当前的主题的titlebar的按钮列表
  @observable themeList = null; // 主题列表

  @observable companyList = null; // 企业列表
  @observable mainCompany = null; // 当前选择的公司

  @observable appShowSetting = 1; // 1 代表不打开新窗口展示app 2 代表打开新窗口展示app

  @observable hiddenWin = false; // 截图是否隐藏窗口

  @observable msgSetting = []; // 消息扩展功能列表

  @observable systemCut = getShortCut() || {
    screenCut: '',
    activeModal: '',
    search: ''
  }; // 系统设置快捷键

  // 消息提示音
  @observable voiceSwitch = (getSwitch('voiceSwitch') !== undefined ? getSwitch('voiceSwitch') : true);
  // 消息图标是否闪烁
  @observable iconSwitch = (getSwitch('iconSwitch') !== undefined ? getSwitch('iconSwitch') : true);
  // 是否自动启动
  @observable autoSwitch = (getSwitch('autoSwitch') !== undefined ? getSwitch('autoSwitch') : false);
  // 是否自动登录
  @observable autoLoginSwitch = getCurrentUser().auto;
  // 关闭主面板（1：最小化托管 2：关闭）
  @observable panelSelect = getPanelSelect() || '1';
  // 发送消息快捷键（1：enter发送，2：enter换行）
  @observable sendMsgSelect = getSendMsgSelect() || '1';

  @observable msgToken = {};
  @observable getMsgTokenPending = false;
  @observable fetchThemePending = false;  // 获取主题loading
  @observable selectThemePending = false; // 切换主题loading
  @observable fetchCompanyPending = false; // 获取企业列表loading
  @observable setMainCompanyPending = false; // 切换主企业loading

  @observable psVisible = false; // 个人设置的modal

  // 修改发送信息
  @action.bound handleSendMsgSelect(flag) {
    this.sendMsgSelect = flag;

    setSendMsgSelect(flag);
  }

  // 修改主面板
  @action.bound handlePanelSelect(flag) {
    this.panelSelect = flag;

    setPanelSelect(flag);
  }

  @action.bound setPsVisible(flag) {
    this.psVisible = flag;
  }

  // 切换switch
  @action.bound handleSwitch(state, key) {
    this[key] = state;
    if (key === 'autoLoginSwitch') {
      const user = getCurrentUser();
      setCurrentUser({
        ...user,
        auto: state,
      });
    } else {
      setSwitch(key, state);
    }

    if (key === 'autoSwitch') {
      const AutoLaunch = window.require('auto-launch');
      const os = window.require('os');

      if (os.platform() === 'win32') {
        let autoLaunch = new AutoLaunch({
          name: 'e-mobile',
          path: app.getPath('exe'),
        });
      } else if (os.platform() === 'darwin') {
        let autoLaunch = new AutoLaunch({
          name: 'e-mobile',
          path: '/Applications/Minecraft.app',
        });
      }

      if (state) {
        autoLaunch.enable();
      } else {
        autoLaunch.disable();
      }
    }

    if (state) {
      const AutoLaunch = window.require('auto-launch');
      const os = window.require('os');

      if (os.platform() === 'win32') {
        let autoLaunch = new AutoLaunch({
          name: 'e-mobile',
          path: app.getPath('exe'),
        });

        autoLaunch.enable();
      } else if (os.platform() === 'darwin') {
        let autoLaunch = new AutoLaunch({
          name: 'e-mobile',
          path: '/Applications/Minecraft.app',
        });

        autoLaunch.enable();
      }
    }
  };

  // 获取消息扩展功能列表
  @action.bound
  async getMessageSetting() {
    try {
      const data = await messageSetting();
      
      runInAction(() => {
        this.msgSetting = data.tenantlist || [];
      });

    } catch (error) {
      console.log(error);
      message.error('获取获取消息扩展功能列表失败~');
    }
  }

  // 修改系统设置快捷键
  @action.bound
  changeSystemCut(obj) {
    this.systemCut = obj;
    setShortCut(obj);
  }

  // 修改截图是否隐藏窗口
  @action.bound
  changeHiddenWin(flag) {
    this.hiddenWin = flag;
  }

  // 修改应用设置
  @action.bound
  changeAppShowSetting(showSetting) {
    this.appShowSetting = showSetting;
  }

  @action.bound
  changeActiveBar(bar) {
    this.activeBar = bar;
    const list = this.mainTheme.navlist;
    if (list && list.length > 0) {
      for (let i of list) {
        if (i.nav_func === parseInt(bar.split('_')[0])) {
          this.activeTitle = i;
          this.btnList = i.nav_btn_list;
          break;
        }
      }
    }
  }

  // 获取主题配置
  @action.bound
  async fetchTheme(type = 2) {
    this.fetchThemePending = true;

    try {
      const theme = await fetchTheme(type);
      const mainTheme = theme.theme;
      runInAction(() => {
        mainTheme.navlist && mainTheme.navlist.length > 0 && mainTheme.navlist.map(v => {
          if (v.isdefault) {
            this.activeBar = `${v.nav_func}_${v.nav_id}`;
            this.activeTitle = v;
            this.btnList = v.nav_btn_list;
          }
          if (v.nav_func === -3) {
            const showSetting = v.nav_func_set2 ? v.nav_func_set2 : 1;
            this.changeAppShowSetting(showSetting);
          }
        });

        this.mainTheme = mainTheme;
        this.themeList = theme.tenantlist;
        this.fetchThemePending = false;
      });
    } catch (error) {
      runInAction(() => {
        this.fetchThemePending = false;
      });
    }
  }

  // 切换主题配置
  @action.bound
  async selectTheme(id, callback) {
    this.selectThemePending = true;

    try {
      await selectTheme(id);
      await this.fetchTheme();
      runInAction(() => {
        this.selectThemePending = false;
      });
      message.success('主题切换成功~');
    } catch (error) {
      message.error('切换主题配置失败');
      runInAction(() => {
        this.selectThemePending = false;
      });
    }
  }

  // 获取企业列表
  @action.bound
  async fetchCompany() {
    this.fetchCompanyPending = true;

    try {
      const company = await fetchCompanyList();

      company.tenantlist && company.tenantlist.length > 0 && company.tenantlist.map(c => {
        if (c.id === company.main_tenant_id) {
          this.mainCompany = c.corpid;
        }
      })

      runInAction(() => {
        this.companyList = company.tenantlist || [];
        this.fetchCompanyPending = false;
      })
    } catch (error) {
      runInAction(() => {
        this.fetchCompanyPending = false;
      });
    }
  }

  // 切换主企业
  @action.bound
  async changeCompany(id) {
    this.setMainCompanyPending = true;

    try {
      await setMainCompany(id);
      this.mainCompany = id;
      await this.fetchTheme();
      runInAction(() => {
        this.setMainCompanyPending = false;
      });
      message.success('企业切换成功~');
    } catch (error) {
      message.error('切换企业失败');
      runInAction(() => {
        this.setMainCompanyPending = false;
      });
    }
  }

  @action.bound
  async getMsgToken(callback) {
    this.getMsgTokenPending = true;

    try {
      const data = this.msgToken = await getToken();
      // message.success('获取消息配置成功', 3);

      let dummy = getInstance(data);
      if (!dummy.wsCallback) {
        dummy.wsCallback = callback;
      }

      runInAction(() => {
        this.getMsgTokenPending = false;
      });
    } catch (error) {
      message.error('获取消息配置失败~');
      console.error(error);

      runInAction(() => {
        this.getMsgTokenPending = false;
      });
    }
  }

  /////////////////////////////////////

  @action.bound
  async keepAlive() {
    try {
      await live();
    } catch (err) {
      console.log('keep live error:', err);
    }
  }

  @observable keepAliveInterval;

  @action.bound startKeepAlive() {
    if (this.keepAliveInterval) {
      this.cancelKeepAlive();
    }

    // 三分钟一次
    this.keepAliveInterval = setInterval(() => {
      this.keepAlive()
    }, 1000 * 60 * 3);
  }
  
  @action.bound cancelKeepAlive() {
    window.clearInterval(this.keepAliveInterval);
    this.keepAliveInterval = null;
  }

}
