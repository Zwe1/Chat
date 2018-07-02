import React, { Component } from "react";
import { toJS } from "mobx";
import { inject, observer } from "mobx-react";
import _ from "lodash";
import classnames from "classnames";

import { getCurrentUser } from "../../lowdb";

import CompanyListTree from "../contact/CompanyListTree";
import DeptListTree from "../contact/DeptListTree";
import MyGroupList from "../contact/MyGroupList";
import MyGroupListItem from "../contact/MyGroupListItem";
import RecentChatList from "../contact/RecentChatList";
import MyGroupCheckboxList from "../contact/MyGroupCheckboxList";
import AvatarUpload from "../common/AvatarUpload";

import Scrollbars from "../common/scrollbar/SpringScrollbars";

import CreateGroupSearch from "../common/CreateGroupSearch";

import { Button, Modal, Row, Col, Form, Input, Menu, Tag, Radio, List, Checkbox, message, Spin } from "antd";
const FormItem = Form.Item;

@inject(stores => ({
  contactStore: stores.contactStore,
  chatStore: stores.chatStore,
  dbStore: stores.dbStore,
  homeStore: stores.homeStore,
}))
@observer
class GroupMemberModal extends Component {

  constructor(props) {
    super(props);

    const {
      companyExpandedKeys,
    } = this.props.contactStore;

    this.state = {
      editCount: props.count,
      count: props.count,
      uiMode: 'com',

      checkGroupId: '',

      checkedUsers: props.checkedUsers || [],

      companyExpandedKeys: toJS(companyExpandedKeys),

      // dept tree data
      currentDepts: [],
      deptExpandedKeys: [], // 默认展开的节点, 选中公司时 会产生
      deptCheckedKeys: {
        //'id': []
      },

      removedUser: null, // group list 需要删除的项

      checkPending: false,

      disabledKeys: props.deptTreeOptions.disabledKeys,
    };

    this.users = {};
  }

  componentWillReceiveProps(nextProps) {
    // 每次收到新的 count 都更新到 state
    if (this.props.count !== nextProps.count) {
      this.setState({
        editCount: nextProps.count
      });
    }
  }

  handleCancel = () => {
    this.props.onCancel()
  };

  /**
   * 关闭 tag
   *
   * @param removedUser
   */
  handleCloseTag = (removedUser) => {
    const {
      checkedUsers,
      count,
      disabledKeys,
    } = this.state;

    const { 
      selectValue,
      removedChecked,
      setRemovedChecked
    } = this.props.contactStore;

    const {
      changeUpdateBaseUserInfo
    } = this.props.dbStore;

    // 从 user 里面删掉
    let checkedUsersDummy = checkedUsers.filter(user => {
      if (user.base_user_id) {
        return user.base_user_id !== removedUser.base_user_id;
      } else {
        return user.id !== removedUser.id;
      }
    });

    let disFlag = false;

    const dis = disabledKeys.filter(v => {
      if (v !== removedUser.base_user_id || v !== removedUser.id) {
        return true;
      } else {
        disFlag = true;
        return false;
      }
    });

    this.setState({
      checkedUsers: checkedUsersDummy,
      count: count - 1,
      editCount: count - 1,
      removedUser,
      disabledKeys: dis,
    });

    if (disFlag) {
      return;
    }

    removedChecked.push(`${selectValue}-u-${removedUser.base_user_id}`);
    setRemovedChecked(removedChecked);
    changeUpdateBaseUserInfo();
  };

  handleCompanyOpen = (openKeys) => {
    this.setState({
      companyExpandedKeys: openKeys
    });
  };

