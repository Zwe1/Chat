import React, { Component } from 'react';
import { Modal, Form, Button, Spin, RadioGroup, Radio, Input, DatePicker } from 'antd';
import AvatarUpload from './AvatarUpload';
import { buildMediaUrl } from '../../services/media'
import moment from 'moment';
import { inject, observer } from 'mobx-react';
import { getCurrentUser, getCurrentDomainSetting } from '../../lowdb';

@inject(stores => ({
  loginStore: stores.loginStore,
  dbStore: stores.dbStore,
}))
@observer
class PersonSetting extends Component {
  constructor(props) {
    super(props);
  }

  handleAvatarUploadSuccess = (id) => {
    const { setFieldsValue } = this.props.form;
    setFieldsValue({ 'avatar': id });
  };

  handleSubmit = () => {
    this.props.form.validateFields(async(err, values) => {
      if (!err) {
        const { updateBaseUserInfo } = this.props.loginStore;
        const { changeUpdateBaseUserInfo, setUserCache } = this.props.dbStore;
        const o = values;
        if (o.birthday) {
          o.birthday = moment(o.birthday).format('YYYY-MM-DD 00:00:00');
        } else {
          o.birthday = '';
        }
        o.gender = Number(o.gender);
        try {
          const flag = await updateBaseUserInfo(o, 0);	// 传0 表示修改个人信息
          const uploadAvatar = o.avatar ? {media_id: o.avatar} : {};
          // simpleUser同步
          flag && setUserCache(getCurrentUser().base_user_id, uploadAvatar);
          
          flag && changeUpdateBaseUserInfo();
        } catch (err) {
          console.log(err);
        }
        this.props.setPsVisible(false);
      }
    });
  };

  render() {
    const { visible, info, loading, setPsVisible } = this.props;
    const { getFieldDecorator } = this.props.form;
    const { updateBaseUserInfoPending } = this.props.loginStore;

    const noObj = {}

    const urlSetting = getCurrentDomainSetting();

    return (
      <Modal
        title='个人设置'
        style={{ top: 60 }}
        maskClosable={false}
        visible={visible || updateBaseUserInfoPending === 'failed' || updateBaseUserInfoPending === 'pending'}
        footer={[
          <Button 
            key='cancle' 
            onClick={() => setPsVisible(false)}
          >
            取消
          </Button>,
          <Button 
            key='ok'
            type="primary"
            onClick={this.handleSubmit.bind(this)}
            loading={updateBaseUserInfoPending === 'pending'}
          >
            确定
          </Button>
        ]}
        onCancel={() => setPsVisible(false)}
        className='person-setting'
      >
        {loading
          ? <Spin />
          : (
          <Form
            style={{
              maxHeight: document.body.offsetHeight - 250,
              overflow: 'auto',
              padding: '0 10px'
            }}>
            <Form.Item
              label='您的头像'
            >
              {getFieldDecorator('avatar')(
                <AvatarUpload
                  uploadSuccess={this.handleAvatarUploadSuccess}
                  url={info && info.avatar && info.avatar.media_id ? buildMediaUrl(info.avatar.media_id) : ''}
                  info={info}
                />
              )}
            </Form.Item>
            {urlSetting && urlSetting.enable_update_baseinfo ?
            <div>
              <Form.Item
                label='您的姓名'
              >
                {getFieldDecorator('base_user_name', {
                  initialValue: info.base_user_name,
                  rules: [
                    { required: true, message: '请输入姓名~' },
                  ],
                })(
                  <Input placeholder="姓名"/>
                )}
              </Form.Item>
              <Form.Item
                label='您的性别'
              >
                {getFieldDecorator('gender', {
                  initialValue: info ? `${info.gender}` : '1'
                })(
                  <Radio.Group>
                    <Radio value='1'>男</Radio>
                    <Radio value='2'>女</Radio>
                  </Radio.Group>
                )}
              </Form.Item>
              <Form.Item
                label='您的邮箱'
              >
                {getFieldDecorator('email', {
                  initialValue: info.email,
                  rules: [
                    { type: 'email', message: '邮箱格式不正确~', },
                  ],
                })(
                  <Input placeholder="邮箱"/>
                )}
              </Form.Item>
              <Form.Item
                label='您的生日'
              >
                {getFieldDecorator('birthday', info && info.birthday ? {
                  initialValue: moment(info.birthday)
                } : {})(
                  <DatePicker placeholder="生日"/>
                )}
              </Form.Item>
            </div> : null}
          </Form>
        )}
      </Modal>
    )
  }
}

export default Form.create()(PersonSetting);