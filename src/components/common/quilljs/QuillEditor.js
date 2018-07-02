import React, { Component } from 'react';
import { findDOMNode } from 'react-dom';
import { inject, observer } from 'mobx-react';
import ReactQuill, { Quill } from 'react-quill';
import { Popover, Icon, Radio, Tooltip } from 'antd';

import contains from 'rc-util/lib/Dom/contains';
import addEventListener from 'rc-util/lib/Dom/addEventListener';

import 'react-quill/dist/quill.snow.css';
import './quill.mention';

import EmojiBlot from './blot/emojiBlot';
import FileBlot from './blot/fileBlot';
import Keys from './constants/keys';

import getFileType from './fileType';
import Scrollbars from '../scrollbar/SpringScrollbars';
import oliEmoji from '../emoji/oli-emoji';

import Process from '../Process';
import PersonCard from '../PersonCard';
import Shake from '../Shake';
import quill from 'quill/core/quill';

const emojiList = oliEmoji.getAllEmojiPositions();

const Delta = Quill.import('delta');

Quill.register(FileBlot);
Quill.register(EmojiBlot);

/*
 * Editor component with custom toolbar and content containers
 */
@inject((stores) => ({
  chatStore: stores.chatStore,
  homeStore: stores.homeStore,
}))
@observer
class Editor extends React.Component {

  static filesWaitToUpload = {};

  clickOutsideHandler;

  $emojiWrapper;
  $caretdownWrapper;

  constructor(props) {
    super(props);

    const self = this;

    this.state = {
      editorHtml: '',
      showEmojiPanel: false,
      cutsetShow: false,
    };

    this.eventKey = ''; // 上次按键的值

    this.modules = {
      clipboard: {
        matchVisual: false,
        matchers: [
          [ Node.ELEMENT_NODE, matchElementNode ],
          [ Node.TEXT_NODE, matchTextNode ]
        ]
      },
      mention: {
        // allowedChars: /^[_A-Za-z\s]*$/,
        source: function (searchTerm) {
          // console.log('quill editor mention:', searchTerm);

          const { onMention } = self.props;
          const values = onMention();

          if (searchTerm.length === 0) {
            this.renderList(values, searchTerm);
          } else {
            const matches = [];
            for (let i = 0; i < values.length; i++) {
              if (~values[ i ].value.toLowerCase().indexOf(searchTerm.toLowerCase())) {
                matches.push(values[ i ]);
              }
            }

            this.renderList(matches, searchTerm);
          }
        },
      },
      toolbar: {
        container: "#toolbar",
        handlers: {
          "upload": this.fileHandler.bind(this),
          "cut": this.cutHandler.bind(this),
          "emoji": this.emojiHandler.bind(this),
          "down": this.triggerCut.bind(this),
          "process": () => {}
        }
      }
    };

    this.reactQuillRef = null; // ReactQuill component
  }

  getDocument() {
    return window.document;
  }

  componentDidMount() {
    let quillRef = this.getQuill();

    quillRef.root.addEventListener('drop', this.handleDrop, false);
    quillRef.root.addEventListener('dragover', this.handleDropOver, false);
    quillRef.root.addEventListener('paste', this.handlePaste, false);

    quillRef.focus();
  }

  componentDidUpdate() {
    if (!this.clickOutsideHandler) {
      let currentDocument = this.getDocument();
      this.clickOutsideHandler = addEventListener(currentDocument, 'mousedown', this.onDocumentClick);
    }
  }

  componentWillUnmount() {
    this.clearOutsideHandler();
  }

  clearOutsideHandler() {
    if (this.clickOutsideHandler) {
      this.clickOutsideHandler.remove();
      this.clickOutsideHandler = null;
    }
  }

  getPopupDomNode(ref) {
    return ref ? findDOMNode(ref) : null;
  }

  onDocumentClick = (event) => {
    const target = event.target;
    const root = findDOMNode(this);
    const popupNode = this.getPopupDomNode(this.$emojiWrapper);
    const popupNode1 = this.getPopupDomNode(this.$caretdownWrapper);
    if (!contains(root, target) && !contains(popupNode, target)) {
      this.handleHideEmojiPanel();
    }

    if (!contains(popupNode1, target)) {
      this.triggerCut(false);
    }
  };

