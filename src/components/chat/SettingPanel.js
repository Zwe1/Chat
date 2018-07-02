import React, { Component } from "react";
import { inject, observer } from "mobx-react";
import { GroupMemberType, GroupStatus } from "../../common/types";
import { Icon, Tag, Modal, Input } from "antd";
import { ContextMenu, MenuItem, ContextMenuTrigger } from "react-contextmenu";
import OliAvatar from "../common/Avatar";
import { getCurrentUser, getCurrentBaseUrl } from "../../lowdb";
import GroupMemberModal from "./GroupMemberModal";
import GroupMember from "./GroupMember";
import GroupSetting from "../common/GroupSetting";
import OliList from "../common/prop/List";
import SwitchSettingItem from './SwitchSettingItem';
import LinkSettingItem from './LinkSettingItem';

import AvatarUpload from '../common/AvatarUpload';
import { buildMediaUrl } from "../../services/media";

@inject(stores => ({
  dbStore: stores.dbStore,
  chatStore: stores.chatStore,
  contactStore: stores.contactStore,
}))
@observer
export default class SettingPanel extends Component {

  $root;

  constructor(props) {
    super(props);
    this.state = {
      groupSettingVisible: false,
      uiMode: 'view'
    }
  }

  handleExitGroup = () => {
    console.log('handleExitGroup');

    const {
      exitFromGroup,
      currentChatPerson,
    } = this.props.chatStore;

    Modal.confirm({
      title: '确定退出群聊吗?',
      content: '退出后就通知群主，且不会再接受此群聊信息~',
      okType: 'danger',
      iconType: '',
      // getPopupContainer: () => this.$root,
      okText: '退出群聊',
      cancelText: '取消',
      onOk: () => {
        exitFromGroup(currentChatPerson.id);
      }
    });
  };

  /**
   * 添加人员
   */
  handleClickPlus = () => {
    // 管理当前群
    // 1. 获取此群所有人
    // 2. 按照公司列出来
    //
    const {
      showEditGroupModal,
    } = this.props.chatStore;

    showEditGroupModal();
  };

  /**
   * 打开搜索界面
   */
  handleClickSearch = () => {

  };

  handleSubmitEditGroup = (values, idList) => {
    console.log('edit group submit');

    const {
      addMemberToGroup,
      currentChatPerson,
    } = this.props.chatStore;

    addMemberToGroup(currentChatPerson.id, idList)
  };

  handleCancelEditGroup = () => {
    const {
      hideEditGroupModal,
    } = this.props.chatStore;

    hideEditGroupModal();
  };

  handleEditGroup = () => {
    this.handleGroupSettingModal('groupSettingVisible', true);
  };

  handleGroupSettingModal = (key, visible) => {
    this.setState({
      [key]: visible
    });

    this.props.chatStore.closeDrawer();
  };

  getMemberType(id, group) {
    if (group.owners && group.owners.indexOf(id) > -1) {
      return GroupMemberType.owner;
    }

    if (group.managers && group.managers.indexOf(id) > -1) {
      return GroupMemberType.admin;
    }

    return GroupMemberType.member;
  }

  $groupName;

  changeToEditMode = () => {
    this.setState({
      uiMode: 'edit'
    });
  }

  /**
   * 修改群名称
   */
  handleSubmitGroupName = () => {
    let name = this.$groupName.input.value;
    console.log('edit group name:', name);
    
    if (!name) {
      return;
    }

    name = name.trim();
    name = name.substring(0, 128);// 截取一段， 太长也看不到。
    const {
      currentChatPerson,
      changeGroupName
    } = this.props.chatStore;

    changeGroupName(currentChatPerson.id, name);
  };

  /**
   * 修改群头像
   */ 
  handleAvatarUploadSuccess = (id) => {
    console.log('upload group avatar success:', id);
    const {
      currentChatPerson,
      changeGroupAvatar
    } = this.props.chatStore;

    changeGroupAvatar(currentChatPerson.id, id);
  }

  handleGroupNameBlur = () => {
    console.log('group name inpt blur');
    this.setState({
      uiMode: 'view'
    })
  };

  handleNotiChange = (checked) => {
    console.log('noti checked change:', checked);
    const {
      currentChatPerson,
      setDisturbStatus
    } = this.props.chatStore;

    setDisturbStatus(currentChatPerson);
  };

  handleTopChange = (checked) => {
    console.log('top checked change:', checked);    
    const {
      currentChatPerson,
      setToTop
    } = this.props.chatStore;

    setToTop(currentChatPerson);
  };

  handleEmptyClick = () => {
    console.log('empty history click');
    const {
      currentChatPerson,
      clearMessages
    } = this.props.chatStore;

    clearMessages(currentChatPerson);
  };

  handleDeleteClick = () => {
    const {
      currentChatPerson,
      chatList,
      deletePersonFromChatList
    } = this.props.chatStore;

    for (let i = 0; i < chatList.length; i++) {
      const dummy = chatList[i];
      if (dummy.id === currentChatPerson.id) {
        deletePersonFromChatList(i, currentChatPerson);
        return;
      }
    }
  };

