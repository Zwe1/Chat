import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';

import { Avatar, Icon, Button, message as antMessage, Popover, Tooltip, Progress } from 'antd';
import { ContextMenu, MenuItem, ContextMenuTrigger } from "react-contextmenu";
import { Howl } from 'howler';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import classnames from 'classnames';
import _ from 'lodash';
import moment from 'moment';

import { buildMediaUrl } from '../../services/media';
import { getCurrentUser, getCurrentBaseUrl, setFileAddress, getFileAddress } from '../../lowdb';

import { computeSize } from '../../common/fileUtil';
import { unescapeFromHtml } from '../../common/htmlUtil';
import { formatLong, formatToS } from '../../common/dateFormat';
import { MessageTypes, DNTF } from '../../common/types';

import OliAvatar from '../common/Avatar';
import OliBlock from "../common/prop/Block";
import CompanyAndPosi from "../common/CompanyAndPosi";
import OliList from '../common/prop/List';
import OliSpan from '../common/prop/Span';
import OliSimpleSpan from '../common/prop/SimpleSpan';

import oliEmoji from '../common/emoji/oli-emoji';

import EmPopover from '../common/EmPopover';
import { isColorDark } from '../../common/colorUtil';

import { FaPhone } from 'react-icons/lib/fa';

import {
  handleCanPlayThrough,
  handleError,
  handleStartLoading
} from '../../common/audioEvent';

import $ from 'jquery';

window.onMessageAClick = function onMessageAClick(self) {
  let url = $(self).data('url');
  url = url.startsWith('http') ? url : ('http://' + url);
  
  if (window.isElectron()) {
    const { remote } = window.require('electron');
    remote.shell.openExternal(url);
  } else {
    window.open(url);
  }
};

@inject(stores => ({
  dbStore: stores.dbStore,
  chatStore: stores.chatStore,
}))
@observer
export default class ChatMessage extends Component {

  constructor(props) {
    super(props);
    this.state = {
      isHover: false,
      progress: 0,
      showProgress: false,
      fileMiss: false,
    };
  }

  shouldComponentUpdate(nextProps, nextState) {    
    const { message } = this.props;
    const { message: nextMessage } = nextProps;

    const { 
      isHover,       
      progress,
      showProgress,
      fileMiss 
    } = this.state;

    const { 
      isHover: newHover,
      progress: newProgress,
      showProgress: newShowProgress,
      fileMiss: newFileMiss 
    } = nextState;

    //  先比较 state
    if (isHover !== newHover
      || showProgress !== newShowProgress
      || fileMiss !== newFileMiss
      || progress !== newProgress) {
      return true;
    }

    if (
      (typeof nextMessage.hasRead !== typeof message.hasRead) // 两条信息的 hasRead 类型不同，要重新渲染
      || (
        (_.isArray(message.hasRead) && _.isArray(nextMessage.hasRead) && message.hasRead.length !== nextMessage.hasRead.length) // 都是 数组
        || (_.isBoolean(message.hasRead) && _.isBoolean(nextMessage.hasRead) && message.hasRead !== nextMessage.hasRead)  // 都是 boolean
      ) // 类型相同
      || message.objectName !== nextMessage.objectName  // 消息类型不同
      || message.loading !== nextMessage.loading
      || message.error !== nextMessage.error
      || message.id !== nextMessage.id) {
      return true;
    }

    const { extra = {} } = message;
    const { extra: nextExtra = {} } = nextMessage;
    if (extra.fileid !== nextExtra.fileid) {
      return true;
    }

    return false;
  }

  /**
   * 表情格式 [:hu]
   */
  filterMessage(message) {
    if (_.isObject(message)) {
      message = message.content;
    }

    // 只有在显示信息的时候需要转义一下
    let dummy = unescapeFromHtml(message);
    dummy = oliEmoji.symbolToHTML(dummy);

    // 替换 回车 换行 符
    dummy = dummy
      .replace(/\r/ig, "<br />")
      .replace(/\n/ig, "<br />");

    if (this.props.highLight) {
      dummy = this.highLightItem(dummy, 'text');
    }

    dummy = this.getLink(dummy);

    return { __html: dummy };
  }

  highLightItem = (item, type) => {
    const { historyControl } = this.props.chatStore;
    if (historyControl.keyword === '') {
      return item
    }

    let result = '';
    let reg = new RegExp(`${historyControl.keyword}`, 'g');
    switch (type) {
      case 'text':
        result = item.replace(reg, `<label class="high-light">${historyControl.keyword}</label>`);
        break;
      default:
        break;
    }

    return result
  };

