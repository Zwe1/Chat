import React, { Component } from 'react';
import { toJS } from 'mobx'
import { inject, observer } from 'mobx-react';
import { Input, Icon, Tooltip, Tree, Spin } from 'antd';
import OliAvatar from '../common/Avatar';
import Scrollbars from '../common/scrollbar/SpringScrollbars';

const TreeNode = Tree.TreeNode;

@inject(stores => ({
  contactStore: stores.contactStore,
  dbStore: stores.dbStore,
}))
@observer
export default class SearchDept extends Component {
  constructor(props) {
    super(props);
    this.state = {
      personActive: 0,
      expandKeys: {},
    }
  }

  handleSearchChange = (e) => {
    const inputClose = e.target.value.length > 0;

    const {
    	setKeyWord,
    	setInputClose,
    	setCurrentItem,
      clearSearch,
    } = this.props.contactStore;

    setInputClose(inputClose);
    setKeyWord(e.target.value);

    if (inputClose) {
    	setCurrentItem(null, true);
    	const { selectCompanyId, fetchUserOrDeptSearch } = this.props.contactStore;
      fetchUserOrDeptSearch(e.target.value, selectCompanyId);
    } else {
    	this.setState({
        personActive: 0,
        expandKeys: [],
    	});
      clearSearch();
    }
  };

  handleSearchFocus = (e) => {
    e.target.value.length > 0 && this.props.contactStore.setInputClose(true);
  };

  handleClearInput = () => {
  	const {
    	setKeyWord,
    	setInputClose,
    } = this.props.contactStore;

    setInputClose(false);
    setKeyWord();
  };

  handleTreeOnSelect = (id, selectKeys, i) => {
  	this.props.contactStore.setCurrentItem(selectKeys.node.props.item, true);

  	if (selectKeys.node.props.item.base_user_name) {
  		return;
  	}

  	let { expandKeys } = this.state;
  	const current = selectKeys.node.props.eventKey;

  	if (expandKeys[i] && expandKeys[i].indexOf(current) > -1) {
  		expandKeys[i] = expandKeys[i].filter(id => id !== current);
  	} else {
  		expandKeys[i] = [];
  		expandKeys[i].push(current);
  	}

  	this.setState({
  		expandKeys,
  	});
  };

  handleTreeOnExpand = (id, keys, i) => {
    let { expandKeys } = this.state;

    expandKeys[i] = id;

    this.setState({
      expandKeys,
    });
  };

  handlePersonClick = (user, v) => {
  	this.props.contactStore.setCurrentItem(user, true);
    this.setState({
      personActive: v,
    });
  };

  onLoadData = (treeNode) => {
    const { selectCompanyId, fetchDept } = this.props.contactStore;
    const { changeUpdateBaseUserInfo } = this.props.dbStore;

    return new Promise(async (resolve) => {
      if (treeNode.props.children) {
        resolve();
        return;
      }

      await fetchDept(selectCompanyId, treeNode.props.dataRef.id, treeNode);
      changeUpdateBaseUserInfo();
      resolve();
    });
  };

  handleTreeNodeSelect = async (selectKeys, e) => {
    const node = e.node;
    const item = node.props.dataRef;

    console.log(e);
    console.log(node);

    // 异步加载树，人员不需要再加载
    if (!item.base_user_id) {
      node.props && node.props.loadData && await node.props.loadData(node);
    }

    this.props.contactStore.setCurrentItem(item, true);
    this.setState({
      personActive: null,
    });
  };

  renderDept = (item, name, index, callback = null) => {
    return (
      <TreeNode 
        className='company-li'
        key={`${index}-${item.id}`} 
        dataRef={item}
        title={
          <Tooltip
            overlayClassName='company-tooltip'
            mouseEnterDelay={0.5}
            placement='top'
            title={<span>{name}</span>}
          >
            <span><Icon type='folder' style={{ fontSize: 18 }}/> {name}</span>
          </Tooltip>
        }
      >
        {callback && callback()}
      </TreeNode>
    );
  };

  renderChild = (child, index) => {
    return (
      <TreeNode
        key={`${index}-u-${child.base_user_id}`}
        isLeaf={true}
        className='user-li'
        dataRef={child}
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

  renderTreeNodes = (data) => {
    return data.map((item, i) => {
      let name = item.name || '';
      name = item.total_count || item.total_count == 0 ? `${name}(${item.total_count}人)` : name;

      if (item.children && item.children.length > 0) {
        // 部门
        return this.renderDept(item, name, i, () => this.renderTreeNodes(item.children));
      } else if (item.base_user_id) {
        // 人
        return this.renderChild(item, i);
      } else {
        // 未加载的部门
        return this.renderDept(item, name, i); 
      }
    });
  }

	render() {
		const {
			expandKeys,
      personActive,
		} = this.state;

		const {
			keyword,
			inputClose,
      searchUserList,
      searchDeptList,
      fetchUserAndDeptPending,
		} = this.props.contactStore;

		return (
			<div className={`dept-div ${inputClose ? 'dept-height' : ''}`}>
				<div className='search-div'>
					<Input.Search
	          placeholder='搜索'
	          onChange={this.handleSearchChange}
	          onFocus={this.handleSearchFocus}
	          value={keyword}
	          tabIndex={-1}
	          prefix={inputClose ? <Icon type='close-circle-o' onClick={this.handleClearInput}/> : ''}
	        />
	       </div>
        <Scrollbars
        	className='dept-search-scroll'
        >
          { fetchUserAndDeptPending && <Spin className='dept-search-spin' /> }
        	{ (searchUserList.length === 0 && searchDeptList.length === 0 && !fetchUserAndDeptPending ) && <div className='no-data'>没有找到相关的结果</div> }
	        {
	        	!fetchUserAndDeptPending && searchUserList.map((item, v) => {
        			return (
	        			<div
	        				className={`item-list ${personActive === v ? 'active' : ''}`}
	        				key={v}
	        				onClick={() => this.handlePersonClick(item, v)}
	        			>
	        				<Tooltip
                    overlayClassName='company-tooltip'
                    mouseEnterDelay={0.5}
                    placement='top'
                    title={<span>{item.base_user_name}<br />{item.position}</span>}
	                >
	                  <div className='user-div'>
	                    <OliAvatar size={40} avatarMap={item.avatar} popover={false}/>
	                    <span className='user-span' style={{ marginLeft: 5 }}>
	                      {item.base_user_name}<br />
	                      <b>{item.position}</b>
	                    </span>
	                  </div>
	                </Tooltip>
	        			</div>
	        		)
        		})
	        }
	        {
	        	!fetchUserAndDeptPending && <Tree
              loadData={this.onLoadData}
              className='search-tree'
              onSelect={this.handleTreeNodeSelect}
            >
              {searchDeptList && searchDeptList.length > 0 ? this.renderTreeNodes(searchDeptList) : null}
            </Tree>
	        }
	      </Scrollbars>
			</div>
		)
	}
}
