import React, { Component } from 'react';
import classnames from 'classnames';

import oliEmoji from './oli-emoji';
const emojiList = oliEmoji.getAllEmojiPositions();

import { Popover, Icon, Tabs } from 'antd';
const TabPane = Tabs.TabPane;

export default class EmojiPicker extends Component {
  static propTypes = {};

  constructor(props) {
    super(props);

    this.state = {
      visible: false
    };
  }

  hide = () => {
    this.setState({
      visible: false,
    });
  };

  handleVisibleChange = (visible) => {
    this.setState({ visible });
  };

  /**
   *
   * @param emoji
   */
  handleClickEmoji = (emoji) => {
    console.log('choose emoji:', emoji);
    // this.hide();

    const realEmoji = oliEmoji.getEmojiBySymbol(emoji.name);
    this.props.onSelect(realEmoji);
  };

  handleEmojiTabClick = () => {

  };

  renderGrid() {
    return (
      <div className="emoji-wrapper">
        {emojiList.map((item, index) => {
          return (
            <span
              key={index}
              className="oli-emoji-content"
              style={{
                backgroundPosition: item.position
              }}
              onClick={this.handleClickEmoji.bind(this, item)}
            />
          );
        })}
      </div>
    );
  }

  renderTabs() {
    return (
      <Tabs
        animated={false}
        className="emoji-tabs"
        defaultActiveKey="1"
        onTabClick={this.handleEmojiTabClick}
        size="small"
        tabPosition="bottom"
      >
        <TabPane tab="表情" key="1">
          {this.renderGrid()}
        </TabPane>
        <TabPane tab="另一组表情" key="2">Content of Tab 2</TabPane>
      </Tabs>
    );
  }

  /**
   * 表情必备条件：
   *   1、弹出框
   *   2、表情显示，表情显示的时候，从一张大图片上面使用css 定位来显示，
   *   3、点击表情选择，我选择了表情，需要记录下我选择的表情的代码，类似于 { '代码': '坐标或者图片路径' }
   *   4、聊天内容要显示表情的话，过滤聊天的内容，提取出表情的代码，然后替换表情，怎么替换，替换成什么，假设一个表情就是一个 span，
   *      根据表情的代码找到对应的坐标或图片地址 设置上去就好了，renderMessage 的时候一定要有这个 过滤的过程，后续添加自定义表情，
   *      只要有代码和表情文件就可以显示表情了。
   *   6、
   *
   *
   * @returns {XML}
   */
  render() {
    const content = this.renderTabs();

    return (
      <Popover
        className="common-emoji-picker"
        content={content}
        placement="topLeft"
        trigger="click"
        visible={this.state.visible}
        onVisibleChange={this.handleVisibleChange}
      >
        <Icon type="smile-o"/>
      </Popover>
    );
  }
}


EmojiPicker.defaultProps = {
  /**
   * 选中表情的时候
   */
  onSelect() {},

  // 下面这两个没用
  width: 0,
  height: 0,
};