  getLink(url) {
    const matchAll = function matchAll(array, regex) {
      let r = [];

      if (_.isString(array)) {
        r = array.match(regex);
      } else if(_.isArray(array)) {
        for (let i = 0; i < array.length; i++) {
          r.push.apply(r, array[i].match(regex));
        }
      }

      return r;
    };

    let htmlRegex = /<[^>]+>|&nbsp;|\s+|<br>|\n/g;//存在表情，要进行分段处理
    let strHtml = url.split(htmlRegex);
    // let strHtmlLength = strHtml.length;
    let strRegex =  "((https|http|ftp|rtsp|mms)?://)?"//前缀
          +"((([a-z0-9]([a-z0-9\\-]{0,61}[a-z0-9])?\\.)+"//域名识别
          +"(cn|aero|arpa|biz|com|coop|edu|gov|info|int|jobs|mil|museum|name|nato|net|org|pro|travel))"//二级域名识别
          +"|(((25[0-5]|2[0-4]\\d|[01]?\\d\\d?)($|(?!\\.$)\\.)){3}((25[0-5]|2[0-4]\\d|[01]?\\d\\d?)($|(?!\\.$)))))"//ip识别
          +"(:[0-9]{1,5})?"//端口
          + "(/($|[a-zA-Z0-9\.\,\;\?\'\\\+&%\$#\=~_\-]+))*"; //后缀

    let regex = new RegExp(strRegex,"gi");
    if (!regex.test(url.replace(htmlRegex,''))) {
      return url;
    }

    strHtml = matchAll(strHtml,regex);
    strHtml = _.uniq(strHtml);
    strHtml = strHtml.sort(function (a,b) {
      if (a.length > b.length) {
        return 1;
      } else {
        return -1;
      }
    });

    strHtml.forEach((item, index) => {
      if (item.trim() && item.indexOf('&nbsp;') < 0) {
        let stmp = item.replace(regex, m => `<a onclick="window.onMessageAClick(this)" data-url="${m}">${m}</a>`);

        try {
          if (item.indexOf('?') >= 0) {
            item = item.replace(/\?/gm, "\\?");
          }

          let replaceTemp = new RegExp(item, 'gm');
          url = url.replace(replaceTemp, stmp);
        } catch (err) {
          console.error('chat message - getLink:', err);
        }
      }
    });

    return url;
  }



  /**
   *
   * @param message
   * @returns {XML}
   */
  renderDefaultMessage(message) {
    let sysClass = classnames({
      'chat-message': true,
      'system': true,
    });

    //return <div className={ sysClass }>{message.content}</div>;
    return <div className={ sysClass }>[不支持的消息类型]</div>;
  }

  handleFileDownload = (mediaId, msg) => {
    let url = buildMediaUrl(mediaId);
    console.log('file start download:', url);
    const { ipcRenderer } = window.require('electron');

    ipcRenderer.removeAllListeners('download-progress');

    // ipcRenderer.once('download-progress', (event, progress) => {
    //   this.setState({showProgress: true});
    // });

    ipcRenderer.on('download-progress', (event, progress) => {
      this.setState({
        progress,
        showProgress: true
      });
    });

    ipcRenderer.on('download-cancelled', () => {
      this.setState({
        showProgress: false,
        progress: 0
      })
    });

    ipcRenderer.send('download', {
      dlpath: url,
      savePath: ''
    });

    ipcRenderer.once('download-completed', (event, arg) => {
      setFileAddress(msg, arg);
      this.setState({
        showProgress: false, 
        progress: 0, 
        fileMiss: false
      });
    });
  };

  openFile = (address, message) => {
    if (!address) {
      antMessage.warning('文件路径无效！');
      return
    }
    const { shell } = window.require('electron');
    const succeed = shell.openItem(address);
    if (!succeed) {
      antMessage.error('文件被移动或删除，请确认文件可用！');
      this.setState({
        fileMiss: true
      });

      setFileAddress(message, '');
    }
  };

  openFilePath = (address) => {
    if (!address) {
      antMessage.warning('文件夹路径无效！');
      return
    }
    const { shell } = window.require('electron');
    const succeed = shell.showItemInFolder(address);
    if (!succeed) {
      antMessage.error('文件夹无法打开，请核对文件路径！');
    }
  };

  handleAudioClick = (content) => {
    const src = 'data:audio/x-wav;base64,' + content;

    const sound = new Howl({
      src: src
    });

    sound.play();
  };

  // handleAudioClick = (content) => {
  //   const $audio = document.getElementById('chat-message-audio');
  //   if (!$audio) {
  //     return;
  //   }
  //
  //   $audio.pause();
  //
  //   //var source = document.createElement('source');
  //   //source.src = 'data:audio/x-wav;base64,' + content;
  //   //source.setAttribute('type','audio/wav');
  //   //
  //   //$audio.appendChild(source);
  //
  //   $audio.src = 'data:audio/x-wav;base64,' + content;
  //
  //   $audio.removeEventListener('canplaythrough', handleCanPlayThrough);
  //   $audio.removeEventListener('loadstart', handleStartLoading);
  //   $audio.removeEventListener('error', handleError);
  //
  //   $audio.addEventListener("canplaythrough", handleCanPlayThrough, false);
  //   $audio.addEventListener('loadstart', handleStartLoading, false);
  //   $audio.addEventListener('error', handleError);
  //
  //   $audio.load();
  // };

  // 链接消息点击
  handleLink = url => {
    if (!url) {
      antMessage.waring('该消息的链接地址为空');
    }

    const obj = window.getUrlParam(url);
    const objA = Object.keys(obj);
    let addFlag = true;
    let finalUrl = url;

    objA && objA.length > 0 && objA.forEach(v => {
      if (v === 'em_client_type') {
        addFlag = false;
      }
    });

    if (addFlag) {
      if (objA.length > 0) {
        finalUrl = `${finalUrl}&em_client_type=pc`;
      } else {
        finalUrl = `${finalUrl}?em_client_type=pc`;
      }
    }

    // 客户端
    if (window.isElectron()) {
      const { ipcRenderer } = window.require('electron');

      ipcRenderer.send('openLink', {
        url: finalUrl,
      });
      
    } else { // web端
      window.open(finalUrl, '_blank').location;
    }
  };

