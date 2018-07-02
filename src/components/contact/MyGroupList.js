import React, { Component } from "react";
import { inject, observer } from "mobx-react";
import { List, Alert, Spin } from "antd";

import OliAvatar from "../common/Avatar";
import { toJS } from "mobx";

//import { getGroups } from "../../lowdb/lowdbGroup";

@inject(stores => ({
  homeStore: stores.homeStore,
  contactStore: stores.contactStore,
  chatStore: stores.chatStore,
  utilStore: stores.utilStore,
  dbStore: stores.dbStore,
}))
@observer
export default class MyGroupList extends Component {

  renderGroupList = (item) => {
    const { type } = this.props;

    return (
      <List.Item
        onClick={() => {
          type === 'createGroup'
            ? this.handleOpenGroup(item) // 创建群组
            : this.handleForwardGroup(item);  // 通讯录中 我的群组列表，点击直接开始聊天
        }}
      >
        <OliAvatar size={34} avatarMap={item.avatar} popover={false}/>
        <div className='list-content'>
          <h3>{item.groupName}</h3>
          <h4>{item.groupMemberSize}人</h4>
        </div>
      </List.Item>
    )
  };

  handleOpenGroup = (item) => {
    // 获取群人员信息
    const { getGroupInfo } = this.props.dbStore;
    getGroupInfo(item.groupId);

    this.props.onGroupListItemClick(item.groupId);
  };

  handleForwardGroup = (item) => {
    const { forwardToChat } = this.props.utilStore;
    forwardToChat(item);
  };

  render() {
    console.log('[my group list] - render');

    const { className = '' } = this.props;
    const { myGroups, fetchMyGroupListPending } = this.props.chatStore;

    const myGroupListArray = toJS(myGroups);

    return (
      <div className={`group-list ${className}`}>
        {
          myGroupListArray.length > 0
            ? (
              <List
                dataSource={myGroupListArray}
                renderItem={item => this.renderGroupList(item)}
              />
            ) : fetchMyGroupListPending
              ? <Spin />
              : <Alert message="还没有群组~" type="info" showIcon/>
        }
      </div>
    )
  }
}

MyGroupList.defaultProps = {
  type: 'createGroup',
  onGroupListItemClick: () => { }
};