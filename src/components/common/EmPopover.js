import React, { Component } from 'react';

import { withRouter } from 'react-router-dom';
import { inject, observer } from 'mobx-react';
import { Popover, Spin } from 'antd';
import $ from 'jquery';

import PersonInfo from './PersonInfo';

@withRouter
@inject(stores => ({
  homeStore: stores.homeStore,
  dbStore: stores.dbStore,
}))
@observer
export default class EmPopover extends Component {

  constructor(props) {
    super(props);
    this.state = {
      baseUser: null,
      visible: false
    };

    this.popFlag = false;
  }

  enableDrag() {
    $('.common-title-bar').removeClass('no-drag');
  }

  disableDrag() {
    $('.common-title-bar').addClass('no-drag');
  }

  handlePop = () => {
    if (this.popFlag) {
      this.popFlag = false;
      return ;
    }

    this.popFlag = true;
    this.disableDrag();

    const { id = '' } = this.props;
    const { getUserInfo } = this.props.dbStore;
    getUserInfo(id);
  };

  handleVisibleChange = (visible) => {
    this.setState({
      visible
    }, () => {
      visible ? this.disableDrag() : this.enableDrag();
      !visible && (this.popFlag = false);
    });
  };

  handleHidePop = () => {
    this.setState({
      visible: false
    }, () => {
      this.enableDrag();
      this.popFlag = false;
    });
  };

  render() {
    const { visible } = this.state;
    const { overlayClassName, chatIsFormYou, id = '' } = this.props;
    const { userCache } = this.props.dbStore;


    const baseUser = userCache.get(id);
    const content = (
      <PersonInfo 
        avaSize={50} 
        baseUser={baseUser} 
        handleHidePop={this.handleHidePop}
      />
    );

    return (
      <Popover
        overlayClassName={`em-popover ${overlayClassName ? overlayClassName : ''}`}
        placement={`${ chatIsFormYou ? 'rightBottom' : 'rightTop' }`}
        content={content}
        onClick={this.handlePop.bind(this)}
        trigger="click"
        visible={visible}
        onVisibleChange={this.handleVisibleChange}
        autoAdjustOverflow={true}
      >
        {this.props.children}
      </Popover>
    )
  }
}