  // 位置消息点击
  handleLbs = (lon, lat, name) => {
    const finalUrl = `http://uri.amap.com/marker?position=${lon},${lat}&name=${name}`;
    // 客户端
    if (window.isElectron()) {
      const { shell } = window.require('electron');

      shell.openExternal(finalUrl);
      
    } else { // web端
      window.open(finalUrl, '_blank').location;
    }
  }

  renderDNTfMessage(message) {
    let showDate = this.needShowDate(message);
    let netfClass = classnames({
      'chat-message': true,
      'system': true,
      'with-date': showDate
    });

    let baseCount = 5;

    let {
      admins,   // 相关的群主变化了吗
      type,     // 类型
      operator, // 谁操作的
      extension // 主要操作人员
    } = message;

    type = parseInt(type);

    // 上面的 type 跟人有关
    let moreThanBase = false;
    // 获得所有的被操作者 id
    let extensionIds = [];
    if (extension) {
      extensionIds = type === 8 || type === 9
        ? JSON.parse(extension)
        : extension.split(',');
    }

    if (extensionIds.length > 5) {
      moreThanBase = true;
      extensionIds = extensionIds.slice(0, 5);
    }

    let originCount = extensionIds.length;

    extensionIds = extensionIds.map(id => id.split('|')[ 0 ]); // 去掉 udid

    let adminIds = [];
    // 如果是群主退出群聊，admins 是接下来的群主
    if (admins) {
      adminIds = admins.split(',').map(id => id.split('|')[ 0 ]);
    }

    let operatorId = operator.split('|')[ 0 ];

    let content = (
      <OliList
        ids={[ ...extensionIds, operatorId, ...adminIds ]}
        onCustomRender={(items) => {
          let opor = items.filter(item => item.id === operatorId)[ 0 ];
          let operatorName = opor && opor.name;

          let names = items
            .filter(item => extensionIds.indexOf(item.id) > -1)
            .map(item => item.name)
            .join(',');

          let msgContent = '';
          switch (type) {
            case DNTF.create:
              msgContent = `${operatorName} 邀请 ${names} ` + (moreThanBase ? `等 ${originCount} 人` : '') + '加入群聊';
              break;

            case DNTF.remove:
              msgContent = `${operatorName} 将 ${names} 移出群聊`;
              break;

            case DNTF.exit:
              msgContent = `${operatorName} 退出了群聊`;

              if (adminIds.length > 0) {
                msgContent = `群主 ${operatorName} 退出了群聊`;

                let nextAdmin = items.filter(item => item.id === adminIds[ 0 ])[ 0 ];
                if (nextAdmin) {
                  let nextAdminName = nextAdmin.name;
                  msgContent += `, ${nextAdminName} 成为新群主`;
                }
              }
              break;

            case DNTF.adminChange:
              msgContent = `${operatorName} 将 ${names} 设置为管理员`;
              break;

            case DNTF.adminCancel:
              msgContent = `${operatorName} 将 ${names} 取消管理员`;
              break;

            case DNTF.ownerChange:
              msgContent = `${operatorName} 将群主转移给 ${names}`;
              break;

            case DNTF.nameChange: // 修改群名称
              msgContent = `${operatorName} 修改群名称为 ${extension}`;
              break;

            case DNTF.avatarChange: // 修改群名称
              msgContent = `${operatorName} 修改了群头像`;
              break;

            default: break;
          }

          return <span className="message-content message-ntf">{msgContent}</span>
        }}
      />
    );

    let dateStr = this.formatDate(message);

    return (
      <div className={ netfClass }>
        {
          showDate && <div className="date"><span>{dateStr}</span></div>
        }
        {content}
      </div>
    );
  }

  /**
   * 我收到别人发的撤回消息
   */
  renderNtfMessage(message) {
    let netfClass = classnames({
      'chat-message': true,
      'system': true,
    });

    // 好像只有自己的信息会走到这里
    const { extra } = message;
    if (extra.notiType && extra.withdrawId && extra.notiType === 'noti_withdraw') {
      const personId = message.isRecipt ? message.to : message.from;
      return (
        <div className={ netfClass }>
          { this.renderDate(message) }
          <span><OliSimpleSpan prop="name" userId={personId}/> 撤回了一条信息</span>
        </div>
      );
    }

    return (
      <div className={ netfClass }>[不知道类型的小灰条消息]</div>
    );
  }

  renderWithdrawMessage(message) {
    let netfClass = classnames({
      'chat-message': true,
      'system': true,
    });

    return (
      <div className={ netfClass }>
        { this.renderDate(message) }
        <OliSimpleSpan prop="name" userId={message.from}/> 撤回了一条消息~
      </div>
    );
  }

  /**
   * 图文消息
   */
  renderRich(message) {
    let richClass = classnames({
      'rich-message': true,
      'message-content': true
    });

    let img = null;

    let realmessage = message;

    if (!realmessage.title) {
      realmessage = message.extra;
    }

    if (realmessage.imageurl) {
      img = realmessage.imageurl;
    } else if (realmessage.image) {
      img = realmessage.image;
    } else {
      img = '默认图片';
    }

    return (
      <div 
        key='rich'
        className={ richClass }
        onClick={this.handleLink(realmessage.url)}
      >
        <img src={img} />
        <span>{realmessage.content}</span>
      </div>
    );
  }

