import React, { Component } from "react";
import { Spin, Button, Dropdown, Menu, Icon, message as antMessage } from "antd";
import TitleBar from "../common/TitleBar";
import { getCurrentUser, getCurrentBaseUrl } from '../../lowdb';

export default class CustomUrl extends Component {

  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      topTitle: '',
      customUrl: '',
    };

    this.flag = false;
  }

  componentDidMount() {
    const { webview } = this.refs;

    if (window.isElectron()) {
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.on('new-custom', () => {
        this.setState({
          topTitle: window.custom.top_title,
          customUrl: window.custom.nav_func_set1,
        }, () => {
          webview.addEventListener('dom-ready', () => {
            console.log('dom-ready');
            this.setState({
              loading: false,
            });
          });

          webview.addEventListener('did-finish-load', () => {
            console.log('did-finish-load');
            this.flag = true;
          });

          webview.addEventListener('did-start-loading', () => {
            console.log('did-start-loading');
          });

          webview.addEventListener('new-window', (event) => {
            webview.loadURL(event.url);
          });
        });
        
        if (this.flag) {
          const setUrl = window.custom.nav_func_set1.slice(-1) !== '/' ? `${window.custom.nav_func_set1}/` : window.custom.nav_func_set1;

          if (webview.getURL() !== setUrl) {
            webview.loadURL(window.custom.nav_func_set1);
          } else {
            this.setState({
              loading: false,
            });
          }

        }
      });
    }

  }

  handleGoBackClick = () => {
    const { webview } = this.refs;
    webview.goBack();
  };

  handleGoForwardClick = () => {
    const { webview } = this.refs;
    webview.goForward();
  };

  handleReloadClick = () => {
    const { webview } = this.refs;
    webview.reload();
  };

  handleCloseClick = () => {
    const { remote } = window.require('electron');
    this.setState({
      loading: true,
    });
    const customWindow = remote.getCurrentWindow();
    customWindow.hide();
  };

  handleMenuSelect = (e) => {
    const { webview } = this.refs;
    const { clipboard, shell } = window.require('electron');
    const url = webview.getURL();
    switch (e.key) {
      case 'copy':
        clipboard.writeText(url);
        antMessage.success('已复制到粘贴板');
        break;

      case 'open':
        shell.openExternal(url);
        break;
    }
  };

  render() {
    const { url } = this.props;
    const { loading, topTitle, customUrl } = this.state;

    return (
      <div className='custom-url'>
        {
          !url &&
          <TitleBar
            title={topTitle}
            close={true}
            btnType={'customModal'}
            handleCloseClick={this.handleCloseClick}
          />
        }
        <div className={`btn-div ${url ? 'in-app' : ''}`}>
          <Button.Group>
            <Button icon="left" onClick={this.handleGoBackClick}/>
            <Button icon="right" onClick={this.handleGoForwardClick}/>
            <Button icon="reload" onClick={this.handleReloadClick}/>
            <Dropdown
              trigger={[ 'click' ]}
              overlay={
                <Menu
                  onClick={this.handleMenuSelect}
                >
                  <Menu.Item key="copy">复制链接地址</Menu.Item>
                  <Menu.Item key="open">在默认浏览器打开</Menu.Item>
                </Menu>
              }
            >
              <Icon type="ellipsis"/>
            </Dropdown>
          </Button.Group>
        </div>
        <webview ref='webview' className={`${ url ? '' : 'webview-out' } custom-webview`} src={url ? url : customUrl}/>
        {
          loading &&
          <div className={`webview-spin-content ${url ? 'spin-in-app' : ''}`}>
            <Spin className='webview-spin'/>
          </div>
        }
      </div>
    )
  }
}