import { observable, action, runInAction } from 'mobx';
import { agentList, getUnread } from '../services/agent';
import { message } from 'antd';

export default class AppStore {

  @observable currentSelectedCompany = null;
  @observable fetchAgentListPending = false;
  @observable appOpenKeys = [];
  @observable agentData = {};
  @observable corpid = '';
  @observable unRead = {};
  @observable listIndex = 0 // 全局搜索框默认选中的ListItem

  @action.bound setListIndex(i) {
    this.listIndex = i;
  }

  @action.bound setAppOpenKeys(item) {
    this.appOpenKeys = item;
  }

  @action.bound setCurrentSelectedCompany(company) {
    this.currentSelectedCompany = company;
  }

  @action.bound async fetchAgentList(corpid) {
    this.fetchAgentListPending = true;

    try {
      const data = await agentList(corpid);

      runInAction(() => {
        this.agentData[corpid] = data;
        this.corpid = corpid;
        this.fetchAgentListPending = false;
        this.appOpenKeys = ['0']
      });
    } catch (error) {
      message.error('获取应用列表失败了~');
      console.log(error);
      runInAction(() => {
        this.fetchAgentListPending = false;
      });
    }
  }

  @action.bound async getUnread(url, index) {
    this.unRead = {
      ...this.unRead,
      [index]: {
        data: {},
      }
    }
    try {
      const data = await getUnread(url);
      runInAction(() => {
        this.unRead = {
          ...this.unRead,
          [index]: {
            data: data,
          }
        }
      })
    } catch (error) {
      console.log(error);
    }
  }
}