  renderLBS(message) {
    let lbsClass = classnames({
      'chat-message': true,
      'lbs-message': true,
    });

    const imageSrc = 'data:image/png;base64,' + message.content;

    return (
      message.poi ? 
        <div className={ lbsClass } onClick={() => this.handleLbs(message.longitude, message.latitude, message.poi)}>
          <Tooltip
            placement='bottomLeft'
            mouseEnterDelay={0.5}
            overlayClassName='message-lbs-tooltip'
            title={<span>{message.poi}</span>}
          >
            <h1>{message.poi}</h1>
          </Tooltip>
          <div className='img-con'>
            <img src={imageSrc} />
          </div>
        </div> : <div className={ lbsClass } onClick={() => this.handleLbs(message.longitude, message.latitude, message.poi)}>
        <div className='img-con'>
          <img src={imageSrc} />
        </div>
      </div>
    )
  }

  renderImage(message) {
    let imageSrc = '';

    if (message.content && _.isString(message.content)) {
      imageSrc = 'data:image/png;base64,' + message.content;
    } else if (message.imgUri) {
      imageSrc = buildMediaUrl(message.imgUri);
    } else {
      imageSrc = message.imageBase64;
      message.local = true; // 本地
    }

    return (
      <div key="image" className="message-content" onClick={() => this.handleBigPicture()}>
        <img
          className="message-image"
          src={imageSrc}
          onLoad={() => this.props.onImgLoaded(message)}
        />
      </div>
    );
  }

  getAvatarSrc = (type) => {
    //文件类型
    const types = {
      'image': ['gif','png','jpg','bpm','img'],
      'word': ['doc','docx'],
      'excel': ['xls','xlsx'],
      'ppt': ['ppt','pptx'],
      'pdf': ['pdf', 'application/pdf'],
      'music': ['mp3','wav','mid'],
      'video': ['mp4','avi','ra','rm','rmvb','mpg','mpeg','mov','wmv'],
      'txt': ['txt'],
      'zip': ['zip','gz'],
      'rar': ['rar'],
      'key': ['key'],
    };

    for (let [name, fix] of Object.entries(types)) {
      if (fix.includes(type)) {
        return 'img-' + name;
      }
    }

    return 'img-default';
  };

  handleErrorMsgClick(message) {
    message.isResend = 1;
    this.props.chatStore.sendMessage(message);
  }

  // 查看大图
  handleBigPicture = () => {
    const { messages = [], index } = this.props;

    const imgArray = messages
      .filter((v, i) => {
        v.messageIndex = i;
        return (v.extra && v.extra.imgUrl) || v.imageBase64;
      })
      .map(v => {
        return {
          messageIndex: v.messageIndex,
          imgUrl: v.extra && v.extra.imgUrl ? buildMediaUrl(v.extra.imgUrl) : '',
          imageBase64: v.imageBase64
        };
      });

    if (window.isElectron()) {
      const { ipcRenderer } = window.require('electron');

      ipcRenderer.sendSync('openPic', {
        url: window.location.origin,
        filename: {
          i: index,
          imgArray
        }
      });
    } else {
      const {
        setLookPicture,
        setPictureMessage,
        setLookPictureIndex
      } = this.props.chatStore;

      setLookPicture(true);
      setPictureMessage(imgArray);
      setLookPictureIndex(index);
    }
  };

  isFromMe(message) {
    const user = getCurrentUser();
    return message.from === user.base_user_id;
  }

  renderFile(message) {
    let { fileid, fileType, fileName, fileSize, file_type, file_name } = message.extra;
    let fileAddress = getFileAddress(message);
    let fileDownloaded = fileAddress !== null;
    let file = {
      mediaId: fileid,
      type: fileType || file_type,
      name: fileName || file_name,
      size: computeSize(fileSize),
    };

    const { progress, showProgress, fileMiss } = this.state;
    const { historyFileList } = this.props;

    const name = this.highLightItem(file.name, 'text');
    const src = this.getAvatarSrc(file.type);
    const isFromMe = this.isFromMe(message);

    if (isFromMe) {
      fileAddress = message.extra.filePath
    }

    const fileSizeInfo = showProgress && !fileMiss 
                        ? '' 
                        : fileDownloaded && !fileMiss
                          ? `成功存至:${fileAddress}`
                          : '未接收的文件';

    return (
      <div key="file" className="message-content message-file">
        <div className="file-meta">
          <Avatar shape="square" className={src} />

          <div className="file-info">
            <p className="file-name" onClick={e => (isFromMe || !window.isElectron()) ? '' : this.handleFileDownload(file.mediaId, message)}>
              <span dangerouslySetInnerHTML={{ __html: name}} />
              <span>({file.size})</span>
            </p>
            {
              // 是我发的
              (isFromMe && !historyFileList) 
                && <p className="file-size">{file.mediaId && '成功发送文件'}</p>
            }
            {
              // 不是我发的，正在下载
              (!isFromMe && showProgress) 
                && <Progress percent={Math.ceil(progress * 100)} size="small"/>
            }
            {
              // 不是我发的显示是否接受了文件
              (!isFromMe && !showProgress && !historyFileList)
                && (
                  <p className="file-size" title={fileSizeInfo}>
                    {/* {fileDownloaded && !fileMiss ? `成功存至:${fileAddress}` : '未接收的文件'} */}
                    {fileSizeInfo}
                  </p>
                )
            }
          </div>
          
          {
            window.isElectron() && (
              <div className="operations">
                {
                  isFromMe 
                    ? <Button type="small" onClick={e => this.openFile(fileAddress)}>打开</Button>
                    : (
                      <Button
                        type="small"
                        onClick={e => {
                          (fileDownloaded && !fileMiss)
                            ? this.openFile(fileAddress, message)
                            : this.handleFileDownload(file.mediaId, message)
                        }}
                      >
                        {fileDownloaded && !fileMiss ? '打开' : '另存为'}
                      </Button>
                    )
                }

                {
                  (isFromMe || (!isFromMe && fileDownloaded && !fileMiss))
                    && <Button type="small" onClick={e => this.openFilePath(fileAddress)}>打开文件夹</Button>
                }

                <Button type="small" onClick={e => this.handleRedirect(e, message)}>转发</Button>
              </div>
            )
          }
        </div>
      </div>
    );
  }

