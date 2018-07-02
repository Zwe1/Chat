import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';

import { Spin } from 'antd';

import _ from 'lodash';

@inject(stores => ({
  dbStore: stores.dbStore,
}))
@observer
export default class SimpleSpan extends Component {

  componentWillMount() {
    const { userId, groupId } = this.props;
    // console.log('simple span will mount:', userId, groupId);

    const {
      getGroupInfo,
      getSimpleUserInfo,
    } = this.props.dbStore;
    
    if (userId) {
      getSimpleUserInfo(userId);
    }
    
    if (groupId) {
      getGroupInfo(groupId);
    }
  }
  
  componentWillReceiveProps(props) {
    const { userId, groupId } = props;
    // console.log('simple span will receive props:', userId, groupId);

    const {
      getGroupInfo,
      getSimpleUserInfo,
    } = this.props.dbStore;

    if (userId) {
      getSimpleUserInfo(userId);
    }

    if (groupId) {
      getGroupInfo(groupId);
    }
  }

  render() {
    const { userCache, groupCache } = this.props.dbStore;
    const { userId, groupId, prop, defaultValue, className } = this.props;

    let target = userId
                  ? userCache.get(userId) 
                  : groupCache.get(groupId);

    if (!target || target.loading) {
      return <span className={`${className} loading`}>{defaultValue}</span>;
    }

    return <span className={className}>{target[ prop ]}</span>
  }
}

SimpleSpan.defaultProps = {
  userId: '',
  groupId: '',
  className: '',
  simple: true,
  prop: '',
  defaultValue: '',
};
