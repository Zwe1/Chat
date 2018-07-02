import React, { Component } from 'react';
import TitleBar from "../common/TitleBar";
import HistoryContent from './HistoryContent';

export default class HistoryMessage extends Component {
  constructor(props) {
    super(props)
  }

  handleCloseClick = () => {
    const { remote } = window.require('electron');
    const win = remote.getCurrentWindow();
    win.hide();
  };

  render() {
    return (
      <div className='history-message'>
        <TitleBar
          title={'历史消息'}
          close={true}
          btnType={'histroyMessageModal'}
          handleCloseClick={this.handleCloseClick}
        />
        <HistoryContent />
      </div>
    )
  }
}
