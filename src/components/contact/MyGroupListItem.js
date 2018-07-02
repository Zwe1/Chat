import React, { Component } from 'react';
import { Checkbox, Spin, message as antdMessage } from 'antd';

import OliAvatar from '../common/Avatar';

import Scrollbars from 'react-custom-scrollbars';

export default class MyGroupListItem extends Component {

  constructor(props) {
		super(props);
		this.state = {
			indeterminate: false, // 全选框的style
      checkAll: false, // 全选框是否选中
      checkList: [], // 选中的列表
    };

		this.checkLength = 0;
	}

	componentWillReceiveProps(nextProps) {
		if (nextProps.removedUser !== this.props.removedUser) {
			const { checkList } = this.state;
			const { removedUser } = nextProps;
		  const afterGroupClose = checkList.filter(id => id !== removedUser.base_user_id);
      this.setState({
        checkList: afterGroupClose,
        indeterminate: afterGroupClose.length !== 0,
        checkAll: false,
      });
      this.checkLength--;
		}

		if (nextProps.groupInfoToCreate === this.props.groupInfoToCreate) {
			return;
		}

		const {
      checkedUsers,
      pending,
      groupInfoToCreate,
    } = nextProps;

    if (!pending) {
      const memberlist = groupInfoToCreate.memberlist || [];
      const afterMerge = memberlist.filter(mem => {
        for (let user of checkedUsers) {
          if (mem.base_user_id === user.base_user_id) {
            return true;
          }
        }
        return false;
      }).map(v => v.base_user_id);

      this.checkLength = afterMerge.length;

      const checkAll = afterMerge.length === memberlist.length;
      const indeterminate = !!afterMerge.length && (afterMerge.length < memberlist.length);

      this.setState({
        checkList: afterMerge,
        checkAll: checkAll,
        indeterminate: indeterminate,
      });
    }
	}

	// 群组人员选择
	handleCheckboxChange = (checkList) => {
		const { checkedUsers, count, setCount, setCheckedUsers, groupInfoToCreate, maxCount } = this.props;
		const memList = groupInfoToCreate.memberlist;
    let noCheckMemList = [];
    const memLength = memList.length;

    const checkMemList = memList.filter(mem => {
      for (let check of checkList) {
        if (mem.base_user_id === check) {
          return true;
        }
      }
      noCheckMemList = [...noCheckMemList, mem];
      return false;
    });

    let afterMerge = null;

    if (checkList.length < this.checkLength) {
      afterMerge = _.differenceBy(checkedUsers, noCheckMemList, 'base_user_id');
      setCount(count - 1);
      this.checkLength--;
    } else {

	    if (count + 1 > maxCount) {
    		antdMessage.error(`群聊人数不能超过 ${maxCount} ~`);
    		return;
    	}

      afterMerge = _.uniqBy([...checkedUsers, ...checkMemList], 'base_user_id');
      setCount(count + 1);
      this.checkLength++;
    }

    this.setState({
      checkList,
      indeterminate: !!checkList.length && (checkList.length < memLength),
      checkAll: checkList.length === memLength,
    });
    setCheckedUsers(afterMerge);
	};

	// 群组人员全选
	handleCheckAllChange = (e) => {
		const { checkList } = this.state;
		const { checkedUsers, count, setCount, setCheckedUsers, groupInfoToCreate, maxCount } = this.props;

		const memList = groupInfoToCreate.memberlist;
		const memListId = memList && memList.map(v => v.base_user_id);
    const memLength = memList.length;
    let afterMerge = null;

    if (e.target.checked) {
      afterMerge = _.uniqBy([...checkedUsers, ...memList], 'base_user_id');

      if (count + afterMerge.length > maxCount) {
    		antdMessage.error(`群聊人数不能超过 ${maxCount} ~`);
    	}	

      this.checkLength = memLength;
    } else {
      afterMerge = _.differenceBy(checkedUsers, memList, 'base_user_id');
      this.checkLength = 0;
    }

    this.setState({
      checkList: e.target.checked ? memListId : [],
      indeterminate: false,
      checkAll: e.target.checked,
    });
    setCheckedUsers(afterMerge);
    setCount(e.target.checked ? (count + memLength - checkList.length) : (count - memLength));
	};

	render() {
		const {
			indeterminate,
			checkAll,
			checkList,
		} = this.state;

		const { 
			groupInfoToCreate,
			pending
		} = this.props;

		if (pending) {
			return (
				<div className='group-spin'>
					<Spin />
				</div>
			)
		}

		return (
			<div className='group-list-item'>
				<div className='head'>
					{groupInfoToCreate.name}
				</div>
        <Scrollbars
          className="all-group-scrollbar"
          style={{ height: '95%' }}
        >
	      	<Checkbox
            indeterminate={indeterminate}
            onChange={this.handleCheckAllChange}
            checked={checkAll}
            className='check-all'
          >
            <span className='check-all-name'>全选</span>
          </Checkbox>
          <Checkbox.Group
            className="checkbox-all-group-wrapper"
            onChange={this.handleCheckboxChange}
            value={checkList}
          >
	          {groupInfoToCreate.memberlist && groupInfoToCreate.memberlist.map((v, i) => {
	          	return (
	          		<div className='info-list' key={i}>
	          			<Checkbox value={v.base_user_id}>
	          				<OliAvatar size={30} avatarMap={v.avatar} popover={false}/>
	          				<span className='info-name'>{v.base_user_name}</span>
	          			</Checkbox>
	          		</div>
	          	)
	          })}
	        </Checkbox.Group>
	      </Scrollbars>
	    </div>
		)
	}
}