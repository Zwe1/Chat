import React, { Component } from 'react';
import { Icon, Tree, Tooltip, Select } from 'antd';
import { inject, observer } from 'mobx-react';
import $ from 'jquery';

import { TiGroup } from 'react-icons/lib/ti';

import OliAvatar from '../common/Avatar';
import Scrollbars from '../common/scrollbar/SpringScrollbars';

const TreeNode = Tree.TreeNode;
const Option = Select.Option;

let treeSingleInterval = null;
let treeSingleFlag = 0; // 检查次数

@inject(stores => ({
  contactStore: stores.contactStore,
  dbStore: stores.dbStore,
}))
@observer
class DeptListTree extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    $('.dept-tree > .company-li > .ant-tree-switcher_close').click();
  }

  componentDidUpdate() {
    const { 
      deptTreeRootClick, 
      setdeptTreeRootClick, 
      deptTreeSingleClick, 
      setDeptTreeSingleClick, 
      removedChecked, 
      setRemovedChecked 
    } = this.props.contactStore;

    if (removedChecked.length > 0) {
      removedChecked.map(v => {
        const id = `.${v}`;
        if ($(id).length > 0) {
          let re = removedChecked.filter(m => m !== v);
          if (setRemovedChecked(re)) {
            $(id).find('.ant-tree-checkbox').click();
          }
        }
      })
    }

    if (deptTreeRootClick) {
      setdeptTreeRootClick(false);
      setTimeout(() => {
        $('.dept-tree > .company-li > .ant-tree-switcher_close').click();
      }, 300);
    }

    if (deptTreeSingleClick && !treeSingleInterval) {
      treeSingleInterval = setInterval(() => {
        if ($('.company-li > .ant-tree-child-tree-open').find('li').length === 1 && $('.company-li > .ant-tree-child-tree-open > .company-li > .ant-tree-switcher_close').length) { // 查找根节点下只有一个child-tree，并且没有展开
          setDeptTreeSingleClick(false);
          clearInterval(treeSingleInterval);
          treeSingleInterval = null;
          $('.company-li > .ant-tree-child-tree-open > .company-li > .ant-tree-switcher_close').click();
        } else {
          treeSingleFlag++;
          if (treeSingleFlag === 15) {
            clearInterval(treeSingleInterval);
            treeSingleInterval = null;
          }
        }
      }, 200);
    }
  }

  handleDeptTreeExpand = (expandedKeys, node) => {
    this.props.onExpand(expandedKeys, node.node.props.item);
  };

  handleTreeNodeSelect = async (selectKeys, e) => {
    const node = e.node;
    const item = node.props.dataRef;

    // 异步加载树，人员不需要再加载
    if (!item.base_user_id) {
      node.props && node.props.loadData && await node.props.loadData(node);
    }

    this.props.contactStore.setCurrentItem(item);
  };

  /**
   * checkedKeys, e:{checked: bool, checkedNodes, node, event}
   *
   * @param id
   * @param checkedKeys
   * @param e
   */
  handleTreeNodeCheck = (checkedKeys, e) => {
    const node = e.node;
    const item = node.props.dataRef;

    this.props.onCheck(checkedKeys, item, e);
  };

  handleSelectChange = value => {
    const { setdeptTreeRootClick, setSelectValue } = this.props.contactStore;

    setdeptTreeRootClick(true);
    setSelectValue(parseInt(value));
  };

  onLoadData = (treeNode) => {
    const { 
      selectCompanyId,
      fetchDept,
      selectCompanyType,
    } = this.props.contactStore;

    const { 
      changeUpdateBaseUserInfo,
    } = this.props.dbStore;

    return new Promise(async (resolve) => {
      if (treeNode.props.children) {
        if (treeNode.props.dataRef.hasnext && (selectCompanyType === 2 || selectCompanyType === 3)) {
          await fetchDept(selectCompanyId, treeNode.props.dataRef.id, treeNode);
          changeUpdateBaseUserInfo();
          resolve();
          return
        } else {
          resolve();
          return;
        }
      }

      await fetchDept(selectCompanyId, treeNode.props.dataRef.id, treeNode);
      changeUpdateBaseUserInfo();
      resolve();
    });
  };

  renderDept = (item, name, zIndex, index, callback = null) => {
    const { 
      selectCompanyId,
      selectCompanyType,
      companySelectedKeys = [],
    } = this.props.contactStore;

    const selectedKey = companySelectedKeys[ 0 ];
    const selectedStr = selectedKey && selectedKey.split('-')[ 1 ];

    let icon = '';
    if (zIndex === 0) {
      if (selectedStr === 'subordinate') {
        icon = <TiGroup className='tree-icon' />;
      } else {
        icon = <Icon type='home' style={{ fontSize: 18 }} />;
      }
    } else {
      if (selectedStr === 'regroup' && item.type === 'group') {
        icon = <Icon type='team' style={{ fontSize: 18 }} />;
      } else {
        icon = <Icon type='folder' style={{ fontSize: 18 }} />;
      }
    }

    let key = '';

    switch(selectCompanyType) {
      case 0:
        key = 'all';
        break;
      case 1:
        key = 'my';
        break;
      case 2:
        key = 'regroup';
        item.id = !item.id ? item.groupid : item.id;
        name = !name ? item.group_name : name;
        break;
      case 3:
        key = 'subordinate';
        break;
    }

    // 判断部门是否是叶子节点(默认不是)
    let isLeaf = false;
    if (item.hasnext === false) {
      if ('children' in item) {
        if (item.children.length === 0) {
          isLeaf = true;
        }
      } else {
        isLeaf = true;
      }
    }

    return (
      <TreeNode 
        className='company-li'
        key={`${index}-${item.id}-${selectCompanyId}-${key}`} 
        dataRef={item}
        isLeaf={isLeaf}
        title={
          <Tooltip
            overlayClassName='company-tooltip'
            mouseEnterDelay={0.5}
            placement='top'
            title={<span>{name}</span>}
          >
            <span>{icon} {name}</span>
          </Tooltip>
        }
      >
        {callback && callback()}
      </TreeNode>
    );
  };

  renderChild = (child, disabledKeys, index) => {
    // console.log('render child:', child, disabledKeys);
    let dummyId = child.base_user_id || child.id;
    let isDisabled = disabledKeys && disabledKeys.indexOf(dummyId) > -1;

    return (
      <TreeNode
        key={`${index}-u-${child.base_user_id}`}
        isLeaf={true}
        disabled={isDisabled}
        selectable={!isDisabled}
        className={`user-li ${index}-u-${child.base_user_id}`}
        dataRef={child}
        disableCheckbox={isDisabled}
        title={
          <Tooltip
            overlayClassName='company-tooltip'
            mouseEnterDelay={0.5}
            placement='top'
            title={<span>{child.name}<br />{child.position}</span>}
          >
            <div className='user-div'>
              <OliAvatar size={40} avatarMap={child.avatar} popover={false}/>
              <span className='user-span' style={{ marginLeft: 5 }}>
                {child.name}<br />
                <b>{child.position}</b>
              </span>
            </div>
          </Tooltip>
        }
      />
    );
  };

  renderTreeNodes = (data, disabledKeys, zIndex = 0, rootFlag = true) => {
    const { showCount } = this.props;
    const { 
      selectValue,
      companySelectedKeys,
    } = this.props.contactStore;

    const selectedKey = companySelectedKeys && companySelectedKeys.length > 0 ? companySelectedKeys[ 0 ] : '';
    const selectedStr = selectedKey && selectedKey.split('-')[ 1 ];

    let finalData = data;

    if (rootFlag && (selectedStr === 'org' || selectedStr === 'mydept')) { // 如果是组织结构和我的部门
      finalData = [data[selectValue]];
    }

    return finalData && finalData.length > 0 && finalData.map(item => {
      let name = item.name || '';
      if (showCount) {
        name = item.total_count || item.total_count == 0 ? `${name}(${item.total_count}人)` : name;
      }

      if (item.children && item.children.length > 0) {
        return this.renderDept(item, name, zIndex, selectValue, () => this.renderTreeNodes(item.children, disabledKeys, 1, false));
      } else if (item.base_user_id) {
        // 人
        return this.renderChild(item, disabledKeys, selectValue);
      } else {
        // 未加载的部门
        return this.renderDept(item, name, zIndex, selectValue); 
      }
    });
  };

  renderSelect = (deptData, showCount) => {
    const {
      selectValue,
    } = this.props.contactStore;

    return (
      <Select value={`${selectValue}`} onChange={this.handleSelectChange}>
        {deptData.map((item, i) => {
          let name = item.name || '';
          if (showCount) {
            name = item.total_count || item.total_count == 0 ? `${name}(${item.total_count}人)` : name;
          }
          return (
            <Option value={i} key={i}>{name}</Option>
          );
        })}
      </Select>
    );
  };

  renderTree = (deptData, checkable, disabledKeys, treeOptions) => {
    return (
      <Tree
        loadData={this.onLoadData}
        className={`dept-tree ${checkable ? 'tree-checked' : 'no-checked'}`}
        {...treeOptions}
      >
        {
          deptData && deptData.length > 0 
            ? this.renderTreeNodes(deptData, disabledKeys) 
            : null
        }
      </Tree>
    )
  };

  render() {
    let {
      defaultExpandedKeys,
      deptData,
      expandedKeys,
      selectedKeys,
      checkedKeys,
      checkable,
      inputClose,
      showCount,
      className,
      type,
    } = this.props;

    const {
      updateBaseUserInfo
    } = this.props.dbStore;

    const { 
      selectValue,
      selectCompanyId,
      selectCompanyType
    } = this.props.contactStore;
    
    let disabledKeys = [];
    
    let treeOptions = {
      defaultExpandedKeys,
      checkable,
      showIcon: false,
      autoExpandParent: false,
      onSelect: this.handleTreeNodeSelect,
      onExpand: this.handleDeptTreeExpand,
      onCheck: this.handleTreeNodeCheck,
    };

    let key = '';

    switch(selectCompanyType) {
      case 0:
        key = 'all';
        break;
      case 1:
        key = 'my';
        break;
      case 2:
        key = 'regroup';
        break;
      case 3:
        key = 'subordinate';
        break;
      default:
        key = '';
        break;
    }

    if ('expandedKeys' in this.props) {
      treeOptions.expandedKeys = this.props.expandedKeys || [];
    }

    if ('selectedKeys' in this.props) {
      treeOptions.selectedKeys = this.props.selectedKeys || [];
    }

    if ('disabledKeys' in this.props) {
      disabledKeys = this.props.disabledKeys || [];
    }

    if ('checkedKeys' in this.props) {
      const company = `${selectCompanyId}-${key}`;

      if (this.props.checkedKeys[ company ]) {
        treeOptions.checkedKeys = this.props.checkedKeys[ company ][ selectValue ] || [];
      } else {
        treeOptions.checkedKeys = [];
      }
    }

    return (
      !inputClose ? type === 'scroll' ? <Scrollbars
        className={`dept-tree-scroll ${className}`}
        renderTrackHorizontal={null}
      >
        <div className='dept-tree-content'>
          {
            (deptData.length > 1 && deptData[0].parentid === 0) 
              ? this.renderSelect(deptData, showCount) 
              : null
          }
          {this.renderTree(deptData, checkable, disabledKeys, treeOptions)}
        </div>
      </Scrollbars> : <div className='dept-tree-content'>
        {
          (deptData.length > 1 && deptData[0].parentid === 0) 
            ? this.renderSelect(deptData, showCount) 
            : null
        }
        {this.renderTree(deptData, checkable, disabledKeys, treeOptions)}
      </div> : ''
    );
  }

}

/**
 *  disabledKeys, checkedKey, selectedKeys, expandedKeys 属于可控可不控属性不能提供默认值
 *  这四个的格式应该要一致 就是
 *     keys = { id: [ keys ] }
 *
 * 现在 暂时不区分公司 每次都直接传入所有的 id 这样肯定保证所有公司都选中
 */
DeptListTree.defaultProps = {
  deptData: [],
  checkable: false,
  showCount: true,
  defaultExpandedKeys: [],
  className: '',
  type: 'scroll',
  //expandedKeys: [],
  //selectedKeys: [],

  onExpand: () => {
  },
  onCheck: () => {
  },
  onSelect: () => {
  }
};

export default DeptListTree;
