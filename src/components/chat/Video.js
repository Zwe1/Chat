import React, { Component } from 'react';
import uuid from 'uuid';
import { Button, Icon, Row, Col } from 'antd';

import Agora from '../../common/agora';

import _ from 'lodash';

import { observer } from 'mobx-react';

import getInstance from '../../websocket';
import { getCurrentUser } from '../../lowdb';

@observer
class Video extends Component {

  constructor(props) {
    super(props);

    const mine = getCurrentUser();
    this.state = {
      channelName: uuid.v4(),
      appId: 'f1ad5385b8ca45fba39634eef59f7e98',
      localStream: null,
      remoteList: [],
      isLocalError: false,
      startTime: null,
      octa: getInstance(mine.loginid),
      /*
       * 0：等待链接
       * 1：正在视频
       * 2：视频结束
       */
      state: 0,
    };
  }

  componentWillMount() {
    if (window.isElectron()) {
      const electron = window.require('electron');
      const { remote } = electron;
      const window = remote.getCurrentWindow();
      window.on('resize', _.throttle((e) => {

        // console.log('current window resize:', e, window.getSize(), window.getPosition());

      }, 50));
    }
  }

  componentDidMount() {
    let agora = new Agora(this.state.appId);
    agora.init();
    agora.onRemoteListChange = this.handleRemoteListChange.bind(this);
    agora.onInitLocalStreamError = this.handleInitLocalStreamError.bind(this);
    agora.onJoinChannelSuccess = this.handleJoinChannelSuccess.bind(this);
    agora.onLocalStreamPublished = this.handleLocalStreamPublished.bind(this);

    // 要发送视频链接请求
    if (window.isElectron()) {
      const electron = window.require('electron');
      const { remote } = electron;
      const window = remote.getCurrentWindow();
      const {
        type,
        chatTo,
        dir
      } = window.wMeta;

      const mine = getCurrentUser();
      if (dir === 1) { // 我发出去的
        this.state.octa.sendObj({
          type: 'video',
          from: mine.loginid,
          to: chatTo.id,
          content: this.state.channelName // 告诉他我的 channel 名称
        });
      }
    }
    
  }

  handleMinWindow() {
    const electron = window.require('electron');
    const { remote } = electron;
    const window = remote.getCurrentWindow();

    window.minimize();
  }

  handleMaxWindow() {
    const electron = window.require('electron');
    const { remote } = electron;
    const window = remote.getCurrentWindow();

    if (window.isMaximized()) {
      window.restore();
    } else {
      window.maximize();
    }
  }

  handleCloseWindow() {
    // 关闭视频
    console.log('close video window');

    // 关闭窗口的时候关闭 websocket
    this.state.octa.close();

    // 关掉视频流
    if (this.state.localStream != null) {
      this.state.localStream.stop();
      this.setState({
        localStream: null
      })
    }

    const window = remote.getCurrentWindow();
    window.close();
  }

  handleRemoteListChange(list, recent) {
    this.setState({
      remoteList: list
    }, () => {
      // 这里表示已经把 remoteList 需要用到的 div 渲染完毕了
      // 开始播放就行拉
      // 播放谁肯定只有一个
      //
      // agora.play(recent);
    });
  }

  handleInitLocalStreamError(err) {
    // console.log('');
  }

  handleJoinChannelSuccess(uid) {
    // 开始算等待时间，因为这个时候对方已经可以收到通知，
    // 或者等待服务器端的返回，因为这里要请求链接对方
    //
  }

  handleLocalStreamPublished(localStream) {
    this.setState({
      localStream
    }, () => {
      Agora.play(localStream);
    })
  }

  render() {
    const count = this.state.remoteList.length;

    return (
      <div className="modal-video">
        <div className="video-header">
          <span className="title">正在和 Dora 视频通话</span>
          <div className="operations">
            <Icon type="minus" onClick={this.handleMinWindow.bind(this)}/>
            <Icon type="scan" onClick={this.handleMaxWindow.bind(this)}/>
            <Icon type="close" onClick={this.handleCloseWindow.bind(this)}/>
          </div>
        </div>

        <div className="video-content">
          {
            count === 0 && this.state.localStream == null ? (
              <div className="video-content-hint">
                <p className="state">正在呼叫 Dora ... </p>
                <p className="time">00:12:03</p>
                <div className="icon-wrapper">
                  <Icon type="video-camera"/>
                </div>
              </div>
            ) : (
              <div
                className="video-wrapper"
                id={this.state.localStream.getId()}
                style={{
                  width: 320,
                  height: 240,
                  background: '#fff'
                }}
              />
            )
          }

          {
            count === 1 ? (
              <Row gutter={16} type="flex" align="middle" justify="center">
                <Col span={12}>
                  <div className="video-wrapper"
                       style={{
                         width: 320,
                         height: 240,
                         background: '#fff'
                       }}></div>
                </Col>
                <Col span={12}>
                  <div
                    className="video-wrapper"
                    style={{
                      width: 320,
                      height: 240,
                      background: '#fff'
                    }}></div>
                </Col>
              </Row>
            ) : null
          }

          {/*<Row type="flex" align="middle" justify="center">*/}
          {/*<Col span={24}>*/}
          {/*<div*/}
          {/*className="video-wrapper"*/}
          {/*style={{*/}
          {/*width: 320,*/}
          {/*height: 240,*/}
          {/*background: '#fff'*/}
          {/*}}></div>*/}
          {/*</Col>*/}
          {/*</Row>*/}
        </div>

        <div className="video-footer">
          <Button type="danger">挂断</Button>
        </div>
      </div>
    );
  }
}

export default Video;
