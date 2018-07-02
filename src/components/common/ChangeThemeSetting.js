import React, { Component } from 'react';
import { Modal, Button, Radio, Alert } from 'antd';
import ChangeSetting from './ChangeSetting';

@ChangeSetting
export default class ChangeThemeSetting extends Component {
	rendenRadioList(list, rValue) {
		if (!list || list.length <= 0) {
			return (
				<Alert message='暂时没有可以选择的主题哦~' type='info' showIcon />
			)
		}

		return (
			<Radio.Group value={rValue} onChange={this.props.handleChangeRadio}>
				{list && list.length > 0 && list.map((v, i) => {
					return (
						<div className='company' key={i}>
							<div className='company-head'>{v.tenant_name}</div>
							{v.themelist.map((r, index) => <Radio key={index} value={r.theme_id}>{r.theme_name}</Radio>)}
						</div>
					)
				})}
			</Radio.Group>
		)
	}

	render() {
		const { visible, handleModal, themeList, selectThemePending, rValue, handleThemeSubmit } = this.props;

		return (
			<Modal
				title='切换主题'
				visible={visible}
				onCancel={() => handleModal(false)}
				maskClosable={false}
				className='change-theme-setting'
				footer={[
          <Button key='cancle' onClick={() => handleModal(false)}>取消</Button>,
	        <Button key='ok' type="primary" onClick={() => handleThemeSubmit()} loading={selectThemePending}>
	          确定
	        </Button>
        ]}
			>
				{this.rendenRadioList(themeList, rValue)}
			</Modal>
		)
	}
}