  getQuill = () => {
    if (!this.reactQuillRef || typeof this.reactQuillRef.getEditor !== 'function') {
      return;
    }

    return this.reactQuillRef.getEditor();
  };

  readFile(file, onLoad) {
    let reader = new FileReader();
    reader.onload = onLoad;
    reader.readAsDataURL(file);
  }

  handleDrop = (e) => {
    e.preventDefault();

    console.log('file drop', e.dataTransfer.files);

    let targetFile = e.dataTransfer.files[ 0 ];
    // this.readFile(targetFile);
    this.processFile(targetFile);

    // targetFile.name = '***.doc'
    // targetFile.size = 217600 === 213kb
  };

  handleDropOver = (e) => {
    e.preventDefault();
  };

  handlePaste = (e) => {
    // console.log('file paste', e.clipboardData.items, e.clipboardData.items);

    let targetFiles = e.clipboardData.items;
    for (let i = 0; i < targetFiles.length; i++) {
      let file = targetFiles[ i ];
      if (file.kind === 'string') {
        // // text
        // let _this = this;
        // file.getAsString((text) => {
        //  const range = _this.quillRef.getSelection();
        //  _this.quillRef.insertText(range.index, text);
        // });
      } else if (file.kind === 'file') {
        e.preventDefault();
        console.log('file drop in');

        // file
        this.processFile(file.getAsFile());
      }
    }
  };

  processFile = (file) => {
    let fileName = file.name;
    let fileExt = fileName.split('.').pop().toLowerCase();
    let fileType = getFileType(fileExt);
    switch (fileType) {
      case 'image':
        // 需要预览
        this.readFile(file, (e) => {
          let result = e.target.result;
          this.insertImage(result, file);
        });
        break;

      case 'voice':
      case 'video':
      case 'file':
        this.readFile(file, (e) => {          
          let result = e.target.result;
          let id = result.substring(0, 40);          
          
          let quillRef = this.getQuill();
          quillRef.focus();
          const range = quillRef.getSelection();
          const newDelta = new Delta()
            .retain(range.index)
            .delete(range.length)
            .insert({
              file: {
                id,
                name: fileName,
                size: file.size,
                type: fileExt,
                msgType: fileType,
              }
            });

          quillRef.updateContents(newDelta, 'user');
          quillRef.setSelection(range.index + 1, 'slient');
          quillRef.focus();

          Editor.filesWaitToUpload[ id ] = file;        
        });
        break;

      default:
        break;
    }

  };

  emojiHandler(emoji) {
    console.log('emoji handler click:', emoji);
  }

  fileHandler(image) {
    let quillRef = this.getQuill();

    let fileInput = quillRef.container.querySelector('input.ql-image[type=file]');
    if (fileInput == null) {
      fileInput = document.createElement('input');
      fileInput.setAttribute('type', 'file');
      // fileInput.setAttribute('accept', 'image/png, image/jpg, image/jpeg');
      fileInput.classList.add('ql-image');

      fileInput.addEventListener('change', () => {
        if (fileInput.files != null && fileInput.files[ 0 ] != null) {
          let targetFile = fileInput.files[ 0 ];
          this.processFile(targetFile);

          fileInput.value = ''; // 置为空，方便下一次上传文件
        }
      });

      quillRef.container.appendChild(fileInput);
    }

    fileInput.click();
  };

  insertImage(image, file) {
    let quillRef = this.getQuill();
    quillRef.focus();
    const range = quillRef.getSelection();
    const newDelta = new Delta()
      .retain(range.index)
      .delete(range.length)
      .insert({ image });

    quillRef.updateContents(newDelta, 'user');
    quillRef.setSelection(range.index + 1, 'slient');
    quillRef.focus();
  }

  convertBase64UrlToBlob(urlData) {
    let bytes = window.atob(urlData.split(',')[ 1 ]);
    // 去掉url的头，并转换为byte
    // 处理异常,将ascii码小于0的转换为大于0
    let ab = new ArrayBuffer(bytes.length);
    let ia = new Uint8Array(ab);
    for (let i = 0; i < bytes.length; i++) {
      ia[ i ] = bytes.charCodeAt(i);
    }

    return new Blob([ ab ], { type: 'image/png' });
  }