  handleMenuItemSelect = (selectedKeys, list, ids) => {
    const {
      setSelectCompanyId,
      setdeptTreeRootClick,
      setDeptTreeSingleClick,
      setSelectValue,
      setSelectedCompanyKeys,
    } = this.props.contactStore;

    const {
      fetchAllGroups,
    } = this.props.chatStore;

    let key = selectedKeys[ 0 ];

    if (key === 'group') {
      fetchAllGroups();
      this.setState({
        uiMode: 'groupList'
      });

      return;
    }

    if (key === 'recent-chat') {
      this.setState({
        uiMode: 'recentChat'
      });

      return;
    }

    // 1. 进入部门列表和人员列表，切换显示模式、
    // uiMode
    // 选中的这个公司的
    const companyId = selectedKeys[ 0 ].split('-')[ 0 ];
    setSelectCompanyId(companyId);

    setSelectedCompanyKeys(selectedKeys);
    setdeptTreeRootClick(true);  // 是否需要点击树结构的根节点
    setDeptTreeSingleClick(true);
    setSelectValue(0); // 设置部门下拉框为第一个

    this.setState({
      uiMode: 'dept',
      currentDepts: list,
      deptExpandedKeys: ids.map(v => `${v}`)
    });
  };

  setCheckedKeys(checkedKeysParam) {
    const { 
      selectValue,
      selectCompanyId,
      selectCompanyType
    } = this.props.contactStore;

    const { 
      deptCheckedKeys 
    } = this.state;

    let deptCheckedKeysDummy = _.cloneDeep(deptCheckedKeys);

    let key = '';

    switch(selectCompanyType) {
      case 0:
        key = 'all';
        break;
      case 1:
        key = 'my';
        break;
      case 2:
        key = 'regroup';
        break;
      case 3:
        key = 'subordinate';
        break;
      default:
        key = '';
        break;
    }

    // 分公司，分组织结构和我的部门，分select的值存储checked
    const company = `${selectCompanyId}-${key}`;

    if (deptCheckedKeysDummy[ company ]) {
      deptCheckedKeysDummy[ company ][ selectValue ] = checkedKeysParam;
    } else {
      deptCheckedKeysDummy[ company ] = {};
      deptCheckedKeysDummy[ company ][ selectValue ] = checkedKeysParam;
    }

    this.setState({
      deptCheckedKeys: deptCheckedKeysDummy
    });
  }

  setCheckedUsers(checkedUsers) {
    this.setState({
      checkedUsers
    });
  }

  setCount(count) {
    this.setState({
      count: this.state.editCount + count
    });
  }

  // search结果
  handleSearchCheckedUser = user => {
    const { 
      checkedUsers,
      count,
      disabledKeys,
    } = this.state;

    const {
      selectValue,
    } = this.props.contactStore;

    const {
      mode,
    } = this.props;

    const checkedUsersDummy = toJS(checkedUsers);

    for (let item of checkedUsersDummy) {
      if (item.id === user.id) {
        message.error('不能重复选择哦~');
        return;
      }
    }

    const loginUser = getCurrentUser(); // 获取当前登录的用户

    if (loginUser.base_user_id === user.id && mode !== 'send-person-card') {
      message.error('不能重复选择哦~');
      return
    }

    checkedUsersDummy.push(user);

    const dis = _.cloneDeep(disabledKeys);
    dis.push(user.id);

    this.setState({
      disabledKeys: dis,
    });

    this.setCheckedUsers(checkedUsersDummy);
    this.setState({
      count: count + 1,
    })
  };

