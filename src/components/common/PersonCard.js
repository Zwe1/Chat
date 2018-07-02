import React, { Component } from "react";
import { inject, observer } from 'mobx-react';
import { Icon, Modal, Button, Tooltip } from "antd";

import GroupMemberModal from '../chat/GroupMemberModal';

@inject(stores => ({
  chatStore: stores.chatStore,
  contactStore: stores.contactStore,
}))
@observer
export default class PersonCard extends Component {
	constructor(props) {
		super(props);
		this.state = {
			loading: false,
		};
	}

	handleCardClick = () => {
    const {
    	showSendPersonCard,
    } = this.props.chatStore;

    showSendPersonCard();
  };

  handleCancelPersonCard = () => {
    const {
      hideSendPersonCard,
    } = this.props.chatStore;

    hideSendPersonCard();
  };

  handleSendPersonCard(values, idList, checkedUsers) {
  	const {
  		currentChatPerson,
      sendMessage,
      spliceMessage,
      hideSendPersonCard,
  	} = this.props.chatStore;

  	this.setState({
  		loading: true,
  	});

  	const messages = [];
  	checkedUsers && checkedUsers.length > 0 && checkedUsers.map((v, i) => {
  		v.hrmCardid = v.base_user_id || v.id;
  		messages.push(spliceMessage('card', v, currentChatPerson).lastMessage);
  	});

  	sendMessage(messages);

  	this.setState({
  		loading: false,
  	});
  	hideSendPersonCard();
  }

  render() {
  	const {
  		loading,
  	} = this.state;

  	const {
      sendPersonCardVisible,
    } = this.props.chatStore;

    const deptOptions = {
      disabledKeys: [],
    };

    const checkedUsers = [];

    return (
      <div className='send-person-card'>
        <Tooltip placement='top' title='名片'>
  	      <button className='ql-card' onClick={this.handleCardClick}>
  	        <Icon type='idcard' />
  	      </button>
        </Tooltip>
	      {
          sendPersonCardVisible ?
            <GroupMemberModal
              title="发送名片"
              mode="send-person-card"
              formLoading={loading}
              checkedUsers={checkedUsers}
              maxCount={10}
              count={0}
              deptTreeOptions={deptOptions}
              visible={sendPersonCardVisible}
              onSubmit={this.handleSendPersonCard.bind(this)}
              onCancel={this.handleCancelPersonCard}
            /> : null
        }
      </div>
    )
  }

}