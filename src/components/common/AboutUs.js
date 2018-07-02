import React, { Component } from 'react';
import { Modal } from 'antd';
import pack from '../../../package.json';

export default class AboutUs extends Component {
	constructor(props) {
		super(props);
	}

	handleModal = (flag) => {
		const { handleModal } = this.props;
		handleModal && handleModal('AuVisible', flag);
	};

	render() {
		const { visible } = this.props;

		return (
			<Modal
				title='关于我们'
				className='about-us-modal'
				visible={visible}
				maskClosable={false}
				onCancel={() => this.handleModal(false)}
				footer={null}
			>
				<div className='about-us-content'>
					<h2>Version: {pack.version}</h2>
					<h3>版权所有 @ 2018 上海泛微 保留所有权利</h3>
				</div>
			</Modal>
		)
	}
}