  renderVoice(message) {
    let { duration, content } = message;

    let deadline = 5;
    let maxDuration = 60;

    let minWidth = 60;
    let maxWidth = 222;

    let width;
    if (duration <= deadline) {
      width = minWidth;
    } else {
      width = minWidth + (duration - deadline) / (maxDuration - deadline) * (maxWidth - minWidth);
    }

    const isFromMe = this.isFromMe(message);

    return (
      <div
        key="voice"
        className="message-content message-voice"
        onClick={() => this.handleAudioClick(content)}
        style={{
          width
        }}
      >
        {!isFromMe && <Icon type="sound"/>}
        <span>{duration}"</span>
        {isFromMe && <Icon type="sound" className="mine"/>}
      </div>
    );
  }

  renderText = (message) => {
    const content = this.filterMessage(message.content);

    return (
      <span
        key="text"
        className="message-content"
        dangerouslySetInnerHTML={content}
      />
    );
  }

  // 链接消息
  renderLink(message) {
    let img = null;

    let realmessage = message;

    if (!realmessage.title) {
      realmessage = message.extra;
    }

    if (realmessage.imageurl) {
      img = realmessage.imageurl;
    } else if (realmessage.image) {
      img = realmessage.image;
    } else {
      img = '默认图片';
    }

    const showHead = realmessage.icon_text || realmessage.icon_url;

    return (
      <div
        key="link"
        className="message-content message-link"
        onClick={() => this.handleLink(realmessage.url)}
      >
        { showHead ? <div 
          className='head'
          style={{backgroundColor: realmessage.icon_bgcolor}}
        >
          {realmessage.icon_url && <img src={realmessage.icon_url} />}
          <span 
            className={`${ realmessage.icon_url ? 'have-img-span' : '' }`}
            style={{color: realmessage.icon_fontcolor}}
          >
            {realmessage.icon_txt}
          </span>
        </div> : null }
        <div className={`${ showHead ? '' : 'border-r' } content`}>
          <h3>{realmessage.title}</h3>
          <div className='main'>
            <img src={img} />
            <p className='label'>{realmessage.description}</p>
          </div>
        </div>
        <div className='footer'>查看详情</div>
      </div>
    )
  }

  // 名片消息
  renderPersonCard(message) {
    let id = message.hrmCardid || message.extra.hrmCardid;
    const isFromMe = this.isFromMe(message);

    return (
      <div
        key="person-card"
        className="message-content message-person-card"
      >
        <EmPopover
          id={id}
          chatIsFormYou={!isFromMe}
        >
          <div className='head'>名片</div>
          <div className='bottom'>
            <OliAvatar 
              key="avatar" 
              size={35} 
              type="user" 
              id={id}
              popover={false}
            />
            <div className='info'>
              <h1>{message.content}</h1>
              <OliBlock
                id={id}
                type={'user'}
                onCustomRender={(item) => {
                  return (
                    <CompanyAndPosi 
                      item={item} 
                      type='onlyDept'
                    />
                  )
                }}
              />
            </div>
          </div>
        </EmPopover>
      </div>
    )
  }

