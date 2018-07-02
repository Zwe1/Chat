import React, { Component } from "react";
import { Checkbox, message as antdMessage } from "antd";

import Scrollbars from "react-custom-scrollbars";

import { getChatList } from "../../lowdb/lowdbChatList";

import OliAvatar from "../common/Avatar";
import OliSimpleSpan from "../common/prop/SimpleSpan";

export default class RecentChatList extends Component {

  constructor(props) {
    super(props);

    this.state = {
      chatList: [],
      indeterminate: false, // 全选框的style
      checkAll: false, // 全选框是否选中
      checkList: [], // 选中的列表
    };

    this.checkLength = 0;
  }

  componentDidMount() {
    let chatList = getChatList();

    this.setState({
      chatList,
    });
  }

  componentWillReceiveProps(nextProps) {
    console.log('recent chat list component will receice props');

    if (nextProps.removedUser !== this.props.removedUser) {
      const { checkList } = this.state;
      const { removedUser } = nextProps;
      const afterGroupClose = checkList.filter(id => id !== removedUser.id);
      this.setState({
        checkList: afterGroupClose,
        indeterminate: afterGroupClose.length !== 0,
        checkAll: false,
      });
      this.checkLength--;
    }

    const { checkedUsers } = nextProps;
    const { chatList } = this.state;

    const afterMerge = chatList.filter(mem => {
      for (let user of checkedUsers) {
        if (mem.id === user.id) {
          return true;
        }
      }
      return false;
    }).map(v => v.id);

    this.checkLength = afterMerge.length;
    const indeterminate = !!afterMerge.length && (afterMerge.length < chatList.length);

    this.setState({
      checkList: afterMerge,
      checkAll: afterMerge.length === chatList.length,
      indeterminate: indeterminate,
    });
  }

  // 群组人员选择
  handleCheckboxChange = (checkList) => {
    const {
      checkedUsers,
      count,
      setCount,
      setCheckedUsers,
      maxCount
    } = this.props;

    const chatList = this.state.chatList;
    const memLength = chatList.length;

    let noCheckMemList = [];
    const checkMemList = chatList.filter(mem => {
      for (let check of checkList) {
        if (mem.id === check) {
          return true;
        }
      }

      noCheckMemList = [ ...noCheckMemList, mem ];
      return false;
    });

    let afterMerge = null;
    if (checkList.length < this.checkLength) {
      afterMerge = _.differenceBy(checkedUsers, noCheckMemList, 'id');
      this.checkLength--;
    } else {
      if (count + 1 > maxCount) {
        antdMessage.error(`群聊人数不能超过 ${maxCount} ~`);
        return;
      }

      afterMerge = _.uniqBy([ ...checkedUsers, ...checkMemList ], 'id');
      this.checkLength++;
    }

    this.setState({
      checkList,
      indeterminate: !!checkList.length && (checkList.length < memLength),
      checkAll: checkList.length === memLength,
    });

    setCount(afterMerge.length);
    setCheckedUsers(afterMerge);
  };

  // 群组人员全选
  handleCheckAllChange = (e) => {
    const {
      checkList,
      chatList
    } = this.state;

    const {
      checkedUsers,
      count,
      setCount,
      setCheckedUsers,
      maxCount
    } = this.props;

    const memListId = chatList.map(v => v.id);
    const memLength = chatList.length;
    let afterMerge = null;

    if (e.target.checked) {
      afterMerge = _.uniqBy([ ...checkedUsers, ...chatList ], 'id');

      if (count + afterMerge.length > maxCount) {
        antdMessage.error(`群聊人数不能超过 ${maxCount} ~`);
      }

      this.checkLength = memLength;
    } else {
      afterMerge = _.differenceBy(checkedUsers, chatList, 'id');
      this.checkLength = 0;
    }

    this.setState({
      checkList: e.target.checked ? memListId : [],
      indeterminate: false,
      checkAll: e.target.checked,
    });

    setCheckedUsers(afterMerge);
    setCount(afterMerge.length);
  };

  render() {
    const {
      indeterminate,
      checkAll,
      checkList,
      chatList
    } = this.state;

    return (
      <Scrollbars className="recent-chat-list">
        <Checkbox
          indeterminate={indeterminate}
          onChange={this.handleCheckAllChange}
          checked={checkAll}
          className='check-all'
        >
          <span className='check-all-name'>全选</span>
        </Checkbox>
        <Checkbox.Group
          className="recent-chat-list-ck-group"
          onChange={this.handleCheckboxChange}
          value={checkList}
        >
          {chatList.map((item, index) => {
            let type = item.isGroup ? 'group' : 'user';

            return (
              <div className='recent-chat-list-ck' key={index}>
                <Checkbox value={item.id}>
                  <OliAvatar size={40} type={type} id={item.id} popover={false} />
                  {
                    item.isGroup
                      ? <OliSimpleSpan className="name" groupId={item.id} prop="groupName" defaultValue={item.name}/>
                      : <OliSimpleSpan className="name" userId={item.id} prop="base_user_name"/>
                  }
                </Checkbox>
              </div>
            )
          })}
        </Checkbox.Group>
      </Scrollbars>
    )
  }
}