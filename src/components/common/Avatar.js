import React, { Component } from 'react';
import { getCurrentBaseUrl } from '../../lowdb';
import { buildMediaUrl } from '../../services/media';

import Avatar from 'react-avatar';

import { Tooltip } from 'antd';

import EmPopover from './EmPopover';

import { inject, observer } from 'mobx-react';

@inject(stores => ({
  homeStore: stores.homeStore,
  dbStore: stores.dbStore,
}))
@observer
export default class OliAvatar extends Component {

  componentWillMount() {
    const { id, type } = this.props;
    const { getSimpleUsersInfo, getGroupInfo } = this.props.dbStore;

    // console.log('avatar will mount:', id, type);

    if (type === 'user' && id) {
      getSimpleUsersInfo([ id ]);
    }

    if (type === 'group' && id) {
      getGroupInfo([ id ]);
    }
  }

  componentWillReceiveProps(props) {
    const { id, type } = props;
    const { getSimpleUsersInfo, getGroupInfo } = this.props.dbStore;

    // console.log('avatar will receive props:', id, type);

    if (type === 'user' && id) {
      getSimpleUsersInfo([ id ]);
    }

    if (type === 'group' && id) {
      getGroupInfo([ id ]);
    }
  }

  handleAvatar = () => {
    const { setPsVisible } = this.props.homeStore;
    const { handleAvatar } = this.props;

    setPsVisible(true);
    handleAvatar();
  };

  renderFinalAvatar(avatarProps) {
    const { psShowFlag } = this.props;

    if (psShowFlag) {
      return <Tooltip placement='bottom' overlayClassName='avatar-img-tooltip' title={<div>打开个人设置</div>}>
        <div>
          <Avatar {...avatarProps} onClick={this.handleAvatar}/>
        </div>
      </Tooltip>
    } else {
      return <Avatar {...avatarProps} />
    }
  }

  renderAvatarMap(avatarMap = {}, avatarProps) {
    const baseUrl = getCurrentBaseUrl();

    const mediaId = avatarMap[ 'media_id' ];
    const defaultAvatar = avatarMap[ 'default' ];
    const showColor = avatarMap[ 'show_color' ];
    const showName = avatarMap[ 'show_name' ];

    if (mediaId && mediaId !== 'string') {
      let url = buildMediaUrl(mediaId);
      return this.renderFinalAvatar({...avatarProps, src: url});
    }

    if (defaultAvatar) {
      let url = baseUrl + defaultAvatar;
      return this.renderFinalAvatar({...avatarProps, src: url});
    }

    if (showName && showColor) {
      return this.renderFinalAvatar({...avatarProps, value: showName, color: showColor});
    }
    return this.renderFinalAvatar({...avatarProps});
  }

  renderAvatar(props) {
    const { type, id, size, avatarMap, className, cursor, psShowFlag } = props;
    const { userCache, groupCache } = this.props.dbStore;

    let avatarProps = {
      className: `oli-avatar ant-avatar ${className} ${psShowFlag ? 'psShowFlag' : ''}`,
      size,
      style: {
        cursor: psShowFlag ? 'pointer' : cursor,
      },
      textSizeRatio: 3,
      round: true,
      color: '#399c9c',
      value: '泛微'
    };

    // 没有 id 只有头像数据的时候
    if (!id && avatarMap) {
      return this.renderAvatarMap(avatarMap, avatarProps);
    }

    let target;
    if (type === 'user') {
      target = userCache.get(id);
    }

    if (type === 'group') {
      target = groupCache.get(id);

      if (!target) {
        target = { avatar: { default: '/common/images/group_default.png' } };
      }

      if (target.loading) {
        target.avatar = {
          default: '/common/images/group_default.png'
        };
      }
    }

    // 用户信息去请求了，但是还没有得到
    if (!target || target.loading) {
      if (avatarMap) {
        // 这个时候可以趁机显示默认就有的头像
        this.renderAvatarMap(avatarMap, avatarProps);
      }
      return this.renderFinalAvatar({...avatarProps});    // 否则显示默认头像
    }

    // 根据 id 获取用户或者群组信息成功， 可以显示其头像了
    const otherAvatarMap = target.avatar;
    return this.renderAvatarMap(otherAvatarMap, avatarProps);
  }

  render() {
    const { popover, overlayClassName, chatIsFormYou, ...others } = this.props; // true 为显示Popover

    return !popover
      ? this.renderAvatar(others)
      : (
        <EmPopover 
          id={this.props.id} 
          overlayClassName={overlayClassName} 
          chatIsFormYou={chatIsFormYou}
        >
          {this.renderAvatar({ ...others, cursor: 'pointer' })}
        </EmPopover>
      );
  }
}

OliAvatar.defaultProps = {
  className: '',
  cursor: 'normal',
  avatarMap: {},
  // icon: 'user',
  popover: true,
  psShowFlag: false, // 是否show 个人设置modal

  type: 'user', // 'group'
  id: '',
};
