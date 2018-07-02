import React, { Component } from 'react';
import { Modal, Button, Radio, Alert } from 'antd';
import ChangeSetting from './ChangeSetting';

@ChangeSetting
export default class ChangeMainCompany extends Component {
	rendenRadioList(list, cValue) {
		if (!list || list.length <= 0) {
			return (
				<Alert message='暂时没有可以选择的主题哦~' type='info' showIcon />
			)
		}

		return (
			<Radio.Group value={cValue} onChange={this.props.handleChangeRadio}>
				{list && list.length > 0 && list.map((v, i) => {
					return (
						<Radio className='company-radio' key={i} value={v.corpid}>{v.tenant_name}</Radio>
					)
				})}
			</Radio.Group>
		)
	}

	render() {
		const { 
			visible,
			handleModal, 
			handleChangeRadio, 
			handleCompanySubmit, 
			companyList, 
			cValue,
			setMainCompanyPending,
		} = this.props;

		return (
			<Modal
				title='切换主企业'
				visible={visible}
				onCancel={() => handleModal(false)}
				maskClosable={false}
				className='change-main-company'
				footer={[
          <Button key='cancle' onClick={() => handleModal(false)}>取消</Button>,
	        <Button key='ok' type="primary" onClick={() => handleCompanySubmit()} loading={setMainCompanyPending}>
	          确定
	        </Button>
        ]}
			>
				{this.rendenRadioList(companyList, cValue)}
			</Modal>
		)
	}
}