import React, { Component } from 'react';
import { Icon, Tooltip, Badge } from 'antd';
import { inject, observer } from "mobx-react";

import { getCurrentDomainSetting } from '../../lowdb';

import config from '../../electron-main/em-config.json';
import { appIdenTypesByStr } from "../../common/types";

@inject(stores => ({
  chatStore: stores.chatStore,
}))
@observer
export default class SiderTooltip extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hoverItem: '',
    }
  }

  renderIcon() {
    const { mainTheme, navlist, active } = this.props;

    const baseUrl = getCurrentDomainSetting().cdn_url || config.base_url;

    const { hoverItem } = this.state;

    return (
      <div style={{ display: 'inline-block' }}>
        <img src={active || hoverItem ? `${baseUrl}${navlist.icon_selected}` : `${baseUrl}${navlist.icon_default}`} />
        {
          mainTheme.nav_showtext 
            ? <span style={{ color: `${active ? `${mainTheme.nav_textcolor_selected}` : `${mainTheme.nav_textcolor_default}`}` }}>{navlist.nav_name}</span>
            : ''
        }
      </div>
    )
  }

  handleTabEnter = id => {
    this.setState({
      hoverItem: id,
    });
  };

  handleTabOut = id => {
    this.setState({
      hoverItem: '',
    });
  };

  render() {
    const { navlist, className } = this.props;
    const { totalUnreadCount } = this.props.chatStore;

    const id = `${navlist.nav_func}_${navlist.nav_id}`;

    return (
      <Tooltip overlayClassName='sider-tooltip' placement="right" title={<span>{navlist.nav_name}</span>}>
        <div
          className={`icon-bar ${className}`}
          onMouseEnter={() => this.handleTabEnter(id)}
          onMouseOut={() => this.handleTabOut(id)}
        >
          {
            navlist.nav_func == appIdenTypesByStr.chat
              ? (
                <Badge count={totalUnreadCount} overflowCount={99}>
                  {this.renderIcon()}
                </Badge>
              )
              : this.renderIcon()
          }
        </div>
      </Tooltip>
    )
  }
}