import { observable, action, runInAction } from 'mobx';
import { message } from 'antd';
import _ from 'lodash';

import {
  myDepts,
  listAll,
  tenantList,
  userAndDeptSearch,
  listUserByAll,
  subordinate,
  commonGroup,
} from '../services/tenant';
import { getUserInfo, userAndGroupSearch } from '../services/baseuser';
import { groupsSearch } from '../services/group';

import { listByUser } from '../services/group';

import getInstance from '../websocket';

//import { saveGroups } from '../lowdb/lowdbGroup';

import {
  getCurrentUser,
  setCurrentUser,
} from '../lowdb';

let allUsers = []; // 所有用户的信息
let allUsersId = []; // 所有用户的baseUserId

function parseChild(parent, arr, type = null) {
  // 通讯录转存
  if (parent.userlist.length > 0 && type !== 'my') {
    parent.userlist.forEach(user => {
      let path = [];
      let pathDataId = [];
      let finalUser = {};
      let index = 0;

      for (let i in parent.parentName) {
        path = [...path, parent.parentName[i].parentName];
        if (i == parent.parentName.length - 1) {
          pathDataId = parent.parentName[i].idNav;
        }
      }

      const pathId = parent.all_parent_ids.split(',').filter(v => v !== '');

      const deptlist = {
        id: parent.id,
        name: parent.name,
        parentid: parent.parentid,
        pathId: [...pathId, `${parent.id}`],
        path: [...path, parent.name],
        pathDataId: [...pathDataId, parent.id],
      };

      const userlist = {
        english_name: user.english_name,
        nick_name: user.nick_name,
        hrm_name_full_pingyin: user.hrm_name_full_pingyin,
        hrm_name_simple_pingyin: user.hrm_name_simple_pingyin,
        id: user.id,
        name: user.name,
        tenant_name: parent.parentName ? parent.parentName[ 0 ].parentName : '',
        position: user.position,
        deptlist: [deptlist],
      };

      let flag = allUsersId.some((id, i) => {
        index = i;
        return id === user.base_user_id;
      });

      if (flag) {
        const haveUser = allUsers[index];
        user.userlist = [ ...haveUser.userlist, userlist ];
      } else {
        finalUser = {
          avatar: user.avatar,
          base_user_id: user.base_user_id,
          base_user_name: user.base_user_name,
          msgUserId: user.msgUserId,
          gender: user.gender,
          base_name_full_pingyin: user.base_name_full_pingyin,
          base_name_simple_pingyin: user.base_name_simple_pingyin,
          userlist: [ userlist ],
        };

        allUsersId && allUsersId.push(user.base_user_id);
        allUsers && allUsers.push(finalUser);
      }

    });
  }

  const children = arr.filter(item => item.parentid === parent.id) || [];
  if (children.length > 0) {
    children.map((item, i) => {
      parent.parentName = parent.parentName || [];
      parent.id = parent.id || '';
      let idNav = [];
      parent.parentName.forEach(v => idNav = [...idNav, ...v.idNav]);
      idNav = _.uniq([...idNav, `${parent.id}`]);
      item.parentName = [...parent.parentName, {parentName: parent.name, idNav: idNav}];
      item.children = parseChild(item, arr, type);
    });
  }

  return children;
}

export default class ContactStore {

  constructor(utilStore) {
    this.utilStore = utilStore;
  }

  @observable currentItem = {};
  @observable currentDropdownSelectedItem = {};
  @observable currentDropdownSelectedItemKey = '';
  @observable currentSelectedCompany = null;

  @observable selectCompanyId = ''; // 选中的公司
  @observable allDepts = [];
  @observable myDepts = [];
  @observable selectCompanyType = 0; // 1 my dept, 0 all dept

  @observable deptExpandedKeys = [];
  @observable deptSelectedKeys = [];

  @observable companyExpandedKeys = [];
  @observable companySelectedKeys = [];

  // 搜索
  @observable networkUserList = [];
  @observable networkGroupList = [];

  @observable fetchAllPending = false;
  @observable fetchCompanysPending = false;
  @observable fetchMyDepartmentPending = false;
  @observable fetchUserSearchPending = {all: false, users: false, groups: false};
  @observable fetchListByDeptPending = false;
  @observable fetchUserAndDeptPending = false;
  @observable fetchSubordinatePending = false; // 获取我的下属pending
  @observable fetchCommonGroupPending = false; // 获取我的常用组pending

  @observable subordinateData = []; // 我的下属数据
  @observable commonGroupData = []; // 我的常用组数据

