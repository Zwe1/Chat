import React, { Component } from "react";
import { inject, observer } from 'mobx-react';
import { Icon, Tooltip } from "antd";

@inject(stores => ({
  chatStore: stores.chatStore,
}))
@observer
export default class Shake extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

  async handleShakeClick() {
    const {
      currentChatPerson,
      sendMessage,
      spliceMessage,
    } = this.props.chatStore;

    const messages = [];
    messages.push(spliceMessage('shake', {}, currentChatPerson).lastMessage);

    await sendMessage(messages);

    // 客户端
    if (window.isElectron()) {
      const { ipcRenderer } = window.require('electron');

      ipcRenderer.send('shakeMainWindow');
      
    }
  }

  render() {
    return (
      <div className='send-shake'>
        <Tooltip placement='top' title='抖一抖'>
  	      <button className='ql-shake' onClick={this.handleShakeClick.bind(this)}>
  	        <Icon type='shake' />
  	      </button>
        </Tooltip>
      </div>
    )
  }

}