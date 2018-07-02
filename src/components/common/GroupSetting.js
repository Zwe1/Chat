import React, { Component } from "react";
import { inject, observer } from "mobx-react";
import { Form, Modal, Button, Input } from "antd";

import AvatarUpload from "./AvatarUpload";
import { buildMediaUrl } from "../../services/media";

import { getCurrentBaseUrl } from "../../lowdb";

@inject(stores => ({
  chatStore: stores.chatStore,
  dbStore: stores.dbStore,
}))
@observer
class GroupSetting extends Component {
  constructor(props) {
    super(props);
  }

  handleModal = flag => {
    const { handleModal } = this.props;
    handleModal('groupSettingVisible', flag);

    // flag false, 隐藏
    this.props.chatStore.openDrawer();
  };

  handleAvatarUploadSuccess = (id) => {
    const { setFieldsValue } = this.props.form;
    setFieldsValue({ 'avatar': id });
  };

  handleSubmit = id => {
    this.props.form.validateFields(async(err, values) => {
      if (!err) {
        const obj = {
          groupid: id,
          group_name: values.group_name,
          name: values.group_name,
          avatar: {},
        };
        if (!values.avatar) {
          const { group } = this.props;
          obj.avatar = group.avatar;
        } else {
          obj.avatar.media_id = values.avatar;
        }

        const { getGroupInfo } = this.props.dbStore;
        getGroupInfo(obj.groupid);

        this.handleModal(false);
      }
    });
  };

  render() {
    const { visible, group } = this.props;
    const { getFieldDecorator } = this.props.form;
    const baseUrl = getCurrentBaseUrl();

    let avatarUrl = '';
    if (group && group.avatar) {
      const avatar = group.avatar;
      if (avatar.media_id) {
        avatarUrl = buildMediaUrl(avatar.media_id);
      } else {
        avatarUrl = `${baseUrl}${avatar.default}`;
      }
    }

    return (
      <Modal
        title='群组设置'
        style={{ top: 60 }}
        visible={visible}
        maskClosable={false}
        className='group-setting'
        onCancel={() => this.handleModal(false)}
        footer={[
          <Button key='cancle' onClick={() => this.handleModal(false)}>取消</Button>,
          <Button key='ok' type="primary" onClick={() => this.handleSubmit(group.groupid)}>确定</Button>
        ]}
      >
        <Form
          style={{
            maxHeight: document.body.offsetHeight - 250,
            overflow: 'auto',
            padding: '0 10px'
          }}
        >
          <Form.Item label='群组头像'>
            {getFieldDecorator('avatar')(
              <AvatarUpload uploadSuccess={this.handleAvatarUploadSuccess} url={avatarUrl}/>
            )}
          </Form.Item>
          <Form.Item label='群组名称'>
            {getFieldDecorator('group_name', {
              initialValue: group.name,
              rules: [
                { required: true, message: '请输入名称~' },
              ],
            })(
              <Input placeholder="群组名称"/>
            )}
          </Form.Item>
        </Form>
      </Modal>
    )
  }
}

export default Form.create()(GroupSetting);