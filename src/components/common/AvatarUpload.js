import React, { Component } from 'react';
import { getCurrentUser, getCurrentBaseUrl } from '../../lowdb';
import { message, Upload, Icon, Tooltip } from 'antd';
import { buildMediaUrl } from '../../services/media'

export default class AvatarUpload extends Component {
  static propTypes = {};

  constructor(props) {
    super(props);

    const user = getCurrentUser() || {};
    this.state = {
      imageUrl: props.url || '',
      accessToken: user.access_token,
    }
  }

  componentDidMount() {
    const { url } = this.props;
    if (url) {
      this.setState({
        imageUrl: url
      });
    }
  }

  handleBeforeUpload(file) {
    const isSuitable = /^image\/(png|jpe?g)$/i.test(file.type);
    if (!isSuitable) {
      message.error('请上传 png, jpeg, jpg 格式的图片！');
    }

    const isLt3M = file.size / 1024 / 1024 < 2;
    if (!isLt3M) {
      message.error('图片不能超过 2MB！');
    }

    return isSuitable && isLt3M;
  }

  handleFileChange = (info) => {
    if (info.file.status === 'done') {
      console.log('file upload success', info);

      const res = info.file.response;
      if (res.errcode === 0) {
        const fileList = res.fileList;
        const file = fileList[0];
        const { id } = file;

        console.log('file upload success');
        this.setState({
          imageUrl: buildMediaUrl(id),
        });

        this.props.uploadSuccess(id);
      } else {
        message.error(res.errmsg, 3);
      }
    }
  };

  handleFileRemove = () => {
    console.log('shanchu wenjian');
  };

  render() {
    const { imageUrl, accessToken } = this.state;
    const { info, size = 100 } = this.props
    const baseUrl = getCurrentBaseUrl();

    return (
      <div className="common-avatar-upload">
        <Upload
          className="avatar-uploader"
          name="avatar"
          showUploadList={false}
          onChange={this.handleFileChange}
          beforeUpload={this.handleBeforeUpload}
          action={`${baseUrl}/emp/api/file/upload`}
          style={{
            width: size,
            height: size
          }}
          headers={{ 
            'access_token': accessToken
           }}
          data={{ 
            type: 'image' 
          }}
        >
          {
            imageUrl 
              ? (
              <Tooltip placement='rightBottom' overlayClassName='upload-img-tooltip' title={<div>点击选择图片</div>}>
                <div className='avatar-div'>
                  <img src={imageUrl} alt="" className="avatar"/>
                  {/*<Popconfirm title="确定要删除吗？" onConfirm={this.handleFileRemove.bind(this)}>*/}
                    {/*<Button type="danger" icon="delete" className="btn-icon-delete"/>*/}
                  {/*</Popconfirm>*/}
                </div>
              </Tooltip> 
            ) : info 
                ? (
                  <Tooltip placement='rightBottom' overlayClassName='upload-img-tooltip' title={<div>点击选择图片</div>}>
                    <div className='avatar-div'>
                      <div className='avatar' style={{background: info.avatar.show_color}}>
                        <span>{info.avatar.show_name}</span>
                      </div>
                    </div>
                  </Tooltip>
                )
                : <Icon type="plus" className="avatar-uploader-trigger"/>
          }
        </Upload>
      </div>
    );
  }
}


AvatarUpload.defaultProps = {
  url: '',
  uploadSuccess: () => {}
};