import React, { Component } from "react";

import { Switch } from "antd";

export default class SwitchSettingItem extends Component {

  constructor(props) {
    super(props);

    const { checked } = props;
    this.state = {
      checked
    };
  }

  componentWillReceiveProps(nextProps) {
    const { checked } = nextProps;
    if (checked !== this.state.checked) {
      this.setState({
        checked
      });
    }
  }

  handleSwitchChange = (e) => {
    const { onChange } = this.props;
    onChange(e);
  };

  render() {
    const { label, checkedLabel, unCheckedLabel, loading, disabled } = this.props;
    const { checked } = this.state;

    return (
      <li className="setting-item switch">
        <span className="label">{label}</span>
        <Switch 
          onChange={this.handleSwitchChange}
          disabled={disabled}
          checked={checked} 
          loading={loading}
          checkedChildren={checkedLabel} 
          unCheckedChildren={unCheckedLabel} 
        />
      </li>
    );
  }

}

SwitchSettingItem.defaultProps = {
  label: '',
  disabled: false,
  loading: false,
  checked: false,
  checkedLabel: false,
  unCheckedLabel: false,
};
