import React, { Component } from "react";


/**
 * 
 */
export default class ChatMessageList extends Component {

  constructor(props) {
    super(props);

    this.state = {
      activeKey: props.activeKey
    }
  }

  /**
   * 
   * @param {*} nextProps 
   */
  componentWillReceiveProps(nextProps) {
    this.setState({
      activeKey: nextProps.activeKey
    });
  }

  renderPanels() {
    const props = this.props;
    const activeKey = props.activeKey;
    const children = props.children;
    const newChildren = [];

    React.Children.forEach(children, (child) => {
      if (!child) {
        return;
      }

      const key = child.key;
      const active = activeKey === key;
      newChildren.push(React.cloneElement(child, {
        active: active,
      }));
    });

    return newChildren;
  }

  render() {
    return (
      <div 
        className="chat-message-list-container"
        style={{
          bottom: this.props.bottom
        }}
      >
        {this.renderPanels()}
      </div>
    );
  }

}

ChatMessageList.defaultProps = {
  // 打开的 panel
  activeKey: '',
  bottom: 120,
};