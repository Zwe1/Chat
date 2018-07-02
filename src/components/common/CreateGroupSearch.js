import React, { Component } from 'react';
import { Icon, Input, Popover, Spin } from 'antd';
import { inject, observer } from 'mobx-react';
import OliAvatar from '../common/Avatar';
import SpringScrollbars from '../common/scrollbar/SpringScrollbars';

import $ from 'jquery';

const FirstNum = 3;	// 第一次加载的数量
const ListNum = 30;	//	加载更多的时候加载数量
const ListHeight = 67; // 每一个List的高度

@inject(stores => ({
  dbStore: stores.dbStore,
  contactStore: stores.contactStore,
  appStore: stores.appStore,
}))
@observer
export default class CreateGroupSearch extends Component {
	constructor(props) {
		super(props);
		this.state = {
			inputClose: false,
			keyword: '',
			showVisible: false,
			showMoreNum: FirstNum,
			listIndex: 0,
		}

		this.visibleFlag = 0;
	}

	bindOnkeyDown = (type = false) => {
    if (!type) {
      window.onkeydown = null;
      return;
    }

    window.onkeydown = (e) => {
      //38: 上 40: 下 enter: 13
      if (e && e.preventDefault && (e.keyCode === 38 || e.keyCode === 40 || e.keyCode === 13)) {
        e.preventDefault(); 
      }
      if (e.keyCode === 38) {
        this.changeIndex(-1);
        return false;
      }
      if (e.keyCode === 40) {
        this.changeIndex(1);
        return false;
      }
      if (e.keyCode === 13) {
      	$('.all-chat-search-li.active').click();
        return false;
      }
    }
  };

  // 上下键盘按钮设置listIndex
  changeIndex = index => {
  	const {
  		listIndex,
  		showMoreNum,
  	} = this.state;

  	const {
			networkUserList,
		} = this.props.contactStore;

		const scrollbar = this.refs['searchChatScrollbars'];

		const length = networkUserList.length;

  	let i = this.state.listIndex + index;

  	if (i < 0) {
  		i = 0;
  	}

  	if (length > showMoreNum) {
  		if (i >= showMoreNum) {
	  		i = showMoreNum;
	  	}
  	} else if (length < showMoreNum) {
  		if (i >= length) {
  			i = length - 1;
  		}
  	} else {
  		if (i >= showMoreNum) {
	  		i = showMoreNum - 1;
	  	}
  	}

  	this.setState({
  		listIndex: i,
  	});

  	scrollbar && scrollbar.scrollTo( i * ListHeight );
  };

  // 设置ListIndex为默认值
  clearListIndex = () => {
  	this.setState({
  		listIndex: 0,
  	});
  }

	handleVisibleChange = visible => {
    if (this.visibleFlag === 1) { // 点击搜索框
      this.setState({
        visible: true,
      });
      this.visibleFlag = 0;
      this.bindOnkeyDown(true); // 绑定键盘事件
      return;
    }

    // 只有点击空白地方会进入这里
    this.visibleFlag = 0;
    this.bindOnkeyDown(); // 取消绑定
    this.clearListIndex();
    this.setState({
      visible,
      inputClose: false,
      showVisible: visible,
    });
  };

  // 搜索框点击
  handleSearchClick = () => {
    this.visibleFlag = 1;
  };

  // 搜索框获取焦点
  handleSearchFocus = (e) => {
    e.target.value.length > 0 && this.setState({ 
    	inputClose: true,
    	showVisible: true,
    });
  };

  // 删除搜索框内容
  handleclearInput = () => {
    this.setState({
      keyword: '',
      inputClose: false,
      showVisible: false,
    });
    this.bindOnkeyDown(); // 取消绑定
    this.clearListIndex();
  };

