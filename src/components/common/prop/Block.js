import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';

import { Spin } from 'antd';

import _ from 'lodash';

@inject(stores => ({
  dbStore: stores.dbStore,
}))
@observer
export default class Block extends Component {

  componentWillMount() {
    const { id, type } = this.props;
    const { getGroupInfo, getUserInfo } = this.props.dbStore;
    if (type === 'user') {
      getUserInfo(id);
    }
    
    if (type === 'group') {
      getGroupInfo(id);
    }
  }
  
  componentWillReceiveProps(nextProps) {
    const { id: nextId, type: nextType } = nextProps;
    const { id, type } = this.props;
    if (id !== nextId || type !== nextType) {
      const { getGroupInfo, getUserInfo } = this.props.dbStore;
      
      if (nextType === 'user') {
        getUserInfo(nextId);
      }
      
      if (nextType === 'group') {
        getGroupInfo(nextId);
      }
    }
  }

  render() {
    const { userCache, groupCache } = this.props.dbStore;
    const { id, type } = this.props;

    let target = type === 'user' ? userCache.get(id) : groupCache.get(id);
    if (!target || target.loading) {
      return (
        <div className="oli-block"><Spin/></div>
      );
    }

    return this.props.onCustomRender(target);
  }
}

Block.defaultProps = {
  id: '',
  type: 'user', // group

  onCustomRender: null,
};
