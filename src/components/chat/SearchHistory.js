import React, { Component } from 'react';
import { Modal } from 'antd';

export default class SearchHistory extends Component {
  render() {
    const { contentClassName, width, ...otherprops } = this.props;

    return (
      <Modal
        wrapClassName={contentClassName}
        width={width}
        maskClosable={false}
        destroyOnClose
        footer={null}
        {...otherprops}
      >
        {this.props.children}
      </Modal>
    )
  }
}

SearchHistory.defaultProps = {
  width: 550
};