  // 搜索框内容改变
	handleSearchChange = async (e) => {
    let inputClose = e.target.value.length > 0;

    this.setState({
      keyword: e.target.value,
    	showVisible: inputClose,
      inputClose,
    });

    if (inputClose) {
    	this.bindOnkeyDown(true); // 添加键盘绑定
    	await this.props.contactStore.fetchUserOrGroupSearch(e.target.value, 'users');
    } else {
    	this.bindOnkeyDown(); // 取消绑定
    	this.clearListIndex();
    }

    this.setState({
    	showMoreNum: FirstNum,
    });
  };

  // 加载更多
  handleLoadMore = () => {
  	this.setState({
  		showMoreNum: this.state.showMoreNum + ListNum,
  	});
  };

  // item点击
  handleItemClick = item => {
  	this.props.handleSearchCheckedUser(item);
  	this.handleclearInput();
  }

  renderContent = list => {
  	const {
  		fetchUserSearchPending,
  	} = this.props.contactStore;

  	if (fetchUserSearchPending['users']) {
  		return <Spin className='network-spin' />
  	}

  	// 网络加载无数据
  	if (list.length === 0) {
  		return (
	  		<p className='no-data'>没有匹配到任何结果</p>
	  	);
  	}

  	return this.renderScorll(this.renderUser(list));
  };

  renderScorll = children => {
  	return (
  		<SpringScrollbars
	      autoHide
	      autoHeightMin={'100%'}
	      autoHeightMax={'100%'}
	      style={{
	        height: '100%',
	        position: 'relative'
	      }}
	      ref={`searchChatScrollbars`}
	    >
	      {children}
	    </SpringScrollbars>
	  )
  };

  renderUser = list => {
  	const {
  		showMoreNum,
  		listIndex,
  	} = this.state;

  	const loadMoreUser = list.length > showMoreNum ? (
  		<div
  			className={`load-more all-chat-search-li ${listIndex === showMoreNum ? 'active' : ''}`}
  			onClick={() => this.handleLoadMore()}
	    >
	    <h2><Icon type='search'/>查看更多搜索结果</h2>
	  </div>) : <div className='load-over'>已经加载完毕了哦~</div>;

  	return (
  		<div className='list-chat-content'>
  			{
  				list.slice(0, showMoreNum).map((item, i) => {
			  		const { 
			  			keyword,
			  		} = this.state;
			  		const reg = new RegExp(`${keyword}`, 'g');
			  		const userName = item.name.replace(reg, `<span>${keyword}</span>`);

			  		return (
			  			<div 
			  				className={`list all-chat-search-li ${listIndex === i ? 'active' : ''}`}
			  				key={i}
			  				onClick={() => this.handleItemClick(item)}
			  			>
				        <OliAvatar
				          size={40}
				          avatarMap={item.avatar}
				          id={item.id}
				          popover={false}
				        />
				        <div className='user-content'>
				          <h3 className='single' dangerouslySetInnerHTML={{__html: userName}} />
				          {/*<h4>{item.deptlist && item.deptlist.length > 0 ? item.deptlist[0].path : '部门'}</h4>
				          <h5>{item.position}</h5>*/}
				        </div>
			  			</div>
			  		)
					})
  			}
  			{
  				loadMoreUser
  			}
  		</div>
		)
  }

	render() {
		const {
			inputClose,
			keyword,
			showVisible,
		} = this.state;

		const {
			networkUserList,
		} = this.props.contactStore;

		const content = this.renderContent(networkUserList);

		return (
			<div className='create-group-search'>
				<Popover
          overlayClassName={`create-group-search-popover ${networkUserList.length === 0 ? 'create-group-search-popover-no-result' : ''}`}
          placement="bottomLeft"
          content={content}
          visible={showVisible}
          trigger='click'
          onVisibleChange={this.handleVisibleChange}
        >
	        <Input.Search
	        	className='create-group-search-input'
	          placeholder='搜索名字，拼音...'
	          onChange={this.handleSearchChange}
	          onFocus={this.handleSearchFocus}
	          onClick={this.handleSearchClick}
	          value={keyword}
	          tabIndex={-1}
	          prefix={inputClose ? <Icon type='close-circle-o' onClick={this.handleclearInput}/> : ''}
	        />
	      </Popover>
      </div>
		)
	}
}