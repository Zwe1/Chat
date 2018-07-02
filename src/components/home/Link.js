import React, { Component } from "react";
import TitleBar from "../common/TitleBar";
import { Spin, Button, Dropdown, Menu, Icon, message as antMessage } from "antd";
import { getCurrentUser, getCurrentBaseUrl } from '../../lowdb';

export default class Link extends Component {

  constructor(props) {
    super(props);
    this.state = {
      topTitle: '',
      url: '',
      loading: true,
    };

    this.hide = true;
    this.url = '';
  }

  componentDidMount() {
    const { ipcRenderer } = window.require('electron');

    const { webview } = this.refs;

    ipcRenderer.on('new-link-url', () => {
      this.setState({
        url: window.linkUrl,
        loading: true,
      }, () => {
        this.hide = false;

         webview.addEventListener('dom-ready', () => {
          console.log('dom-ready');
        });

        webview.addEventListener('did-finish-load', () => {
          console.log('did-finish-load');
          if (!this.hide) {
            this.setState({
              loading: false,
            });
          }

          const title = webview.getTitle() || '';
          let titleFlag = false;

          const rep = /^(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[1-9])\.(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[1-9]|0)\.(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[1-9]|0)\.(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[0-9]):\d{0,5}$|^(http(s)?:\/\/)?([A-Za-z0-9]+\.)?[\w-]+\.\w{2,4}(\/)?$/;
          const repr = /(?:www\.)?(.*?)\./;

          if (title.slice(0, 4) == 'http') {
            const tArr = title.split('/');
            const finalTitle = `${tArr[0]}://${tArr[2]}`;
            titleFlag = rep.test(finalTitle);
          } else {
            const tArr = title.split('/');
            titleFlag = rep.test(tArr[0]);
            titleFlag = repr.test(title);
          }

          if (!titleFlag) {
            this.setState({
              topTitle: title,
            });
          }
        });

        webview.addEventListener('did-start-loading', () => {
          console.log('did-start-loading');
        });

        webview.addEventListener('new-window', (event) => {
          webview.loadURL(event.url);
        });
      });
      
      if (this.url === window.linkUrl) {
        this.setState({
          loading: false,
        });
      } else {
        this.url = window.linkUrl;
      }
    });
  }

  handleCloseClick = () => {
    const { remote } = window.require('electron');
    const { webview } = this.refs;
    this.hide = true;
    this.setState({
      loading: true,
      topTitle: '',
    }, () => {
      const linkWindow = remote.getCurrentWindow();
      linkWindow.hide();
    });
  };

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
    const { 
      topTitle,
      url,
      loading,
    } = this.state;

    return (
      <div className='link-message-modal'>
        {
          loading ? 
          <div className='webview-spin-content'>
            <Spin className='webview-spin'/>
          </div> : null
        }
        <TitleBar
          title={topTitle}
          close={true}
          btnType={'linkModal'}
          handleCloseClick={this.handleCloseClick}
        />
        <div className='btn-div'>
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
        <webview ref='webview' className='link-webview' src={url} />
      </div>
    )
  }
}