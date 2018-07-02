import React, { Component } from 'react';
import { Icon, Tooltip } from 'antd';
import { toJS } from 'mobx';
import { inject, observer } from 'mobx-react';

import FaPlusSquareO from 'react-icons/lib/fa/plus-square-o';
import GroupMemberModal from '../chat/GroupMemberModal';
import { getCurrentUser } from '../../lowdb';

@inject(stores => ({
  contactStore: stores.contactStore,
  chatStore: stores.chatStore,
}))
@observer
export default class GlobalOperations extends Component {

  constructor(props) {
    super(props);
  }

  handleCreateClick = () => {
    const {
      showCreateGroupModal,
    } = this.props.chatStore;

    showCreateGroupModal();
  };

  handleCancelCreateGroup = () => {
    const {
      hideCreateGroupModal,
    } = this.props.chatStore;

    hideCreateGroupModal();
  };

  handleSubmitCreateGroup(values, idList) {
    console.log('submit form.');

    let { name, avatar, type } = values;
    const { createGroup } = this.props.chatStore;

    createGroup({
      groupName: name,
      //groupIconUrl: avatar,
      //grouptype: type,
      members: idList,
    });
  };

  render() {
    let currentUser = getCurrentUser();

    let deptOptions = {
      disabledKeys: [ currentUser.base_user_id ]
    };

    const {
      createGroupVisible,
      createGroupLoading,
    } = this.props.chatStore;

    const {
      icon,
      btnName,
    } = this.props;

    return (
      <div className="global-operations">
        <Tooltip placement='bottom' title={<div>{btnName}</div>} overlayClassName='title-btn-tooltip'>
          {
            icon ?
              <img className='img-operations' src={icon} onClick={this.handleCreateClick}/> :
              <FaPlusSquareO onClick={this.handleCreateClick}/>
          }
        </Tooltip>

        {
          createGroupVisible ?
            <GroupMemberModal
              title="创建聊天"
              mode="create"
              count={0}
              deptTreeOptions={deptOptions}
              visible={createGroupVisible}
              formLoading={createGroupLoading}
              checkedUsers={[]}
              onSubmit={this.handleSubmitCreateGroup.bind(this)}
              onCancel={this.handleCancelCreateGroup}
            /> : null
        }
      </div>
    );
  }

}