import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';

// import { Spin } from 'antd';

import _ from 'lodash';

@inject(stores => ({
  dbStore: stores.dbStore,
}))
@observer
export default class List extends Component {
  
  componentWillMount() {
    const { ids, type } = this.props;
    const { getSimpleUsersInfo } = this.props.dbStore;

    // console.log('[list] - component will mount:', ids);
    getSimpleUsersInfo(ids);
  }

  render() {
    const { userCache } = this.props.dbStore;
    const { ids } = this.props;

    // let targets = userCache.values().filter(item => ids.indexOf(item.id) > -1);
    let targets = ids.map(id => userCache.get(id)).filter(user => user);

    return this.props.onCustomRender(targets);
  }
}

List.defaultProps = {
  ids: '',
  onCustomRender: null,
};