  cutHandler() {
    if (window.isElectron()) {
      const { ipcRenderer, remote } = window.require('electron');
      const { hiddenWin } = this.props.homeStore;
      const win = remote.getCurrentWindow();

      ipcRenderer.once('screen-cut-success', (e, img) => {
        let file = this.convertBase64UrlToBlob(img);
        this.insertImage(img, file);

        if (hiddenWin) {
          win.focus();
          win.show();
          win.setSkipTaskbar(false);
        }
      });

      ipcRenderer.send('screen-cut', hiddenWin);
    }
  }

  triggerCut(status = true) {
    this.setState({ cutsetShow: status })
  }

  /**
   * 接收到新的props值就更新一下，
   * 只有新 props 的 content 的值是空的时候才更新
   * 就是发送信息之后
   *
   * @param nextProps
   */
  componentWillReceiveProps(nextProps) {
    const newContent = nextProps.content;
    // console.log('receive new props:', nextProps);

    if (!newContent) {
      this.setState({ editorHtml: '' }, function () {
        let quillRef = this.getQuill();
        quillRef.focus();
      });
    }
  }

  handleChange = (content, delta, source, editor) => {
    // console.log('content:', content, ', delta:', editor.getContents(), ', editor:', editor.getText());

    this.setState({ editorHtml: content });
    this.props.onChange(editor.getContents());
  };

  handleEnterPress(e) {
    console.log('------------------ i am arguments:', range, e);

    this.props.onEnterPress(e);
    return true;
  }

  /**
   *
   * @param event
   */
  handleKeyDown = (event) => {
    const { sendMsgSelect } = this.props.homeStore;

    if (event.which === 13) { // enter
      if ((window.isWindows() && event.ctrlKey) || (window.isMac() && event.which === 13 && this.eventKey === 91) ) { // window触发ctrl，mac触发command
        if (sendMsgSelect === '1') {
          this.eventBrMsg();
        } else {
          this.eventSendMsg();
        }
      } else {
        if (sendMsgSelect === '1') {
          this.eventSendMsg();
        } else {
          // this.eventBrMsg();
        }
      }
    }

    this.eventKey = event.which;
    this.props.onKeyDown(event);
  };

  /**
   *  发送消息
   */
  eventSendMsg = () => {
    if (!window.isMentionListJustClosed) {
      event.preventDefault();
      this.props.onEnterPress(event);
    }

    window.isMentionListJustClosed = false;
  };

  /**
   *  换行
   */
  eventBrMsg = () => {
    let insertText = '\n';
    let quillRef = this.getQuill();
    let range = quillRef.getSelection();
    quillRef.insertText(range.index, insertText, 'user');
    quillRef.setSelection(range.index + insertText.length, 'slient');
  }

  /**
   * 选择表情发送
   */
  handleClickEmoji = (e) => {
    let quillRef = this.getQuill();

    // 这句话老牛逼了，因为使用了 antd 的弹出框，所以弹出时，quill 失去了而焦点，获得不了 range。
    quillRef.focus();

    let range = quillRef.getSelection();
    const newDelta = new Delta()
      .retain(range.index)
      .delete(range.length)
      .insert({
        emoji: e
      });


    quillRef.updateContents(newDelta, 'user');
    quillRef.setSelection(range.index + 1, 'slient');
    //quillRef.focus();

    this.handleHideEmojiPanel();
  };

  renderEmojiGrid() {
    return (
      <div
        className="emoji-wrapper"
        style={{ height: 222 }}
        ref={el => this.$emojiWrapper = el}
      >
        <Scrollbars>
          {emojiList.map((item, index) => {
            return (
              <span
                key={index}
                className="oli-emoji-content"
                style={{
                  backgroundPosition: item.position
                }}
                onClick={this.handleClickEmoji.bind(this, item)}
              />
            );
          })}
        </Scrollbars>
      </div>
    );
  }

  handleClickEmojiTrigger = () => {
    const { showEmojiPanel } = this.state;
    this.setState({
      showEmojiPanel: !showEmojiPanel,
    });
  };

  handleHideEmojiPanel = () => {
    this.setState({
      showEmojiPanel: false,
    });
  };