  @observable companysTreeData = [];
  @observable allCompanys = [];

  @observable selectValue = 0;  // dept的下拉框选项的值
  @observable deptTreeRootClick = false;
  @observable deptTreeSingleClick = true;

  @observable removedChecked = []; // tree取消选中的数组

  @observable keyword = ''; // 搜索框关键字
  @observable inputClose = false; // 搜索框是否有输入
  @observable searchItem = {};  // 搜索选中的item
  @observable searchUserList = []; // 搜索的人员列表
  @observable searchDeptList = []; // 搜索的部门列表

  @action.bound setRemovedChecked(ids) {
    this.removedChecked = ids;
    return true;
  }

  @action.bound clearSearch() {
    this.searchUserList = [];
    this.searchDeptList = [];
  }

  @action.bound setSelectValue(value) {
    this.selectValue = value;
  }

  @action.bound setDeptTreeSingleClick(flag) {
    this.deptTreeSingleClick = flag;
  }

  @action.bound setdeptTreeRootClick(flag) {
    this.deptTreeRootClick = flag;
  }

  @action.bound setKeyWord(keyword = '') {
    this.keyword = keyword;
  }

  @action.bound setInputClose(flag) {
    this.inputClose = flag;
  }

  @action.bound setCurrentSelectedCompany(company) {
    this.currentSelectedCompany = company;
  }

  //  根据公司id存储通讯录
  @action.bound setCurrentDropdownSelectedItem(item, companyId, flag) {
    if (flag) {
      this.currentDropdownSelectedItemKey = `${companyId}-${flag}`;
    }

    if (this.currentDropdownSelectedItemKey in this.currentDropdownSelectedItem && item[this.currentDropdownSelectedItemKey]) {
      this.currentDropdownSelectedItem[this.currentDropdownSelectedItemKey] = item[this.currentDropdownSelectedItemKey];
      return;  
    }

    this.currentDropdownSelectedItem = Object.assign(this.currentDropdownSelectedItem, {[this.currentDropdownSelectedItemKey]: item});
  }

  @action.bound setSelectCompanyId(id) {
    this.selectCompanyId = id;
  }

  @action.bound setSelectCompanyType(type) {
    this.selectCompanyType = type;
  }

  /**
   * user or dept, selected
   *
   * @param user
   */
  @action.bound
  async setCurrentItem(user, search = false) {
    if (!user) {
      search
        ? this.searchItem = {}
        : this.currentItem = {};
      return;
    }

    // 这是一个部门
    if (!user.base_user_id && user.id) {
      search
        ? this.searchItem = user
        : this.currentItem = user;
      return;
    }

    // 不是我自己
    const myUser = getCurrentUser();
    if (myUser.base_user_id !== user.base_user_id) {
      search
        ? this.searchItem.loading = true
        : this.currentItem.loading = true;
    }

    // 如果缓存中有， 先显示出来
    let dummy = this.utilStore.dbStore.userCache.get(user.base_user_id);
    if (dummy) {
      search
        ? this.searchItem = { ...dummy, loading: false }
        : this.currentItem = { ...dummy, loading: false };
    }

    try {
      let data = await getUserInfo(user.base_user_id, true);
      data.loading = false;

      if (myUser.base_user_id === user.base_user_id) {
        const lastUser = Object.assign(myUser, {
          avatar: Object.assign(myUser.avatar, data.avatar)
        });

        setCurrentUser(lastUser);
      }

      runInAction(() => {
        this.utilStore.dbStore.userCache.set(data.base_user_id, data);

        search
          ? this.searchItem = { ...data, loading: false }
          : this.currentItem = { ...data, loading: false };
      });
    } catch (e) {
      runInAction(() => {
        search
          ? this.searchItem = { loading: false }
          : this.currentItem = { loading: false };
      });
    }
  }

  @action.bound setSelectedCompanyKeys(keys) {
    this.companySelectedKeys = keys.map(v => `${v}`);;
  }

  @action.bound setExpandedCompanyKeys(keys) {
    this.companyExpandedKeys = keys.map(v => `${v}`);;
  }

  @action.bound setExpandedDeptKeys(keys) {
    this.deptExpandedKeys = keys.map(v => `${v}`);
  }

  @action.bound setSelectedDeptKeys(keys) {
    this.deptSelectedKeys = keys.map(v => `${v}`);;
  }

