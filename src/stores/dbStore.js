import { observable, action, runInAction } from "mobx";
import { simpleUserList } from "../services/userinfo";
import { getUserInfo as getUser } from "../services/baseuser";
import getInstance from "../websocket";
import _ from "lodash";
import { saveGroup, getGroups } from "../lowdb/lowdbGroup";
import { getCurrentUser } from "../lowdb";

export default class DbStore {

  constructor(utilStore) {
    this.utilStore = utilStore;
  }

  @observable updateBaseUserInfo = 0;
  
  @action.bound changeUpdateBaseUserInfo() {
    this.updateBaseUserInfo++;
  }
  
  // //////////////////////////////////////////////////////////////////
  
  @observable userCache = observable.map({});
  
  @observable groupCache = observable.map({});
  
  @action.bound loadOldGroups() {
    let user = getCurrentUser();
    if (user && user.base_user_id) {
      const groups = getGroups();
      if (groups && groups.length > 0) {
        groups.forEach(g => {
          this.groupCache.set(g.groupId, g);
        });
      }
    }
  }
 
  @action.bound
  setUserCache(id, uploadAvatar) {
    let user = this.userCache.get(id);
    this.userCache.set(id, {
      avatar: Object.assign(user.avatar, uploadAvatar),
      ...user
    });
  }

  @action.bound
  getSimpleUserInfo(id) {
    // console.log('get simple user info:', id);

    let dummy = this.userCache.get(id);

    if (!dummy) {
      this.getSimpleUsersInfo([ id ]);
      return { loading: true };
    }

    return dummy;
  }

  @action.bound
  async getSimpleUsersInfo(ids) {
    ids = ids.filter(id => !!id);
    let dummyIds = [];

    // console.log('get simple users info:', ids);

    if (ids && ids.length > 0) {
      ids.forEach(id => {
        let dummy = this.userCache.get(id);
        if (!dummy) {
          this.userCache.set(id, {
            loading: true,
            id,
            name: '...'
          });

          dummyIds.push(id);
        } else if (dummy.loading) {
          // 正在请求
        } else {
          // 已经有值
        }
      });
    }

    if (dummyIds.length === 0) {
      return;
    }

    try {
      let userList = await simpleUserList(dummyIds);

      // 更新 store
      runInAction(() => {
        userList.forEach(user => {
          user.loading = false;
          // id, name, avatar
          user.base_user_name = user.name;
          user.base_user_id = user.id;

          this.userCache.set(user.id, user);
        });
      });
    } catch (err) {
      console.error('error get simple user info:', err);
      
      // runInAction(() => {
      //   userList.forEach(user => {
      //     user.loading = false;
      //     // id, name, avatar
      //     user.base_user_name = user.name;
      //     user.base_user_id = user.id;

      //     this.userCache.set(user.id, user);
      //   });
      // });

    }
  }

  @action.bound
  async getUserInfo(id, force = false) {
    if (!id) {
      return;
    }

    let dummy = this.userCache.get(id);

    // 如果之前保存的是简单信息，那么这里还是需要继续请求，直到详细信息。
    let isSimple = !('main_tenant_id' in dummy);
    if (!dummy || isSimple) {
      if (!isSimple) {
        this.userCache.set(id, {
          loading: true
        });
      }

      // 没有需要请求
      let user = await getUser(id);
      user.loading = false;
      user.id = user.base_user_id;
      user.name = user.base_user_name;

      runInAction(() => {
        this.userCache.set(id, user);
      })
    }

    // 2. from store
    // 3. from server
  }

  @action.bound
  async getGroupsInfo(ids = []) {
    ids.forEach(id => this.getGroupInfo(id));
  }

  @action.bound
  async getGroupInfo(id, update = false) {
    // 1. from cache
    // 2. from store
    // 3. from server
    if (_.isArray(id) && id.length === 1) {
      id = id[ 0 ];
    }

    let dummy = this.groupCache.get(id);
    let ws = getInstance();
    //  如果没有链接 ws 就再等等
    if (!ws || !ws.connected) {
      return;
    }

    // 之前没有请求过，或者这次需要更新，再发请求
    if (!dummy || update) {
      if (!dummy) {
        this.groupCache.set(id, {
          loading: true
        });
      }

      ws.getMemebers({ groupId: id }, (data) => {
        try {
          let group = data.content;
          group.isGroup = true;
          group.loading = false;  // 设置不在加载


          // 重新格式化 memebers 的格式，去掉 id***|sdfksdjf
          group.members = group.members.map(id => {
            if (id.indexOf('|') < 0) {
              return id;
            } 
              
            return id.split('|')[0]; // createUser...
          });

          let members = group.members;
          
          // admins
          group.owners = group.admins.map(admin => admin.split('|')[0]);

          if (!group.groupManagers) {
            group.groupManagers = [];
          }

          // 这里是字符串， '["id|udid"]'
          if (_.isString(group.groupManagers)) {
            group.groupManagers = JSON.parse(group.groupManagers);
          }

          // 所有管理员的 id，去掉 群主的 id，去掉 | 后面的东西
          group.managers = group
                            .groupManagers
                            .filter(u => u !== group.createUser)
                            .map(userId => userId.split('|')[0]);

          // 去掉群主和管理员
          members = members.filter(id => group.owners.indexOf(id) < 0);
          members = members.filter(id => group.managers.indexOf(id) < 0);

          // 添加管理员
          group.managers.forEach(id => members.unshift(id));

          // 添加群主
          group.owners.forEach(id => members.unshift(id));
          group.members = members;

          // 设置头像 
          if (!group.groupIconUrl) {
            group.avatar = {
              default: '/common/images/group_default.png'
            }
          } else {
            group.avatar = {
              media_id: group.groupIconUrl 
            }
          }

          runInAction(() => {
            this.groupCache.set(group.groupId, group);

            // setTimeout(() => {
            //   saveGroup(group);
            // }, 10);
          });
        } catch (e) {
          console.error('eeee', e);
        }
      
      });
    }
  }


  @action.bound saveGroupsCache(groups = []) {
    groups.forEach(group => {
      let dummy = this.groupCache.get(group.id);
      if (dummy) {
        this.groupCache.set(group.id, {
          ...dummy,
          ...group
        });
      } else {
        this.groupCache.set(group.id, group);
      }
    });
  }

}
