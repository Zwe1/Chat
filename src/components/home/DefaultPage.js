import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';

import { getCurrentUser } from "../../lowdb";

import { App } from './';

@withRouter
@inject(stores => ({
	homeStore: stores.homeStore,
  loginStore: stores.loginStore,
}))
@observer
export default class DefaultPage extends Component {

  componentWillMount() {
    const { location } = this.props;

    if (location.pathname === '/' && !getCurrentUser()) {
      console.log('current user null, go to login page.');

      const { history } = this.props;
      history.push('/login');
      //return;
    }

    const self = this;
    //
    if (window.isElectron()) {
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.on('user-logout', (event, message) => {
        self.props.loginStore.logout();  
      });
    }
  }

  componentWillUnmount() {
    console.log('app will unmount');

    this.props.loginStore.logout();
  }

  render() {
    const { location } = this.props;
    console.log('default page render', location);

    if (location.pathname !== '/') {
      return this.props.children;
    }

    return (
      <App />
    );
  }

}
