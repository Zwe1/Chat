import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import { message as antdMessage, Tooltip } from 'antd';

import classNames from 'classnames';
import GlobalOperations from './GlobalOperations';
import InputSearch from '../home/InputSearch';

import { getCurrentDomainSetting } from '../../lowdb';
import config from '../../electron-main/em-config.json';
import { appIdenTypesByStr } from '../../common/types';

@inject(stores => ({
  homeStore: stores.homeStore,
}))
@observer
export default class BtnList extends Component {
	constructor(props) {
		super(props);
	}

  renderBtnList = (list, btnType, i) => {
    let children = null;
    const baseUrl = getCurrentDomainSetting().cdn_url || config.base_url;
    const finalIcon = `${baseUrl}${list.icon_default}`;
    switch (list.btn_func) {
      case parseInt(appIdenTypesByStr.groupChat) : // 发起群聊
        children = !btnType ? <GlobalOperations btnName={list.btn_name} icon={finalIcon}/> : null
        break;
      default :
      	children = <img className='btn-img' src={finalIcon} onClick={this.handleBtnClick}/>;
      	break;
    }
    return (
      <div className='title-btn' key={i}>
      	<Tooltip placement='bottom' title={<span>{list.btn_name}</span>} overlayClassName='title-btn-tooltip'>
      		{children}
      	</Tooltip>
      </div>
    );
  };

  handleBtnClick = () => {
	  antdMessage.warning('该模块正在努力开发中~');
  	return;
  }

	render() {
		const { activeTitle, btnType, btnList } = this.props;

		const btnListClass = classNames('btn-list', {
      'btn-list-in-app': activeTitle && activeTitle.nav_func === 3 && !btnType,
      'btn-list-in-web': !window.isElectron()
    });

    return (
    	<div className={btnListClass}>
        {btnList && btnList.length > 0 && btnList.map((v, i) => this.renderBtnList(v, btnType, i))}
        {!btnType && <InputSearch />}
      </div>
    )
	}
}