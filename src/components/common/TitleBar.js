import React, { Component } from 'react';
import { Avatar, Icon } from 'antd';
import { inject, observer } from 'mobx-react';

import FaSquareO from 'react-icons/lib/fa/square-o';
import FaClone from 'react-icons/lib/fa/clone';

import BtnList from './BtnList';

@inject(stores => ({
  homeStore: stores.homeStore,
}))
@observer
export default class TitleBar extends Component {
  static propTypes = {};

  constructor(props) {
    super(props);

    this.state = {
      maximize: false,
    };

    if (window.isElectron()) {
      const electron = window.require('electron');
      const { remote } = electron;
      const currentWindow = remote.getCurrentWindow();
      currentWindow.on('maximize', () => {
        this.setState({
          maximize: true,
        })
      });

      currentWindow.on('unmaximize', () => {
        this.setState({
          maximize: false,
        })
      });
    }
  }

  handleMinWindow() {
    const electron = window.require('electron');
    const { remote } = electron;

    const currentWindow = remote.getCurrentWindow();
    currentWindow.minimize();
  }

  handleMaxWindow() {
    const electron = window.require('electron');
    const { remote } = electron;

    const currentWindow = remote.getCurrentWindow();
    if (currentWindow.isMaximized()) {
      currentWindow.unmaximize();
    } else {
      currentWindow.maximize();
    }
  }

  handleCloseWindow() {
    const electron = window.require('electron');
    const { remote } = electron;
      
    const currentWindow = remote.getCurrentWindow();

    const {
      close,
      type,
      handleCloseClick,
    } = this.props;

    const {
      panelSelect,
    } = this.props.homeStore;

    if (type === 'mainPanel') {
      if (panelSelect === '2') {
        const { ipcRenderer } = window.require('electron');

        ipcRenderer.send('app-quit', {});
      }
    }

    if (close) {
      if (handleCloseClick) {
        handleCloseClick();
        return;
      }
      currentWindow.hide();
    } else {
      currentWindow.hide();
      currentWindow.setSkipTaskbar(true);
    }
  }

  render() {
    const { activeTitle, btnList } = this.props.homeStore;
    const { btnType } = this.props;

    return (
      <div className="common-title-bar" style={{background: activeTitle && activeTitle.top_bgcolor}}>
        <div className="left">
          <div className="logo-wrapper">
            <span>{this.props.title ? this.props.title : activeTitle ? activeTitle.top_title : ''}</span>
          </div>
        </div>

        <div className="right">
          <BtnList activeTitle={activeTitle} btnType={btnType} btnList={btnList}/>
          {window.isElectron() ? <div className="action-bar">
            <Icon type="minus" onClick={this.handleMinWindow}/>
            <i className="anticon" onClick={this.handleMaxWindow}>
              { this.state.maximize ? <FaClone /> : <FaSquareO /> }
            </i>
            <Icon type="close" onClick={this.handleCloseWindow.bind(this)}/>
          </div> : null}
        </div>
      </div>
    );
  }
}

TitleBar.defaultProps = {
  title: '',
  icon: '',
  close: false,
  type: 'normal' // 普通：normal , 主界面：mainPanel
};
