import React, { Component } from 'react';
import { toJS } from 'mobx';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';

import PersonInfo from '../common/PersonInfo';
import CompanyListTree from './CompanyListTree';
import DeptListTree from './DeptListTree';
import MyGroupList from './MyGroupList';
import SearchDept from './SearchDept';

import Scrollbars from '../common/scrollbar/SpringScrollbars';

import { Layout, Alert, Menu } from 'antd';

const { Sider, Content } = Layout;

@withRouter
@inject(stores => ({
  contactStore: stores.contactStore,
  dbStore: stores.dbStore,
  chatStore: stores.chatStore,
}))
@observer
export class Contact extends Component {

  constructor(props) {
    super(props);
    this.state = {
      group: true,
      first: true,
    }
  }

  handleDeptTreeExpand = (expandedKeys, item) => {
    const { setExpandedDeptKeys } = this.props.contactStore;
    setExpandedDeptKeys(expandedKeys);
  };

  // handleTreeNodeSelect = (selectKeys, item, e) => {
  //   const {
  //     setCurrentItem,
  //     deptExpandedKeys,
  //     setSelectedDeptKeys,
  //     setExpandedDeptKeys,
  //   } = this.props.contactStore;

  //   let expanded = toJS(deptExpandedKeys);
  //   let current = e.selected ? selectKeys[ 0 ] : e.node.props.eventKey;
  //   if (expanded.indexOf(current) > -1) {
  //     // 如果存在了，就删掉
  //     expanded = expanded.filter(id => id !== current);
  //   } else {
  //     expanded.push(current);
  //   }

  //   setExpandedDeptKeys(expanded);

  //   if (e.selected) {
  //     setSelectedDeptKeys(selectKeys);
  //   }

  //   setCurrentItem(toJS(item));
  // };

  getItemByArr(arr, list, parent) {
    if (arr.length === 0) {
      return parent;
    }
    for (let i of list) {
      if (i.id !== arr[ 0 ]) {
        continue;
      }
      return this.getItemByArr(arr.splice(1, arr.length - 1), i.children, i);
    }
  }

  renderDeptView(dept) {
    return (
      <div className="content-view dept">
        <h1>{dept.name || dept.group_name}</h1>
        {dept.total_count > 0 && <p>- {dept.total_count} 人 -</p>}
      </div>
    );
  }

  renderContent = (flag) => {
    let currentItem = {};
    if (flag === 'search') {
      currentItem = this.props.contactStore.searchItem;
    } else {
      currentItem = this.props.contactStore.currentItem;
    }

    if (!currentItem || currentItem === null || Object.keys(currentItem).length === 0) {
      return <p> 请选择部门或员工 </p>;
    }

    const isUser = currentItem.base_user_id !== undefined;
    if (isUser) {
      return (
        <PersonInfo avaSize={70} baseUser={currentItem} className={'contact-person'} type={'contact'}/>
      )
    }

    return this.renderDeptView(currentItem);
  };

