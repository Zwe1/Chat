import React, { Component } from "react";

import { Spin, Switch } from "antd";

export default class LinkSettingItem extends Component {

  constructor(props) {
    super(props);
  }

  // componentWillReceiveProps(nextProps) {
  //   const { checked } = nextProps;
  //   if (checked !== this.state.checked) {
  //     this.setState({
  //       checked
  //     });
  //   }
  // }

  handleClick = (e) => {
    const { onClick } = this.props;
    onClick(e);
  };

  render() {
    const { label, checkedLabel, unCheckedLabel, loading } = this.props;

    return (
      <Spin spinning={loading}>
        <li className="setting-item link" onClick={this.handleClick}>
          <span>{label}</span>
        </li>
      </Spin>
    );
  }

}

LinkSettingItem.defaultProps = {
  label: '',
  loading: false,
  withArrow: false,
  onClick: () => {}
};