  // 通讯录异步加载
  @action.bound
  async fetchDept(companyId, deptId, treeNode ) {
    const selectType = this.selectCompanyType === 1 ? this.selectCompanyType : 0;
    try {
      const data = await listAll(companyId, deptId, selectType);
      treeNode.props.dataRef.children = [ ...data.userlist, ...data.department ];

      this.setCurrentDropdownSelectedItem(this.currentDropdownSelectedItem, companyId);
    } catch (error) {
      message.error('该部门列表获取失败了哦~');
    }
  }

  @action.bound
  async fetchAll(idArr) {
    this.fetchAllPending = true;

    try {
      const data = await listAll(idArr);

      if (data.length > 0) {
        data.forEach((company, index) => {
          const depts = company.department;
          // 可能会有好多 parentid 为 0 的

          let roots = depts.filter(item => item.parentid === 0);

          // roots.forEach(root => {
          //   root.children = parseChild(root, depts);
          // });

          this.allDepts.push({
            id: idArr[index],
            depts: roots
          });
        });
      }

      runInAction(() => {
        this.fetchAllPending = false;
      });
    } catch (error) {
      message.error('获取部门失败了~');

      runInAction(() => {
        this.fetchAllPending = false;
      });
    }
  }

  @action.bound getAllCompanys() {
    return this.allCompanys;
  }

  @action.bound
  async fetchUsersByDept(cid, deptId) {
    try {
      const data = await listUserByAll(cid, deptId);
      return data;
    } catch (error) {
      console.log(error);
      message.error('获取部门人员失败了~')
    }
  }

  @action.bound
  async fetchSubordinate(idArr) {
    this.fetchSubordinatePending = true;

    try {
      const data = await subordinate(idArr);

      if (data.length > 0) {
        data.forEach((subord, index) => {
          this.subordinateData.push({
            id: idArr[index],
            depts: subord.userlist
          });
        });
      }

      runInAction(() => {
        this.fetchSubordinatePending = false;
      });
    } catch (error) {
      console.log(error);
      message.error('获取下属列表失败');

      runInAction(() => {
        this.fetchSubordinatePending = false;
      });
    }
  }

  @action.bound
  async fetchCommonGroup(idArr) {
    this.fetchCommonGroupPending = true;

    try {
      const data = await commonGroup(idArr);

      if (data.length > 0) {
        data.forEach((cg, index) => {
          this.commonGroupData.push({
            id: idArr[index],
            commonList: cg.commonlist || [], // 公共组
            ownedList: cg.ownedlist || [], // 私人组
          })
        });
      }

      runInAction(() => {
        this.fetchSubordinatePending = false;
      });
    } catch (error) {
      console.log(error);
      message.error('获取常用组列表失败');

      runInAction(() => {
        this.fetchCommonGroupPending = false;
      });
    }
  }

  @action.bound
  async fetchCompanys(includeDept = false) {
    this.fetchCompanysPending = true;

    try {
      const data = await tenantList();
      // message.success('获取公司列表成功了~');

      if (includeDept) {
        let tenantlist = data.tenantlist || [];
        let ids = tenantlist.map(company => company.corpid);

        runInAction(() => {
          this.allCompanys = tenantlist;
        });

        await this.fetchMyDepartment(ids);
        await this.fetchAll(ids);
        await this.fetchSubordinate(ids);
        await this.fetchCommonGroup(ids);

        this.setCurrentSelectedCompany(tenantlist[0]);
      }

      const companyList = data.tenantlist;

      const companysTreeData = companyList.map(com => {
        let corpid = com.corpid;
        const subData = this.subordinateData.filter(v => v.id === corpid)[ 0 ].depts;
        let subFlag = false;
        if (subData && subData.length > 0) {
          subFlag = true;
        }

        const children = subFlag ? [
          {
            label: '组织结构',
            value: `${corpid}-org`,
            key: `${corpid}-org`,
          },
          {
            label: '我的部门',
            value: `${corpid}-mydept`,
            key: `${corpid}-mydept`,
          },
          {
            label: '我的下属',
            value: `${corpid}-subordinate`,
            key: `${corpid}-subordinate`
          },
          {
            label: '常用组',
            value: `${corpid}-regroup`,
            key: `${corpid}-regroup`
          }
        ] : [
          {
            label: '组织结构',
            value: `${corpid}-org`,
            key: `${corpid}-org`,
          },
          {
            label: '我的部门',
            value: `${corpid}-mydept`,
            key: `${corpid}-mydept`,
          },
          {
            label: '常用组',
            value: `${corpid}-regroup`,
            key: `${corpid}-regroup`
          }
        ]

        return {
          key: corpid,
          value: corpid,
          label: com.tenant_name,
          logo: com.logo,
          disabled: true,
          children: children
        };
      });

      let comExpandedKeys = companyList.map((com, i) => i === 0 ? com.corpid : '');
      runInAction(() => {
        this.fetchCompanysPending = false;
        this.companyExpandedKeys = comExpandedKeys;
        this.companysTreeData = companysTreeData;
      });
    } catch (error) {
      message.error('获取公司列表设置失败');

      runInAction(() => {
        this.fetchCompanysPending = false;
      });
    }
  }