  renderDeptList() {
    let {
      currentDropdownSelectedItemKey,
      currentDropdownSelectedItem = null,
      deptExpandedKeys = [],
      deptSelectedKeys = [],
      companySelectedKeys = [],
      inputClose,
      subordinateData,
      commonGroupData,
    } = this.props.contactStore;

    deptExpandedKeys = toJS(deptExpandedKeys);
    deptSelectedKeys = toJS(deptSelectedKeys);

    const selectedKey = companySelectedKeys[ 0 ];

    const selectedStr = selectedKey && selectedKey.split('-')[ 1 ];
    const selectedId = selectedKey && selectedKey.split('-')[ 0 ];

    if (selectedStr !== 'regroup') { // 不为常用组
      let item = currentDropdownSelectedItem[ currentDropdownSelectedItemKey ];

      if (selectedStr === 'subordinate') {  // 我的下属
        subordinateData && subordinateData.length > 0 && subordinateData.map(v => {
          if (v.id === selectedId) {
            item = v.depts;
          }
        });

        item = this.subDataConversion('subordinate', '我的下属', toJS(item));
      }

      if (companySelectedKeys.length > 0 && item && item.length === 0) {
        return (
          <div style={{ padding: 10 }}>
            <Alert message="没有数据~" type="info" showIcon/>
          </div>
        );
      }

      if (companySelectedKeys.length === 0 || (item && item.length === 0)) {
        return (
          <div style={{ padding: 10 }}>
            <Alert message="请选择组织~" type="info" showIcon/>
          </div>
        );
      }

      return (
        <DeptListTree
          deptData={item}
          companySelectedKeys={companySelectedKeys}
          expandedKeys={deptExpandedKeys}
          selectedKeys={deptSelectedKeys}
          onExpand={this.handleDeptTreeExpand}
          inputClose={inputClose}
          className={selectedStr === 'subordinate' ? 'person-dept-list' : ''}
        />
      );
    } else { // 常用组
      let commonList = [];
      let ownedList = [];

      commonGroupData && commonGroupData.length > 0 && commonGroupData.map(v => {
        if (v.id === selectedId) {
          commonList = this.groupDataConversion('commonList', '公用组', toJS(v.commonList));
          ownedList = this.groupDataConversion('ownedList', '私人组', toJS(v.ownedList));
        }
      });

      if (
        companySelectedKeys.length > 0  // 选择了常用组
        && commonList[ 0 ] && commonList[ 0 ].children && commonList[ 0 ].children.length === 0  // 公用组为空
        && ownedList[ 0 ] && ownedList[ 0 ].children && ownedList[ 0 ].children.length === 0) {  // 私用组为空
        return (
          <div style={{ padding: 10 }}>
            <Alert message="暂无数据~" type="info" showIcon/>
          </div>
        );
      }

      if (companySelectedKeys.length === 0 || (commonList[ 0 ] && commonList[ 0 ].children && commonList[ 0 ].children.length === 0 && ownedList[ 0 ] && ownedList[ 0 ].children && ownedList[ 0 ].children.length === 0)) {
        return (
          <div style={{ padding: 10 }}>
            <Alert message="请选择组织~" type="info" showIcon/>
          </div>
        );
      }

      return (
        <Scrollbars
          className='dept-tree-scroll dept-tree-normal-scroll'
        >
          <div className='commonGroup'>
            {commonList && commonList[ 0 ] && commonList[ 0 ].children.length > 0 && <DeptListTree
              deptData={commonList}
              companySelectedKeys={companySelectedKeys}
              expandedKeys={deptExpandedKeys}
              selectedKeys={deptSelectedKeys}
              onExpand={this.handleDeptTreeExpand}
              inputClose={inputClose}
              type='no-scroll'
            />}
            {ownedList && ownedList[ 0 ].children && ownedList[ 0 ].children.length > 0 && <DeptListTree
              deptData={ownedList}
              companySelectedKeys={companySelectedKeys}
              expandedKeys={deptExpandedKeys}
              selectedKeys={deptSelectedKeys}
              onExpand={this.handleDeptTreeExpand}
              inputClose={inputClose}
            />}
          </div>
        </Scrollbars>
      )
    }
  };

  // 我的下属的数组转化
  subDataConversion = (key, name, list) => {
    let finalObj = {
      id: key,
      name,
    };

    finalObj.children = list;

    return [ finalObj ];
  };

  // 常用组的数据转化
  groupDataConversion = (key, name, list) => {
    let finalObj = {
      id: key,
      name,
    };

    for (let item of list) {
      if (item.group_user && item.group_user.department && item.group_user.department.length > 0) {
        for (let depts of item.group_user.department) {
          depts.children = [...depts.userlist];
        }
      }

      item.children = [...item.group_user.userlist, ...item.group_user.department];
      item.type = 'group';

    }

    finalObj.children = list;

    return [ finalObj ];
  };