  // 新图文消息
  renderNews(message) {
    const articles = message.articles || message.extra.articles || [];

    // 单图文消息
    if (articles.length === 1) {

      const art = articles[0];
      const imgSrc = art.imageurl || art.image || '';

      return (
        <div
          key="news"
          className="message-content message-news"
          onClick={() => this.handleLink(art.url)}
        >
          {imgSrc ? <div className='news-img'>
            <img src={imgSrc} />
            <h3>{art.title}</h3>
          </div> : <div className='news-normal'>
            <h4>{art.title}</h4>
          </div>}
          {art.description ? <p className='news-details-p'>{art.description}</p> : null}
          <span className='news-button' >
            {art.btntxt ? art.btntxt : '查看详情'}
          </span>
        </div>
      )
    }

    // 多图文消息
    return (
      <div
        key="news"
        className="message-content message-news"
      >
        <div className='many-news'>
          <div
            className='first-news'
            onClick={() => this.handleLink(articles[0].url)}
          >
            <img src={articles[0].imageurl || articles[0].image}/>
            <h3>{articles[0].title}</h3>
          </div>
          {articles.slice(1).map((v, i) => {
            return (
              <div 
                className='news-list' 
                key={i}
                onClick={() => this.handleLink(v.url)}
              >
                <div className='list-title'><p><span>{v.title}</span></p></div>
                <img src={v.imageurl || v.image } />
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // 分享消息(原E6)
  renderShare(message) {
    const user = getCurrentUser();
    const url = `${getCurrentBaseUrl()}/emp/api/ec/client/link?share_type=${message.extra.sharetype}&share_id=${message.extra.shareid}&em_client_type=pc&access_token=${user.access_token}`;

    let head = null
    switch(message.extra.sharetype) {
      case 'doc' : 
        head = <div className='head'><Icon type='file-word' /><span>文档</span></div>;
        break;
      case 'workflow' : 
        head = <div className='head'><Icon type='retweet' /><span>流程</span></div>;
        break;
      case 'task' : 
        head = <div className='head'><Icon type='check-square-o' /><span>任务</span></div>;
        break;
      case 'pdoc' :
        head = <div className='head'><Icon type='hdd' /><span>云盘文档</span></div>;
        break;
      case 'folder' : 
        head = <div className='head'><Icon type='cloud-download-o' /><span>云盘文件</span></div>;
        break;
      case 'crm' :
        head = <div className='head'><Icon type='idcard' /><span>客户名片</span></div>;
        break;
    }

    return (
      <div
        key='share'
        className='message-content message-share'
        onClick={() => this.handleLink(url)}
      >
        {head}
        <div className='content'>
          <h3>{message.content}</h3>
        </div>
        <div className='footer'>
          查看详情
        </div>
      </div>
    )
  }

  // 公告消息
  renderNotice(message) {
    return (
      <div
        key='notice'
        className='message-content message-notice'
      >
        <div className='notice-head'>
          <Icon type='notification' />
          <span>群公告</span>
        </div>
        <h1>{message.content}</h1>
      </div>
    );
  }

  renderDate(message) {
    let showDate = this.needShowDate(message);
    let dateStr = this.formatDate(message);
    return showDate 
      ? <div className="date"><span>{dateStr}</span></div>
      : '';
  }

  /**
   *
   * @param message
   * @returns {boolean}
   */
  needShowDate(message) {
    const lastMessage = this.props.lastMessage;
    if (!lastMessage) {
      return true;
    }

    let date = message.date;
    let lastDate = lastMessage.date;

    if (!lastDate || !date) {
      return true;
    }

    // 一分钟以内的时间不显示
    return moment(date).diff(moment(lastDate), 'seconds') >= 60;
  }

  /**
   * 1. 私聊，自己不显示，对面不显示，就是私聊不显示
   * 2. 群聊，不显示自己， 跟 hover 没关系
   *
   * @param message
   * @returns {*}
   */
  needShowName(message) {
    if (this.props.historyMsg) {
      return true
    }

    if (!message.isGroup) {
      return false;
    }

    return !this.isFromMe(message);
  }

  /**
   *
   * @param message
   * @returns {*}
   */
  needShowAvatar(message) {
    return this.needShowName(message);
  }

  renderAvatar(message, isFromMe, name) {
    let clazz = classnames({
      'no-name': !name
    });

    return (
      <OliAvatar 
        key="avatar" 
        className={clazz} 
        size={35} 
        type="user" 
        id={message.from}
        chatIsFormYou={!isFromMe}
      />
    );
  }

  renderName(message) {
    return <OliSpan userId={message.from} prop="base_user_name"/>
  }

  /**
   * 已读
   * 
   * @param {*} msg 
   */
  renderHasRead(msg) {
    // 如果是 undefined，就直接返回
    // if (_.isUndefined(msg.hasRead)) {
    //   return '';
    // }

    const isFromMe = this.isFromMe(msg);
    if (!isFromMe || msg.from === msg.to) {
      return '';
    }

    if (!msg.isGroup) {
      return <span>{msg.hasRead ? '已读' : '未读'}</span>;
    }

    const myId = getCurrentUser().base_user_id;

    const hasReadList = msg.hasRead || [];
    const unreadList = _.difference(msg.extra.receiverIds, hasReadList).filter(id => id !== myId);

    const unreadCount = unreadList.length || 0;
    const hasReadCount = hasReadList.length || 0;

    // let allHasRead = hasReadCount === msg.extra.receiverIds.length;
    let allHasRead = unreadList.length === 0;

    const content = (
      <div className="hasRead-status-list">
        <div>
          <div className="title"><span>{unreadCount}</span>人未读</div>
          <OliList
            ids={unreadList}
            onCustomRender={members => {
              return (
                <ul className="unRead">
                  {unreadList.length === 0 ? null :
                    members.map(person => {
                      return (
                        <li key={person.id}>
                          <OliAvatar
                            size={25}
                            id={person.id}
                            avatarMap={person.avatar}
                          />
                          <span>{person.name}</span>
                        </li>
                      );
                    })
                  }
                </ul>
              );
            }}
          />
        </div>
        <div className="bg-fb">
          <div className="title"><span>{hasReadCount}</span>人已读</div>
          <OliList
            ids={hasReadList}
            onCustomRender={members => {
              return (
                <ul className="hasRead">
                  {hasReadCount === 0 ? null :
                    members.map(member => {
                      return (
                        <li key={member.id}>
                          <OliAvatar
                            size={25}
                            id={member.id}
                            avatarMap={member.avatar}
                          />
                          <span>{member.name}</span>
                        </li>
                      );
                    })
                  }
                </ul>
              );
            }}
          />
        </div>
      </div>
    );

    return (
      allHasRead && msg.isGroup
        ? <span style={{color: 'grey'}}>全部已读</span> 
        : (
          <Popover 
            overlayClassName="has-read-popover-container"
            placement="left" 
            title={null} 
            content={content}
            trigger="click"
          >
            <span className="unread-mark">{unreadCount} 人未读</span>
          </Popover>
        )
    );
  }

  handleMouseEnter = () => {
    this.setState({ isHover: true });
  };

  handleMouseLeave = () => {
    this.setState({ isHover: false });
  };

  renderNormalMessage(message) {
    const { historyMsg, historyFileList } = this.props;
    const { pushType } = message.extra;

    let isFromMe = this.isFromMe(message);
    let bubbleColor = '#fff';

    if (historyMsg) {
      isFromMe = false
    }

    let flag = '';
    const isLoading = message.loading;

    if (isFromMe && isLoading) {
     flag = <Icon className="icon-message-success" type="loading"/>;
    }

    const isError = message.error;
    if (isFromMe && isError) {
      flag = (
        <Icon
          className="icon-message-error"
          type="exclamation-circle"
          onClick={() => this.handleErrorMsgClick(message)}
        />
      );
    }

    let content = '';
    switch (message.objectName) {
      case MessageTypes.text:
        content = this.renderText(message);
        bubbleColor = message.extra.bubblecolor;
        break;

      case MessageTypes.file:
        content = this.renderFile(message);
        break;

      case MessageTypes.voice:
        content = this.renderVoice(message);
        bubbleColor = message.extra.bubblecolor;
        break;

      case MessageTypes.img:
        content = this.renderImage(message);
        bubbleColor = message.extra.bubblecolor;
        break;

      case MessageTypes.rich:
        content = this.renderRich(message);
        break;

      case MessageTypes.lbs:
        content = this.renderLBS(message);
        break;

      case MessageTypes.link:
        content = this.renderLink(message);
        break;

      case MessageTypes.personCard:
        content = this.renderPersonCard(message);
        break;

      case MessageTypes.news:
        content = this.renderNews(message);
        break;
        
      case MessageTypes.share:
        content = this.renderShare(message);
        break;

      case MessageTypes.notice:
        content = this.renderNotice(message);
        break;

      case MessageTypes.custom:
        switch(pushType) {
          case MessageTypes.voip:
            content = this.renderVoipMessage(message);
            break;
          default:
            break;
        }

      default: 
        break;
    }

    let showDate = this.needShowDate(message);
    let dateStr = this.formatDate(message);
    // message.date
    let isShowRecall = true;

    const { isHover } = this.state;
    const { openHasRead } = this.props.chatStore;
    let longDate = historyMsg ? '' : isHover ? formatToS(message.date) : '';
    let name = this.needShowName(message)
      ? this.renderName(message, isFromMe)
     : '';
    
    let avatar = this.renderAvatar(message, isFromMe, name);

    if (!bubbleColor) {
      bubbleColor = isFromMe ? '#cce6ff' : '#fff';
    }

    const isDarkBackground = isColorDark(bubbleColor);

    let msgClass = classnames({
      'chat-message': true,
      'mine': isFromMe,
      'with-date': showDate,
      'dark-background': isDarkBackground,
      'white-message': message.objectName === MessageTypes.link || 
                       message.objectName === MessageTypes.personCard || 
                       message.objectName === MessageTypes.news || 
                       message.objectName === MessageTypes.share ||
                       message.objectName === MessageTypes.lbs ||
                       message.objectName === MessageTypes.notice,
    });

    let showHasRead = openHasRead && !historyMsg && !flag && !message.isAppMsg;

    return (
      <div
        className={msgClass}
        onMouseEnter={this.handleMouseEnter}
        onMouseLeave={this.handleMouseLeave}
      >
        { showDate && !historyMsg && <div className="date"><span>{dateStr}</span></div> }
        <div className="message-content-wrapper">
          { (!isFromMe || historyMsg) && !historyFileList ? avatar : '' }
          <div className="message-meta">
            {
              !historyFileList &&
                <div style={{ lineHeight: 1.7 }}>
                  <span className="author">{name}</span>
                  <span className="long-date">{longDate}</span>
                </div>
            }

            <div className="message-content-and-flag">
              { flag }
              { showHasRead && this.renderHasRead(message) }
              <ContextMenuTrigger id={message.id} >
                <div
                  className="oli-chat-message-content"
                  style={{ backgroundColor: bubbleColor }}
                >
                  {content}
                </div>
              </ContextMenuTrigger>
            </div>
          </div>
          { isFromMe && !historyMsg ? avatar : '' }
        </div>

        {!historyMsg &&
          <ContextMenu id={message.id}>
            {
              // 只有文字信息可以复制
              message.objectName === MessageTypes.text && (
                <MenuItem onClick={this.handleCopyMsg}>
                  <CopyToClipboard
                    text={message.content}
                    onCopy={() => antMessage.success('复制成功~')}
                  >
                    <span>复制</span>
                  </CopyToClipboard>
                </MenuItem>
              )
            }

            <MenuItem data={message} onClick={this.handleRedirect}>转发</MenuItem>
            { (message.objectName === MessageTypes.text && false) && <MenuItem data={message} onClick={this.handleReply}>回复</MenuItem> }
            {/* <MenuItem divider/> */}
            {/*<MenuItem data={message} onClick={this.handleDeleteMsg}>删除</MenuItem>*/}
            { (isFromMe && isShowRecall) && <MenuItem data={message} onClick={this.handleRecall}>撤回</MenuItem> }
          </ContextMenu>
        }
      </div>
    );
  }

  // 抖一抖消息
  renderShakeMessage(message) {
    const {
      currentChatPerson,
    } = this.props.chatStore;

    const {
      getSimpleUserInfo,
    } = this.props.dbStore;

    const { historyMsg } = this.props;

    const isFromMe = this.isFromMe(message);
    const showDate = this.needShowDate(message);
    const dateStr = this.formatDate(message);

    const shakeClass = classnames({
      'chat-message': true,
      'system': true,
      'message-shake': true,
      'with-date': showDate
    });

    let spanHtml = null;

    if (isFromMe) {
      spanHtml = <span>您发送了一个窗口抖动</span>
    } else {
      const user = getSimpleUserInfo(message.from);
      spanHtml = <span>{user.base_user_name}给您发送了一个窗口抖动</span>
    }

    return (
      <div
        key='shake'
        className={shakeClass}
      >
        { showDate && !historyMsg && <div className="date"><span>{dateStr}</span></div> }
        <div className='shake-content'>
          <Icon type='check-circle' className='message-shake-i' />
          {spanHtml}
        </div>
      </div>
    );
  }

  // 音视频结果
  renderVoipMessage(message) {
    const voipClass = classnames({
      'chat-message': true,
      'system': false,
      'message-voip': true,
    });

    if (message.extra.voip_duration) {
      const dura = this.timeConversion(message.extra.voip_duration);
      return (
        <div
          key='voip'
          className={voipClass}
        >
          <FaPhone />
          <span className='voip-content'>通话时长</span>
          <span className='voip-time'>{dura}</span>
        </div>
      );
    } else {
      return (
        <div
          key='voip'
          className={voipClass}
        >
          <FaPhone />
          <span className='voip-content'>未接通</span>
        </div>
      );
    }
  }

  // 时间转换
  timeConversion = t => {
    let h = '';
    let m = '';
    let s = '';

    h = `${parseInt( t / 3600 )}`;
    m = `${parseInt((t - 3600 * h) / 60)}`;
    s = `${parseInt(t - 3600 * h - 60 * m)}`;

    return `${h > 0 ? h.length > 1 ? `${h}:` : `0${h}:` : ''}${m > 0 ? m.length > 1 ? m : `0${m}` : '00'}:${s > 0 ? s.length > 1 ? s : `0${s}` : '00'}`
  }

  /**
   * 转发
   *
   * @param e
   * @param data
   */
  handleRedirect = (e, data) => {
    const {
      saveWaitRedirectMsg,
      openRedirectMsgModal
    } = this.props.chatStore;

    saveWaitRedirectMsg(data);
    openRedirectMsgModal();
  };

  /**
   * 撤回信息
   */
  handleRecall = (e, data) => {
    const {
      sendWithdrawMessage,
    } = this.props.chatStore;

    sendWithdrawMessage(data);
  };

  /**
   * 回复信息，
   * 回复信息需要按照格式，如果是图片呢
   * 首先要显示之前的信息，然后加一行线
   *
   * @param e
   * @param data
   */
  handleReply = (e, data) => {
    const quillEditor = this.props.chatStore.quillEditor;
    const quillRef = quillEditor.getQuill();

    let user = this.props.dbStore.userCache.get(data.from);
    let insertText = `「${user.name}: ${data.content}」\n--------\n`;

    quillRef.focus();
    const range = quillRef.getSelection();
    quillRef.insertText(range.index, insertText, 'user');
    quillRef.setSelection(range.index + insertText.length, 'slient');
    quillRef.focus();
  };

  /**
   * 删除信息
   */
  handleDeleteMsg = (proxy, msg) => {
    // msg.id 消息id
    this.props.chatStore.deleteHistoryMessage(msg.id);
  };

  formatDate(message) {
    let date = message.date;
    return formatLong(date);
  }

  render() {
    const { message } = this.props;

    const type = message.objectName;
    switch (type) {
      case MessageTypes.text:
      case MessageTypes.file:
      case MessageTypes.voice:
      case MessageTypes.img:
      case MessageTypes.rich:
      case MessageTypes.lbs:
      case MessageTypes.link:
      case MessageTypes.personCard:
      case MessageTypes.news:
      case MessageTypes.share:
      case MessageTypes.notice:
        // 上面这些都需要显示头像
        return this.renderNormalMessage(message);

      case MessageTypes.dntf: // 群组小灰条消息
        return this.renderDNTfMessage(message);

      case MessageTypes.ntf:  // 小灰条消息
        return this.renderNtfMessage(message);

      case MessageTypes.withdraw: // 撤回消息
        return this.renderWithdrawMessage(message);

      case MessageTypes.custom: // 自定义消息
        switch (message.extra.pushType) {
          case MessageTypes.shake:  // 抖一抖
            return this.renderShakeMessage(message);
          case MessageTypes.voip:   // 音视频结果(需要显示头像)
            return this.renderNormalMessage(message);
          default:
            return this.renderDefaultMessage(message);
        }

      default:
        return this.renderDefaultMessage(message);
    }
  }
}

/**
 *
 */
ChatMessage.defaultProps = {
  highLight: false,
  historyFileList: false,
  historyMsg: false,
  message: {},
  onImgLoaded: () => {
  }
};