  renderMemebers(group) {
    const currentUser = getCurrentUser();
    const memberType = this.getMemberType(currentUser.base_user_id, group);
    const isOwner = memberType === GroupMemberType.owner;
    const isAdmin = memberType === GroupMemberType.admin;

    const memberList = group.members;
    return (
      <OliList
        ids={memberList}
        onCustomRender={members => {
          return (
            <ul className="member-list">
              {
                members.length === 0
                  ? <li className="empty-hint">没有人~</li>
                  : members.map(member => {
                    let currentMemberType = this.getMemberType(member.id, group);

                    return (
                      <GroupMember
                        key={member.id}
                        currentMemberType={currentMemberType}
                        group={group}
                        member={member}
                        isOwner={isOwner}
                        isAdmin={isAdmin}
                      />
                    );
                  })
              }
            </ul>
          );
        }}
      />
    );
  }

  renderAvatarSetting(group) {
    const {
      groupSettingVisible,
      uiMode 
    } = this.state;

    const currentUser = getCurrentUser();
    const memberType = this.getMemberType(currentUser.base_user_id, group);
    const isOwner = memberType === GroupMemberType.owner;
    const isAdmin = memberType === GroupMemberType.admin;

    let groupAvatar = group.avatar;
    if (!groupAvatar) {
      groupAvatar = {
        default: '/common/images/group_default.png'
      };
    }

    const baseUrl = getCurrentBaseUrl();
    let avatarUrl = groupAvatar.media_id 
        ? buildMediaUrl(groupAvatar.media_id) 
        : baseUrl + groupAvatar.default;

    return (
      <li className="setting-item">
        <div className="avatar-meta">
          {
            isOwner || isAdmin 
              ? (
                <AvatarUpload
                  uploadSuccess={this.handleAvatarUploadSuccess}
                  url={avatarUrl}
                  size={60}
                />
              )
              : (
                <OliAvatar size={50} avatarMap={groupAvatar} popover={false}/>
              )
          }

          {
            uiMode === 'edit' && (
              <div className="setting-group-title">
                <Input 
                  autoFocus
                  size="small"
                  ref={el => this.$groupName = el} 
                  defaultValue={group.groupName} 
                  onPressEnter={this.handleSubmitGroupName} 
                  onBlur={this.handleGroupNameBlur}
                  style={{
                    width: 180
                  }}
                /> 
              </div>
            )
          }

          {
            uiMode === 'view' && (
              <div className="setting-group-title">
                <h1 className="title">{group.groupName}</h1>
                { (isAdmin || isAdmin) && <Icon type="edit" onClick={this.changeToEditMode}/> }
              </div>
            )
          }
        </div>
      </li>
    );
  }

  render() {
    const {
      groupSettingVisible,
    } = this.state;

    const { 
      groupCache 
    } = this.props.dbStore;

    const {
      drawerOpen,
      currentChatPerson,
      chatListTopList,
      chatListDisturbList,
      editGroupVisible,
      editGroupLoading,
    } = this.props.chatStore;

    const isGroup = currentChatPerson.isGroup;
    const isDisturb = chatListDisturbList.indexOf(currentChatPerson.id) > -1;
    const isTop = currentChatPerson.isTop;

    const currentUser = getCurrentUser();
    const group = groupCache.get(currentChatPerson.id) || {};

    const memberType = this.getMemberType(currentUser.base_user_id, group);
    const isOwner = memberType === GroupMemberType.owner;
    const isAdmin = memberType === GroupMemberType.admin;

    const memberList = group.members || [];
    const deptTreeOptions = {
      disabledKeys: memberList
    };

    return (
      <ul ref={el => this.$root = el} >
        { isGroup && this.renderAvatarSetting(group) }

        {
          isGroup &&
            <li className="setting-item">
              <div className="member-meta">
                <h2>群成员 {memberList.length} 人</h2>
                <div className="operations">
                  <Icon type="plus" onClick={this.handleClickPlus}/>
                  <Icon type="search" onClick={this.handleClickSearch}/>
                  {
                    editGroupVisible &&
                      <GroupMemberModal
                        title="群组管理"
                        mode="edit"
                        showForm={false}
                        count={memberList.length}
                        visible={editGroupVisible}
                        formLoading={editGroupLoading}
                        getPopupContainer={() => this.$root}
                        deptTreeOtiopns={ deptTreeOptions }
                        onSubmit={this.handleSubmitEditGroup}
                        onCancel={this.handleCancelEditGroup}
                      />
                  }
                </div>
              </div>
              {
                memberList.length > 0 && drawerOpen 
                  && this.renderMemebers(group, memberList)
              }
            </li>
        }

        <SwitchSettingItem
          label="新消息通知"
          checked={!isDisturb}
          onChange={this.handleNotiChange}
        />
        
        <SwitchSettingItem 
          checked={isTop}
          label="置顶会话"
          onChange={this.handleTopChange}
        />
        
        <LinkSettingItem label="删除会话" onClick={this.handleDeleteClick}/>
        {/* <LinkSettingItem label="清空聊天记录" onClick={this.handleEmptyClick}/> */}
        
        {
          isGroup && <LinkSettingItem onClick={this.handleExitGroup} label="退出群聊"/>
        }

        {
          isGroup &&
            <GroupSetting 
              visible={groupSettingVisible}
              handleModal={this.handleGroupSettingModal} 
              group={group}
            />
        }
      </ul>
    );
  }

}