  handleDUCheck = async (checkedKeysParam, item, e) => {
    const { maxCount, mode } = this.props;
    const { checkedUsers, count } = this.state;
    const { selectCompanyId, fetchUsersByDept } = this.props.contactStore;

    const {
      msgToken,
    } = this.props.homeStore;

    const finalMaxCount = msgToken.group_limit || maxCount;

    item = toJS(item);

    let isUser = 'base_user_id' in item;

    let afterMerge = [];

    if (e.checked) {
      // 选中状态
      let countDummy = count + (isUser ? 1 : item.total_count );

      if (countDummy > finalMaxCount) {
        // 数量超了
        message.error(`${mode === 'send-person-card' ? '同时发送名片' : '群聊'}人数不能超过 ${finalMaxCount} ~`);
        return false;
      }

      this.setCheckedKeys(checkedKeysParam);

      let checkedUsersDummy = toJS(checkedUsers);

      if (isUser) { // 用户 添加当前用户
        checkedUsersDummy.push(item);
        afterMerge = checkedUsersDummy;
      } else { // 部门
        if (this.users[`${selectCompanyId}-${item.id}${item.groupid ? `-${item.groupid}` : ''}`]) {
          afterMerge = _.uniqBy([...checkedUsersDummy , ...this.users[`${selectCompanyId}-${item.id}${item.groupid ? `-${item.groupid}` : ''}`]], 'base_user_id');
        } else {
          this.setState({
            checkPending: true,
          });

          await fetchUsersByDept(selectCompanyId, item.id).then(data => {
            if (data && data.department && data.department.length > 0) {
              let nowUsers = []; // 存储当前这个部门的人数

              const loginUser = getCurrentUser(); // 获取当前登录的用户

              data.department.map(v => {
                v.userlist && v.userlist.length > 0 && v.userlist.map(user => {
                  if (user.base_user_id === loginUser.base_user_id) { // 选中的和当前登录用户一致，不添加
                    return;
                  }
                  checkedUsersDummy.push(user);
                  nowUsers.push(user);
                });
              });
              afterMerge = _.uniqBy(checkedUsersDummy, 'base_user_id');
              this.users[`${selectCompanyId}-${item.id}${item.groupid ? `-${item.groupid}` : ''}`] = nowUsers;
              this.setState({
                checkPending: false,
              });
            }
          });
        }
      }

    } else {
      // 取消选中
      // 取消选中时，不需要判断人数，直接取消
      this.setCheckedKeys(checkedKeysParam);
      let checkedUsersDummy = toJS(checkedUsers);

      if (isUser) {
        // 取消选中一个人
        afterMerge = checkedUsersDummy.filter(u => u.base_user_id !== item.base_user_id);
      } else {
        // 取消选中一个部门
        let users = [];
        if (this.users[`${selectCompanyId}-${item.id}${item.groupid ? `-${item.groupid}` : ''}`]) {
          users = this.users[`${selectCompanyId}-${item.id}${item.groupid ? `-${item.groupid}` : ''}`];
        } else {
          this.setState({
            checkPending: true,
          });
          await fetchUsersByDept(selectCompanyId, item.id).then(data => {
            if (data && data.department && data.department.length > 0) {
              data.department.map(v => {
                v.userlist && v.userlist.length > 0 && v.userlist.map(user => {
                  users.push(user);
                });
              });
              this.users[`${selectCompanyId}-${item.id}${item.groupid ? `-${item.groupid}` : ''}`] = users;
              this.setState({
                checkPending: false,
              });
            }
          });
        }
        afterMerge = _.differenceBy(checkedUsersDummy, users, 'base_user_id');
      }
    }

    this.setCheckedUsers(afterMerge);
    this.setCount(afterMerge.length);
  };

  handleBackClick = () => {
    switch (this.state.uiMode) {
      case 'groupMember': // 群组成员列表，返回到群组列表
        this.setState({
          uiMode: 'groupList',
        });
        break;

      default:
        // 剩余情况都是返回到功能及公司列表
        this.setState({
          uiMode: 'com',
        });
    }
  };

  handleAvatarUploadSuccess = (id) => {
    const { setFieldsValue } = this.props.form;
    setFieldsValue({ 'avatar': id });
  };