  handleMenuItemSelect = (selectedKeys, list, ids) => {
    const {
      setCurrentDropdownSelectedItem,
      setSelectedCompanyKeys,
      setExpandedDeptKeys,
      setSelectedDeptKeys,
      setCurrentItem,
      setSelectCompanyId,
      setInputClose,
      setKeyWord,
      setdeptTreeRootClick,
      setDeptTreeSingleClick,
      setSelectValue,
    } = this.props.contactStore;

    const {
      fetchAllGroups,
    } = this.props.chatStore;

    if (selectedKeys && selectedKeys[ 0 ] === 'group') {
      // 点击我的群组
      fetchAllGroups();

      this.setState({
        group: true,
        first: false,
      });

      setSelectedCompanyKeys(selectedKeys);
      return;
    }

    this.setState({
      group: false,
      first: false,
    });

    const companyId = selectedKeys[ 0 ].split('-')[ 0 ];

    setSelectCompanyId(companyId);

    setdeptTreeRootClick(true);  // 是否需要点击树结构的根节点
    setDeptTreeSingleClick(true);
    setSelectValue(0); // 设置部门下拉框为第一个

    setCurrentDropdownSelectedItem(list, companyId, selectedKeys[ 0 ].split('-')[ 1 ]);
    setSelectedCompanyKeys(selectedKeys);
    setExpandedDeptKeys(ids);
    setSelectedDeptKeys([]);
    setCurrentItem(); // null, clear old selection
    setCurrentItem(null, true);
    setInputClose(false);
    setKeyWord();
  };

  handleCompanyOpen = (openKeys) => {
    const { setExpandedCompanyKeys } = this.props.contactStore;
    setExpandedCompanyKeys(openKeys);
  };

  renderGroup = () => {
    const { first } = this.state;

    return (
      <div className='group-div'>
        {first ? <Alert message="请选择群组或公司~" type="info" showIcon/> : this.renderGroupContent()}
      </div>
    )
  };

  renderGroupContent = () => {
    return (
      <div className='group-content'>
        <div className='group-head'>我的群组</div>
        <MyGroupList className="contact-group-list" type='normal'/>
      </div>
    )
  };

  renderCompanyList() {
    let {
      companysTreeData,
      companyExpandedKeys,
      companySelectedKeys,
      fetchCompanysPending,
    } = this.props.contactStore;

    companyExpandedKeys = toJS(companyExpandedKeys);
    companySelectedKeys = toJS(companySelectedKeys);

    if ((!companysTreeData || companysTreeData.length === 0) && !fetchCompanysPending) {
      return (
        <div style={{ padding: 10 }}>
          <Alert message="还没有公司~" type="info" showIcon/>
        </div>
      );
    }

    return (
      <CompanyListTree
        treeData={companysTreeData}
        openKeys={companyExpandedKeys}
        selectedKeys={companySelectedKeys}
        onOpen={this.handleCompanyOpen}
        onSelect={this.handleMenuItemSelect}
        extraMenus={[
          <Menu.Item className='my-group com-extra-menu' key='group'>
            <span>我的群组</span>
          </Menu.Item>
        ]}
      />
    );
  }

  renderSearchDept() {
    const {
      companySelectedKeys,
    } = this.props.contactStore;
    
    let selectedKey = toJS(companySelectedKeys)[ 0 ];

    selectedKey = selectedKey && selectedKey.split('-')[ 1 ];

    if (selectedKey !== 'regroup' && selectedKey !== 'subordinate') {
      return <SearchDept />;
    }
  }

  render() {
    const { group } = this.state;
    const { inputClose } = this.props.contactStore;

    return (
      <Layout className="contact-default-page">
        <Sider className="left-list-wraper" style={{ borderRight: '1px solid #f0f0f0' }}>
          {this.renderCompanyList()}
        </Sider>
        {
          group ? (
            <Layout className="content">
              <Content className='content-group'>
                {this.renderGroup()}
              </Content>
            </Layout>
          ) : (
            <Layout className="content">
              <Sider
                className="content-left-list-wraper"
                width="260"
              >
                {this.renderSearchDept()}
                {this.renderDeptList()}
              </Sider>

              <Content className="content-view-wrapper">
                {inputClose && this.renderContent('search')}
                {!inputClose && this.renderContent()}
              </Content>
            </Layout>
          )
        }
      </Layout>
    );
  }
}

export default Contact;