  // 顶部搜索
  @action.bound
  async fetchUserOrGroupSearch(keyword, flag) {
    this.fetchUserSearchPending[flag] = true;

    try {
      let usersData = [];
      let groupsData = [];

      if (flag === 'users') {
        const users = await userAndGroupSearch(keyword, 1);  // 联系人搜索
        usersData = users.userlist && users.userlist.length > 0 ? users.userlist.filter(item => item.id) : [];
        runInAction(() => {
          this.networkUserList = usersData;
          this.networkGroupList = groupsData;

          this.fetchUserSearchPending[flag] = false;
        });
      } else if (flag === 'groups') {
        let ws = getInstance();
        ws.fetchAllGroup(data => {
          groupsData = data.content && data.content.allGroups ? data.content.allGroups : [];
          runInAction(() => {
            this.networkUserList = usersData;
            this.networkGroupList = groupsData;

            this.fetchUserSearchPending[flag] = false;
          });
        }, {
          keyword,
          pageNumber: 1,
          pageSize: 50,
        });

      } else {
        const data = await userAndGroupSearch(keyword);
        usersData = data.userlist && data.userlist.length > 0 ? data.userlist.filter(item => item.id) : [];
        
        let ws = getInstance();
        ws.fetchAllGroup(data => {
          groupsData = data.content && data.content.allGroups ? data.content.allGroups : [];
          runInAction(() => {
            this.networkUserList = usersData;
            this.networkGroupList = groupsData;

            this.fetchUserSearchPending[flag] = false;
          });
        }, keyword);
      }

    } catch (error) {
      console.log(error);
      runInAction(() => {
        this.fetchUserSearchPending[flag] = false;
      })
    }
  }

  // 通讯录搜索
  @action.bound
  async fetchUserOrDeptSearch(keyword, corpid) {
    this.fetchUserAndDeptPending = true;

    try {
      const data = await userAndDeptSearch(keyword, corpid);
      const userlist = data.userlist ? data.userlist : [];
      const deptlist = data.department ? data.department : [];

      runInAction(() => {
        this.searchUserList = userlist;
        this.searchDeptList = deptlist;
        this.fetchUserAndDeptPending = false;
      });
    } catch (error) {
      runInAction(() => {
        this.fetchUserAndDeptPending = false;
      });
    }
  }

  @action.bound
  async fetchMyDepartment(idArr) {
    this.fetchMyDepartmentPending = true;

    try {
      const data = await listAll(idArr, '', 1);
      //console.log('fetchMyDepartment:', data);

      let depts = [];
      if (data.length > 0) {
        data.forEach((company, index) => {
          const innerDepts = company.department;
          // 可能会有好多 parentid 为 0 的

          let roots = innerDepts.filter(item => item.parentid === 0);

          // roots.forEach(root => {
          //   // root.level = 1;
          //   root.children = parseChild(root, innerDepts, 'my');
          // });

          // depts.push({
          //   id: idArr[index],
          //   depts: roots
          // });

          this.myDepts.push({
            id: idArr[index],
            depts: roots
          });
        })
      }

      runInAction(() => {
        this.fetchMyDepartmentPending = false;
      });
    } catch (error) {
      runInAction(() => {
        this.fetchMyDepartmentPending = false;
      });
    }
  }

  /*@action.bound
  async fetchMyGroupList() {
    this.fetchMyGroupListPending = true;
    
    try {
     const user = getCurrentUser();
     const { grouplist } = await listByUser(user.base_user_id);
    
     runInAction(() => {
       grouplist.forEach(group => {
         this.utilStore.dbStore.groupCache.set(group.groupid, group)
       });
    
       this.fetchMyGroupListPending = false;
     });
    } catch (err) {
     message.error('获取我的群组失败了~');
     console.log(err);
    
     runInAction(() => {
       this.fetchMyGroupListPending = false;
     });
    }
  }*/

}