  handleSubmit = () => {
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

      const { checkedUsers } = this.state;
      let memberlist = checkedUsers.map(user => user.base_user_id);

      let dummy = '';
      if (checkedUsers.length > 10) {
        dummy = checkedUsers.slice(0, 9).map(user => user.base_user_name).join(',');
      } else {
        dummy = checkedUsers.map(user => user.base_user_name).join(',');
      }

      dummy = dummy.substring(0, 20);
      if (!values.name) {
        values.name = dummy;
      }

      this.props.onSubmit(values, memberlist, checkedUsers);
    });
  };

  // 我的群组某一群组点击
  handleGroupListItemClick = id => {
    this.setState({
      uiMode: 'groupMember',
      checkGroupId: id,
    });
  };

  renderMyGroupCheckboxList = () => {
    const {
      checkedUsers,
      count,
      removedUser,
    } = this.state;

    const {
      maxCount
    } = this.props;

    const {
      msgToken,
    } = this.props.homeStore;

    const finalMaxCount = msgToken.group_limit || maxCount;

    return (
      <MyGroupCheckboxList
        maxCount={finalMaxCount}
        checkedUsers={checkedUsers}
        count={count}
        removedUser={removedUser}
        setCheckedUsers={this.setCheckedUsers.bind(this)}
        setCount={this.setCount.bind(this)}
      />
    );
  };

  renderRecentChat = () => {
    const {
      checkedUsers,
      count,
      removedUser,
    } = this.state;

    const {
      maxCount
    } = this.props;

    const {
      msgToken,
    } = this.props.homeStore;

    const finalMaxCount = msgToken.group_limit || maxCount;

    return (
      <RecentChatList
        maxCount={finalMaxCount}
        checkedUsers={checkedUsers}
        count={count}
        removedUser={removedUser}
        setCheckedUsers={this.setCheckedUsers.bind(this)}
        setCount={this.setCount.bind(this)}
      />
    );
  };

  renderMyGroupListItem = () => {
    const {
      checkedUsers,
      count,
      removedUser,
      checkGroupId,
    } = this.state;

    const {
      groupCache,
    } = this.props.dbStore;

    const group = groupCache.get(checkGroupId);
    const pending = group.loading;

    const {
      maxCount
    } = this.props;

    const {
      msgToken,
    } = this.props.homeStore;

    const finalMaxCount = msgToken.group_limit || maxCount;

    return (
      <MyGroupListItem
        maxCount={finalMaxCount}
        checkedUsers={checkedUsers}
        count={count}
        removedUser={removedUser}
        groupInfoToCreate={group}
        pending={pending}
        setCheckedUsers={this.setCheckedUsers.bind(this)}
        setCount={this.setCount.bind(this)}
      />
    );
  };

  // 常用组的数据转化
  groupDataConversion = (key, name, list) => {
    const { selectCompanyId } = this.props.contactStore;

    let finalObj = {
      id: key,
      name,
    };

    let users = [];

    const loginUser = getCurrentUser(); // 获取当前登录的用户

    for (let item of list) {
      let user = [];
      if (item.group_user && item.group_user.department && item.group_user.department.length > 0) {
        for (let depts of item.group_user.department) {
          depts.children = [...depts.userlist];
          user = [...user, ...depts.userlist];
        }
      }

      item.children = [...item.group_user.userlist, ...item.group_user.department];
      user = [...user, ...item.group_user.userlist];

      user = user.filter(v => v.base_user_id !== loginUser.base_user_id);

      users = [...users, ...user];

      this.users[`${selectCompanyId}-${item.groupid}${item.groupid ? `-${item.groupid}` : ''}`] = user;
    }

    this.users[`${selectCompanyId}-${key}`] = users;

    finalObj.children = list;

    return [ finalObj ];
  };

  renderRightContent() {
    const {
      companyExpandedKeys,
      uiMode,
    } = this.state;

    const {
      companysTreeData,
    } = this.props.contactStore;

    const { mode } = this.props;

    let extraMenus = [
      <Menu.Item className='my-group com-extra-menu' key='group'>
        <span>我的群组</span>
      </Menu.Item>
    ];

    if (mode === 'redirect') {
      extraMenus.push(
        <Menu.Item className='recent-chat com-extra-menu' key='recent-chat'>
          <span>最近聊天</span>
        </Menu.Item>
      );
    }

    return (
      <Scrollbars
        renderTrackHorizontal={null}
      >
        {
          uiMode === 'com' && (
            <CompanyListTree
              treeData={companysTreeData}
              openKeys={companyExpandedKeys}
              onOpen={this.handleCompanyOpen}
              onSelect={this.handleMenuItemSelect}
              extraMenus={extraMenus}
            />
          )
        }
        {
          uiMode !== 'com' && (
            <div className="dept-tree-wrapper">
              <Button className="back" icon="left" onClick={this.handleBackClick}/>
              {
                uiMode === 'dept' && this.renderDeptListTree()
              }
              {
                (uiMode === 'groupList' && mode !== 'redirect') && (
                  <Scrollbars
                    renderTrackHorizontal={null}
                  >
                    <MyGroupList
                      type="createGroup"
                      onGroupListItemClick={this.handleGroupListItemClick}
                    />
                  </Scrollbars>
                )
              }
              {
                (uiMode === 'groupList' && mode === 'redirect') && this.renderMyGroupCheckboxList()
              }
              {
                uiMode === 'groupMember' && this.renderMyGroupListItem()
              }
              {
                (uiMode === 'recentChat' && mode === 'redirect') && this.renderRecentChat()
              }
            </div>
          )
        }
      </Scrollbars>
    );
  };

  renderDeptListTree = () => {
    const {
      currentDepts,
      deptExpandedKeys,
      deptCheckedKeys,
      disabledKeys,
    } = this.state;

    const { 
      selectCompanyType,
    } = this.props.contactStore;

    if (selectCompanyType !== 2) {
      return (
        <DeptListTree
          checkable={true}
          showCount={true}
          disabledKeys={disabledKeys}
          deptData={currentDepts}
          checkedKeys={deptCheckedKeys}
          defaultExpandedKeys={deptExpandedKeys}
          onCheck={this.handleDUCheck}
        />
      )
    } else {
      let commonList = [];
      let ownedList = [];

      currentDepts && currentDepts.length > 0 && currentDepts.map(v => {
        commonList = this.groupDataConversion('commonList', '公有组', toJS(v.commonList));
        ownedList = this.groupDataConversion('ownedList', '私有组', toJS(v.ownedList));
      });

      return (
        <Scrollbars
          className='dept-tree-scroll dept-tree-normal-scroll'
          renderTrackHorizontal={null}
        >
          <div className='commonGroup'>
            <DeptListTree
              checkable={true}
              showCount={true}
              disabledKeys={disabledKeys}
              deptData={commonList}
              checkedKeys={deptCheckedKeys}
              defaultExpandedKeys={deptExpandedKeys}
              onCheck={this.handleDUCheck}
              type='no-scroll'
            />
            {ownedList && ownedList.children && ownedList.children.length > 0 && <DeptListTree
              checkable={true}
              showCount={true}
              disabledKeys={disabledKeys}
              deptData={ownedList}
              checkedKeys={deptCheckedKeys}
              defaultExpandedKeys={deptExpandedKeys}
              onCheck={this.handleDUCheck}
            />}
          </div>
        </Scrollbars>
      )
    }
  }

  renderForm = () => {
    const { getFieldDecorator } = this.props.form;
    const { formLoading, showForm, maxCount, mode } = this.props;
    const { count, editCount } = this.state;

    const {
      msgToken,
    } = this.props.homeStore;

    const finalMaxCount = msgToken.group_limit || maxCount;

    const formItemLayout = {
      labelCol: {
        sm: { span: 4 },
      },
      wrapperCol: {
        sm: { span: 18 },
      },
    };

    return (
      <Form className="chat-meta-form">
        {
          showForm && mode !== 'send-person-card' ?
            <Row>
              <Col span={24}>
                <FormItem
                  {...formItemLayout}
                  label="名称"
                >
                  {getFieldDecorator("name")(<Input placeholder="群聊名称 (可选)"/>)}
                </FormItem>
              </Col>
            </Row> : null
        }

        <FormItem wrapperCol={{ sm: { span: 16, offset: 4 } }}>
          <Button
            loading={formLoading}
            type="primary"
            size="large"
            style={{ marginRight: 10 }}
            htmlType="button"
            disabled={count === 0}
            onClick={this.handleSubmit}
          >确定 ({count} / {finalMaxCount})</Button>
          <Button type="ghost" onClick={this.handleCancel}>取消</Button>
        </FormItem>
      </Form>
    );
  };

  // render自己的tag
  renderCurrentUserTag() {
    const user = getCurrentUser();

    const key = user.base_user_id ? user.base_user_id : '';
    const name = user.base_user_name ? user.base_user_name : '';
    const color = "cyan";

    return (
      <Tag
        className="tag-user"
        closable={false}
        key={key}
        color={color}
      >
        {name}
      </Tag>
    )
  }

  renderModal() {
    const {
      checkedUsers,
      uiMode,
      checkPending,
    } = this.state;

    let {
      mode,
      title,
      showForm,
      visible,
    } = this.props;

    const me = getCurrentUser();

    let tagWrapperClass = classnames({
      'tag-input-wrapper': true,
      'no-form': !showForm,
      'send-person-card-wrapper': mode === 'send-person-card',
    });

    let $root = document.body;
    if ('getPopupContainer' in this.props) {
      $root = this.props.getPopupContainer();
    } 

    return (
      <Modal
        title={title}
        cancelText="取消"
        okText="确定"
        maskClosable={false}
        onCancel={this.handleCancel}
        getPopupContainer={() => $root}
        footer={null}
        width={768}
        visible={visible}
        maskStyle={{
          backgroundColor: 'rgba(0, 0, 0, 0.4)'
        }}
        bodyStyle={{
          height: 486,
          padding: 10
        }}
        style={{
          top: 50
        }}
      >
        <Row className="create-dialog-row">
          <Col className="left" span={14}>
            <div className='member-modal-search'>
              <CreateGroupSearch 
                handleSearchCheckedUser={this.handleSearchCheckedUser}
              />
            </div>
            <div className={tagWrapperClass}>
              <Scrollbars
                renderTrackHorizontal={null}
              >
                { (mode !== 'send-person-card' && mode !== 'redirect') ? this.renderCurrentUserTag() : null }
                {checkedUsers.map(tag => {
                  let key = tag.base_user_id ? tag.base_user_id : tag.id;
                  let name = tag.base_user_name ? tag.base_user_name : tag.name ? tag.name : '';
                  let color = '#108ee9';
                  return (
                    <Tag
                      className="tag-user"
                      color={color}
                      key={key}
                      closable={true}
                      afterClose={() => this.handleCloseTag(tag)}
                    >
                      {name}
                    </Tag>
                  );
                })}
              </Scrollbars>
            </div>
            { this.renderForm() }
          </Col>
          <Col className="right" span={10}>
            {this.renderRightContent()}
          </Col>
        </Row>
        {checkPending ? <div className='check-pending'><Spin /></div> : null}
      </Modal>
    );
  }

  render() {
    const { visible } = this.props;
    return visible ? this.renderModal() : ''
  }

}

GroupMemberModal.defaultProps = {
  visible: false,
  title: '',
  /**
   * edit 编辑群
   * create 创建群
   * redirect 转发信息选人
   * send-person-card 发送名片 隐藏本身的tag，
   */
  mode: 'create', // create, redirect, send-person-card

  // getPopupContainer: () => this.$root,

  showForm: true,
  formLoading: false,
  checkedUsers: [],

  // modal 上边距
  top: 50,

  maxCount: 999,
  count: 0,

  // 需要一个提交的方法，否则一切白写了。
  onSubmit: () => { },
  onCancel: () => { },

  // comTreeOptions: {
  //   data: [],
  //   openKeys: [],
  //   onOpen: () => {},
  //   onSelect: () => {},
  // },

  /**
   * 关键是传递进来的 checkedKeys 能不能按公司分开，
   */
  deptTreeOptions: {
    //data: {},
    //defaultExpandKeys: [],
    // 这个也是被选中的 keys
    //checkedKeys: {},
    // 每个企业下面选中的人，这一次就不能被取消也不能被选中了

    disabledKeys: [],

    //onCheck: () => {},
    //onSelect: () => {},
    //onExpand: () => {},
  },
};

export default Form.create()(GroupMemberModal);
