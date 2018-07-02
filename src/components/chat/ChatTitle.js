import React, { Component } from "react";
import { inject, observer } from 'mobx-react';

import { Icon, Tooltip } from "antd";

import OliAvatar from "../common/Avatar";
import OliBlock from "../common/prop/Block";
import OliSimpleSpan from "../common/prop/SimpleSpan";

import CompanyAndPosi from "../common/CompanyAndPosi";

import GroupMemberModal from './GroupMemberModal';

import { SearchHistory, HistoryContent } from '../common'
import { getCurrentUser } from '../../lowdb';

@inject(stores => ({
  homeStore: stores.homeStore,
  chatStore: stores.chatStore,
  dbStore: stores.dbStore,
  contactStore: stores.contactStore,
}))
@observer
export default class ChatTitle extends Component {

  handleClickPhone = () => {
    // 这里要弹出音视频的界面，并且自动调用 agora 的接口，连入 channel，
    // 还要发出链接视频的通知,好像需要自己做
    // ipcRenderer.on('modal-opened', (event, arg) => {
    //   console.log('render:', arg);
    // });

    const {
      currentChatPerson,
    } = this.props.chatStore;

    const Electron = window.require('electron');
    const { ipcRenderer } = Electron;

    ipcRenderer.send('open-modal', {
      modalName: 'video',
      currentChatPerson
    });
  };

  handleClickSetting = () => {
    const {
      openDrawer,
      currentChatPerson
    } = this.props.chatStore;

    openDrawer();
    if (currentChatPerson.isGroup) {
      this.props.dbStore.getGroupInfo(currentChatPerson.id);
    }
  };

  handleJoinChat = () => {
    const {
      showAddPersonToGroupModal
    } = this.props.chatStore;

    showAddPersonToGroupModal();
  };

  handleCancelCreateGroup = () => {
    const {
      hideAddPersonToGroupModal,
    } = this.props.chatStore;

    hideAddPersonToGroupModal();
  };

  renderMsgHistory = () => {
    const { showHistory, handleFindHistoryClick } = this.props.chatStore;
    return (
    <div style={{'display': 'inline-block'}}>
      <Tooltip placement='bottom' title='聊天记录'>
        <i className="iconHistory icon-history1" onClick={handleFindHistoryClick}/>
      </Tooltip>
      <SearchHistory
        contentClassName="search-history-modal"
        title="历史消息"
        visible={showHistory}
        onCancel={() => handleFindHistoryClick(1)}
      >
        <HistoryContent />
      </SearchHistory>
    </div>
    )
  };

  async handleSubmitCreateGroup(values, idList) {
    let { name, avatar, type } = values;
    const { createGroup } = this.props.chatStore;

    createGroup({
      groupName: name,
      members: idList,
    });
  };

  render() {
    const { ug } = this.props;
    let type = ug.isGroup ? 'group' : 'user';
    let showPopover = !ug.isGroup && ug.id.substr(0, 2) !== 'a_' && ug.id.substr(0, 2) !== 's_';

    const {
      addPersonToGroupChatVisible,
      createGroupLoading
    } = this.props.chatStore;

    const {
      getSimpleUserInfo,
    } = this.props.dbStore;

    const currentUser = getCurrentUser();

    const deptOptions = {
      disabledKeys: [ currentUser.base_user_id, ug.id ]
    };

    const userByChat = ug.isGroup ? null : getSimpleUserInfo(ug.id);
    
    const checkedUsers = [ userByChat ];

    console.log(ug);

    return (
      <div className="chat-title">
        <div className='person-info'>
          <OliAvatar
            id={ug.id}
            size={35}
            type={type}
            popover={showPopover}
          />

          {
            ug.isGroup 
            ? (
              <div className='info'>
                <h1><OliSimpleSpan groupId={ug.id} prop="groupName" defaultValue={ug.groupName}/></h1>
              </div>
            ) : (
              <div className='info'>
                <h1><OliSimpleSpan userId={ug.id} prop="base_user_name" defaultValue={ug.name}/></h1>
                <OliBlock
                  id={ug.id}
                  type={'user'}
                  onCustomRender={(item) => {
                    return (
                      <CompanyAndPosi item={item} />
                    )
                  }}
                />
              </div>
            )
          }
          
        </div>
        <div className="operations">
          {this.renderMsgHistory()}
          { 
            !ug.isGroup && ug.id.substr(0, 2) !== 'a_' && ug.id.substr(0, 2) !== 's_' && 
              <Tooltip placement='bottom' title='添加新成员'>
                <Icon type="plus" onClick={this.handleJoinChat}/> 
              </Tooltip>
          }
          {
            // window.isElectron() && <Icon type="phone" onClick={this.handleClickPhone}/>
          }
          <Tooltip placement='bottom' title='设置'>
            <Icon type="ellipsis" onClick={this.handleClickSetting}/>
          </Tooltip>
        </div>
        
        {
          addPersonToGroupChatVisible ?
            <GroupMemberModal
              title="创建群聊"
              mode="create"
              count={1}
              deptTreeOptions={deptOptions}
              visible={addPersonToGroupChatVisible}
              formLoading={createGroupLoading}
              checkedUsers={checkedUsers}
              onSubmit={this.handleSubmitCreateGroup.bind(this)}
              onCancel={this.handleCancelCreateGroup}
            /> : null
        }
      </div>
    );
  }

}

ChatTitle.defaultProps = {
  avatar: {},
  name: '',
  ug: '', // user or group id, 可以用来显示
};
