import React, { Component } from "react";
import { inject, observer } from "mobx-react";
import { Button, Menu, Dropdown, Icon, Tag } from "antd";

import { GroupMemberType } from "../../common/types";
import OliAvatar from "../common/Avatar";

@inject(stores => ({
  dbStore: stores.dbStore,
  chatStore: stores.chatStore,
}))
@observer
export default class GroupMember extends Component {

  constructor(props) {
    super(props);

    this.state = {
      hover: false,
    }
  }

  handleRemoveMember = (event, data) => {
    this.props.chatStore
      .removeMemberFromGroup(data.groupid, [ data.base_user_id ]);
  };

  handleMouseEnter = () => {
    this.setState({
      hover: true
    });
  };

  handleMouseLeave = () => {
    this.setState({
      hover: false
    });
  };

  handleMenuClick = ({ key }) => {
    const {
      removeMemberFromGroup,
      cancelGroupManager,
      setGroupManager,
      transferGroupOwner
    } = this.props.chatStore;

    const { member, group } = this.props;
    const id = member.id;
    let groupId = group.groupId;

    switch (key) {
      case 'addAdmin':
        setGroupManager(groupId, [ id ]);
        break;

      case 'removeAdmin':
        cancelGroupManager(groupId, [ id ]);
        break;

      case 'removeMember':
        removeMemberFromGroup(groupId, [ id ]);
        break;

      case 'transfer':
        transferGroupOwner(groupId, [ id ]);
        break;

      default:
        break;
    }
  };

  render() {
    const { member, currentMemberType, isAdmin, isOwner } = this.props;
    const { hover } = this.state;

    const menu = (
      <Menu onClick={this.handleMenuClick}>
        {
          isOwner 
            && currentMemberType !== GroupMemberType.admin 
            && currentMemberType !== GroupMemberType.owner
              ? <Menu.Item key="addAdmin">设为管理员</Menu.Item>
              : ''
        }
        {
          isOwner && currentMemberType === GroupMemberType.admin
            ? <Menu.Item key="removeAdmin">移除管理员</Menu.Item>
            : ''
        }
        {
          currentMemberType !== GroupMemberType.owner
          && (isOwner || (isAdmin && currentMemberType !== GroupMemberType.admin))
            ? <Menu.Item key="removeMember">移出群组</Menu.Item>
            : ''
        }
        {
          isOwner && currentMemberType !== GroupMemberType.owner
            ? <Menu.Item key="transfer">转让群主</Menu.Item>
            : ''
        }
      </Menu>
    );

    return (
      <li
        key={member.id}
        ref={el => this.$root = el}
        onMouseEnter={this.handleMouseEnter}
        onMouseLeave={this.handleMouseLeave}
      >
        {
          hover 
            && (isOwner || isAdmin)          // 只有群主或者管理员有权限~
            && currentMemberType !== GroupMemberType.owner// 但是如果当前这个人是群主，也不能操作自己 
           ? (
             <Dropdown overlay={menu} getPopupContainer={() => this.$root}>
              <Button className="btn-member-operations">
                <Icon type="ellipsis"/>
              </Button>
            </Dropdown>
          ) : ''
        }
        {
          currentMemberType === GroupMemberType.owner
            ? <Tag className="owner-flag" color="orange">群主</Tag>
            : currentMemberType === GroupMemberType.admin
              ? <Tag className="owner-flag" color="cyan">管理员</Tag>
              : ''
        }
        <OliAvatar size={40} id={member.id} avatarMap={member.avatar}/>
        <p>{member.name}</p>
      </li>
    );
  }

}

GroupMember.defaultProps = {
  member: {},
  group: {},
  isOwner: false,
  isAdmin: false,
};