  renderEmojiPicker = () => {
    const content = this.renderEmojiGrid();
    const { showEmojiPanel } = this.state;

    return (
      <Popover
        visible={showEmojiPanel}
        content={content}
        placement="topLeft"
        trigger="click"
      >
        <Tooltip placement='top' title='表情'>
          <button className="ql-emoji" onClick={this.handleClickEmojiTrigger}>
            <Icon type="smile-o"/>
          </button>
        </Tooltip>
      </Popover>
    );
  };

  renderCutSet = () => {
    const { hiddenWin } = this.props.homeStore;

    return (
      <button className="ql-down" ref={el => this.$caretdownWrapper = el}>
        <Icon type="caret-down"/>
        {
          this.state.cutsetShow &&
          <Radio
            className="hidden-caret-down"
            checked={hiddenWin}
            onClick={this.triggerHiddenWin}
          >
            截图时隐藏当前窗口
          </Radio>
        }
      </button>
    )
  };

  triggerHiddenWin = (e) => {
    e.stopPropagation();

    const {
      hiddenWin,
      changeHiddenWin,
    } = this.props.homeStore;

    changeHiddenWin(!hiddenWin);
  };

  renderMsgSetting = () => {
    const {
      msgSetting,
      companyList,
    } = this.props.homeStore;

    return msgSetting && msgSetting.length > 0 ? msgSetting.map((list, index) => {
      return (
        <div className='msg-setting' key={`msgSetting-${index}`}>
          {list.extendlist && list.extendlist.length > 0 ? list.extendlist.map((b, i) => {
            return (
              <Process
                className='msgs-btn'
                key={`btn-${i}`}
                logo={b.extend_logo}
                text={b.extend_name}
                url={b.extend_url}
                type='custom'
                />
            )
          }) : null}
        </div>
      )
    }) : null
  };

  renderCut = () => {
    return (
      <div className='screen-cut'>
        <Tooltip placement='top' title='截图'>
          <button className="ql-cut"><i className="iconfont icon-cut"/></button>
        </Tooltip>
        {this.renderCutSet()}
      </div>
    )
  };

  renderCustomToolbar = () => {
    const {
      isGroup,
    } = this.props;

    return (
      <div id="toolbar">
        {this.renderEmojiPicker()}
        <Tooltip placement='top' title='文件'>
          <button className="ql-upload"><i className="anticon anticon-folder"/></button>
        </Tooltip>
        {window.isElectron() && window.isWindows() && this.renderCut()}
        <Process />
        {window.isElectron() && !isGroup && <Shake />}
        <PersonCard />
        {this.renderMsgSetting()}
      </div>
    );
  };

  render() {
    const { height, disabled } = this.props;

    return (
      <div className="oli-text-editor">
        {this.renderCustomToolbar()}
        <ReactQuill
          id="react-quill-container"
          class="react-quil-container"
          theme={'snow'}
          style={{ height }}
          readOnly={disabled}
          value={this.state.editorHtml}
          modules={this.modules}
          onChange={this.handleChange}
          onKeyDown={this.handleKeyDown}
          ref={(el) => {
            this.reactQuillRef = el
          }}
        />
      </div>
    )
  }
}

function matchTextNode(node, delta) {
  // console.log('match text', node, node.data);
  return new Delta().insert(node.data);
}

function matchElementNode(node, delta) {
  // 复制的时候去掉所有的样式，我只是在聊天
  return delta.compose(new Delta().retain(delta.length(), {
    background: false,
    color: false,
    bold: false,
    font: false,
    code: false,
    italic: false,
    link: false,
    size: false,
    strike: false,
    script: false,
    underline: false,
    blockquote: false,
    list: false,
    align: false,
    direction: false,
    header: false,
    'code-block': false,
    image: false,
    formula: false,
    video: false,
  }));
}

Editor.defaultProps = {
  height: 80,
  disabled: false,

  enableMention: false,
  mentionValues: [],
  isGroup: false,

  // 当用户在输入框 输入 @ 触发 mention 的时候~
  onMention: () => { },

  onChange: () => { },

  onKeyUp: (event) => { },

  onKeyDown: (event) => { },

  // 按下回车
  onEnterPress: (event) => { }
};

export default Editor;
