import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';

import OliAvatar from '../common/Avatar';
//import Scrollbars from '../common/scrollbar/SpringScrollbars';

import { Icon, Menu, Tooltip, Spin } from 'antd';
const SubMenu = Menu.SubMenu;

@inject(stores => ({
  contactStore: stores.contactStore,
}))
class CompanyListTree extends Component {

  handleCompanyOpenChange = (openKeys) => {
    console.log('handleCompanyOpenChange:', openKeys);

    this.props.onOpen(openKeys);
  };

  handleMenuItemClick = ({ key, selectedKeys }) => {
    const { allDepts, myDepts, setSelectCompanyType, subordinateData, commonGroupData } = this.props.contactStore;

    let [id, type] = key.split('-');

    // 当前选中项的顶级部门集合
    let list = [];
    // 选中的公司
    let dummy = null;

    switch(type) {
      case 'org':
        dummy = allDepts && allDepts.filter(dept => dept.id === id);
        setSelectCompanyType(0);
        break;
      case 'mydept':
        dummy = myDepts && myDepts.filter(dept => dept.id === id);
        setSelectCompanyType(1);
        break;
      case 'regroup':
        dummy = commonGroupData && commonGroupData.filter(dept => dept.id === id);
        setSelectCompanyType(2);
        break;
      case 'subordinate':
        dummy = subordinateData && subordinateData.filter(dept => dept.id === id);
        setSelectCompanyType(3);
        break;
    }

    if (dummy && dummy.length > 0) {
      if (type === 'regroup') {
        list = dummy;
      } else {
        list = dummy[ 0 ].depts;
      }
    }

    if (!list) {
      list = [];
    }

    this.props.onSelect(selectedKeys, list, []);
  };

  render() {
    const {
      treeData,
      openKeys,
      selectedKeys,
      extraMenus,
    } = this.props;

    const { fetchCompanysPending } = this.props.contactStore;

    if (fetchCompanysPending) {
      return (
        <div className='company-list-spin'>
          <Spin />
        </div>
      )
    }

    return (
      <Menu
        mode="inline"
        openKeys={openKeys}
        className="com-list-tree"
        selectedKeys={selectedKeys}
        onOpenChange={this.handleCompanyOpenChange}
        onSelect={this.handleMenuItemClick}
      > 
        {
          extraMenus.map(menu => menu)
        }
        {
          treeData.map(com => {
            return (
              <SubMenu
                className='company-submenu'
                key={com.key}
                title={
                  <div className="company-title">
                    <OliAvatar size={40} avatarMap={com.logo} popover={false}/>
                    <span className="title">
                      <Tooltip
                        overlayClassName='company-tooltip'
                        mouseEnterDelay={0.5}
                        placement='top'
                        title={<span>{com.label}</span>}
                      >
                        <b>{com.label}</b>
                      </Tooltip>
                    </span>
                  </div>
                }
              >
                {com.children.map(dummy => {
                  return (
                    <Menu.Item className='company-menu' key={dummy.key}>
                      <i className='company-menu-i'/>{dummy.label}
                    </Menu.Item>
                  );
                })}
              </SubMenu>
            );
          })
        }
      </Menu>
    );
  }

}

CompanyListTree.defaultProps = {
  treeData: [],
  openKeys: [],
  selectedKeys: [],
  extraMenus: [],
  // openKeys
  onOpen: () => {
  },
  // (selectedKeys, list. ids);
  onSelect: () => {
  },
};

export default CompanyListTree;
