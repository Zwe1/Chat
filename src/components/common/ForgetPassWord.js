import React, { Component } from 'react';
import { Modal, Form, Input, Button, Icon } from 'antd';
import { inject, observer } from 'mobx-react';
import uuid from 'uuid';

const FormItem = Form.Item;

@inject(stores => ({
	loginStore: stores.loginStore
}))
@observer
class ForgetPassWord extends Component {
	constructor(props) {
		super(props);
		this.state = {}
	}

	handleCancel = flag => {
		const { setResetPasswordByOldPending } = this.props.loginStore;
		setResetPasswordByOldPending('');

		this.handleModal(false);
	}

	handleModal = flag => {
		const { handleModal } = this.props;
		handleModal && handleModal('forgetVisible', flag);
	}

	handleConfirmPassword = (rule, value, callback) => {
    const { getFieldValue } = this.props.form;
    if (value && value !== getFieldValue('newPass')) {
        callback('两次密码输入不一致！');
    }
    callback();
 }

	hasErrors = (fieldsError) => {
	  return Object.keys(fieldsError).some(field => fieldsError[field]);
	}

	handleSubmit = () => {
		this.props.form.validateFields((err, values) => {
      if (!err) {
        const { resetPasswordByOld } = this.props.loginStore;
        const data = {
        	old_pwd: values.oldPass,
        	new_pwd: values.repeatPass
        }
        resetPasswordByOld(data);
        this.handleModal(false);
      }
    });
	}

	render() {
		const { resetPasswordByOldPending } = this.props.loginStore;
		const { visible } = this.props;
		const { getFieldDecorator, getFieldsError } = this.props.form;

		return (
			<Modal
				title='修改密码'
				maskClosable={false}
				visible={visible || resetPasswordByOldPending === 'failed' || resetPasswordByOldPending === 'pending'}
        footer={[
          <Button key='cancle' onClick={() => this.handleCancel(false)}>取消</Button>,
	        <Button key='ok' type="primary" onClick={this.handleSubmit} disabled={this.hasErrors(getFieldsError())} loading={resetPasswordByOldPending === 'pending'}>
	          确定
	        </Button>
        ]}
        onCancel={() => this.handleCancel(false)}
        className='reset-password'
			>
				<Form>
					<FormItem
	          label='原密码'
	        >
	          {getFieldDecorator('oldPass', {
	            rules: [{ required: true, message: '请输入您之前的密码' }],
	          })(
	            <Input placeholder='请输入原密码' />
	          )}
	        </FormItem>
	        <FormItem
	          label='新密码'
	        >
	          {getFieldDecorator('newPass', {
	            rules: [{ required: true, message: '请设置您的新密码' },
	            { min: 6, message: '密码长度不能小于6位'},
	            { max: 20, message: '密码长度不能超过20位'}],
	          })(
	            <Input type="password" prefix={<Icon type="lock" style={{ fontSize: 13 }}/>} placeholder='请输入6~20位的密码'/>
	          )}
	        </FormItem>
	        <FormItem
	          label='确认新密码'
	        >
	          {getFieldDecorator('repeatPass', {
	            rules: [{ required: true, message: '请再次输入您的新密码' },
	            { min: 6, message: '密码长度不能小于6位'},
	            { max: 20, message: '密码长度不能超过20位'},
	            { validator: this.handleConfirmPassword}],
	          })(
	            <Input type="password" prefix={<Icon type="lock" style={{ fontSize: 13 }}/>} placeholder='再次输入密码'/>
	          )}
	        </FormItem>
				</Form>
			</Modal>
		)
	}
}

export default Form.create()(ForgetPassWord);