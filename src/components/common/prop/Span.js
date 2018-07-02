import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';

import { Spin } from 'antd';

import _ from 'lodash';

@inject(stores => ({
  dbStore: stores.dbStore,
}))
@observer
export default class Span extends Component {

  componentWillMount() {
    const { userId, groupId } = this.props;
    
    const {
      getGroupInfo,
      getUserInfo,
    } = this.props.dbStore;

    if (userId) {
      getUserInfo(userId);
    }

    if (groupId) {
      getGroupInfo(groupId);
    }
  }

  componentWillReceiveProps(props) {
    const { userId, groupId } = props;

    const {
      getGroupInfo,
      getUserInfo,
    } = this.props.dbStore;

    if (userId) {
      getUserInfo(userId);
    }

    if (groupId) {
      getGroupInfo(groupId);
    }
  }

  render() {
    const { userCache, groupCache } = this.props.dbStore;
    const { userId, groupId, prop, defaultValue } = this.props;

    let target = userId ? userCache.get(userId) : groupCache.get(groupId);
    if (!target || target.loading) {
      return <span>{defaultValue}</span>;
    }

    return <span>{target[ prop ]}</span>
  }
}

Span.defaultProps = {
  userId: '',
  groupId: '',

  simple: true,
  prop: '',
  defaultValue: '',
};
