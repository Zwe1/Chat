import React, { Component } from "react";
import { inject, observer } from 'mobx-react';
import { Icon, Modal, Button, Tooltip } from "antd";

import weaSupport from '../../common/weaSupport';
import { MessageTypes } from "../../common/types";
import uuid from "uuid";
import moment from 'moment';

import { getCurrentUser } from "../../lowdb";

import { getGroup } from "../../lowdb/lowdbGroup";

import { buildMediaUrl } from '../../services/media';

const EventEmitter = require('events').EventEmitter;

// 参数检查对象
const checkParamsObj = {
	getUserFromConversation: [ 'targetId' ],
	openLink: [ 'url' ],
	config: [ 'appId' ],
	sendMsg: [ 'msgType', 'msgInfo' ],
	text: [ 'content' ],
	img: [ 'imgUrl' ],
	link: [ 'title', 'url' ],
	card: [ 'name', 'hrmCardId' ],
	news: [ 'articles' ],
	articles: [ 'title' ],
}

@inject(stores => ({
  chatStore: stores.chatStore,
  dbStore: stores.dbStore,
}))
@observer
export default class Process extends Component {
	constructor(props) {
		super(props);
		this.state = {
			processVisible: false,
			submitNum: 0,
		};

		this.event = null;
		this.imgBase = null;
		this.imgInterval = null;
		this.sendInterval = null;
		this.messages = [];
	}

  componentWillMount() {
  	const {
  		currentChatPerson
  	} = this.props.chatStore;

		this.event = new EventEmitter();

		weaSupport.track(this.event, currentChatPerson.id);

		// 获取对话信息
		// this.event.on('getConversation', (obj = {}) => {
		// 	const clickName = 'getConversation';
		// 	try {
		// 		this.implement(obj.success, clickName, 'success', {conversation: this.props.chatStore.currentChatPerson});
		// 	} catch (error) {
		// 		this.implement(obj.fail, clickName, 'fail');
		// 	}
		// 	this.implement(obj.complete, clickName, 'complete');
		// });

		// 获取群组的人员列表
		this.event.on('getUserFromConversation', (obj = {}) => {
			const clickName = 'getUserFromConversation';
			try {
				this.checkTransParams(obj, clickName);				
				const groupInfo = getGroup(obj.targetId);
				this.implement(obj.success, clickName, 'success', {userIdList: groupInfo.members});
			} catch (error) {
				this.implement(obj.fail, clickName, 'fail', error);
			}
			this.implement(obj.complete, clickName, 'complete');
		})

		// 关闭当前窗口
		this.event.on('closeWindow', (obj = {}) => {
			const clickName = 'closeWindow';
			try {
				this.handleModal(false);
				this.implement(obj.success, clickName, 'success');
			} catch (error) {
				this.implement(obj.fail, clickName, 'fail', error);
			}
			this.implement(obj.complete, clickName, 'complete');

		});

		// 发送消息
		this.event.on('sendMsg', (obj = {}) => {
			const clickName = 'sendMsg';
			try {
				this.checkTransParams(obj, clickName);
				this.handleProcessSubmit(obj);
				this.implement(obj.success, clickName, 'success');
			} catch (error) {
				this.implement(obj.fail, clickName, 'fail', error);
			}
			this.implement(obj.complete, clickName, 'complete');
		});

		// 默认浏览器打开链接
		this.event.on('openLink', (obj = {}) => {
			const clickName = 'openLink';
			try {
				this.checkTransParams(obj, clickName);
				this.handleOpenLink(obj.url);
				this.implement(obj.success, clickName, 'success');
			} catch (error) {
				this.implement(obj.fail, clickName, 'fail', error);
			}
			this.implement(obj.complete, clickName, 'complete');
		});

	}

	checkTransParams(obj = {}, type = '') {
		const checkArr = checkParamsObj[ type ];
		const objArr = Object.keys(obj);

		for (let key of checkArr) {
			if (objArr.indexOf(key) < 0) { // 不存在这个值
				throw `参数不正确哦~正确的参数为：${checkArr.join(',')}`;
			} else {	// 存在
				if (key === 'msgType') { // 这个值为 msgType (发送消息)，需要检验消息体
					const msgInfo = obj.msgInfo;
					if (msgInfo && Object.prototype.toString.apply(msgInfo) === "[object Object]") { // 存在且为对象
						const msiArr = Object.keys(msgInfo);

						switch (obj[ key ]) {
							case 1: 	// 文本
								const cpText = checkParamsObj[ 'text' ];
								for (let msiKey of cpText) {
									if (msiArr.indexOf(msiKey) < 0) {
										throw `参数不正确哦~正确的msgInfo参数为：${cpText.join(',')}`;				
									}
								}
								break;
							case 2: 	// 链接
								const cpLink = checkParamsObj[ 'link' ];
								for (let msiKey of cpLink) {
									if (msiArr.indexOf(msiKey) < 0) {
										throw `参数不正确哦~正确的msgInfo参数为：${cpLink.join(',')}`;				
									}
								}
								break;
							case 3: 	// 图片
								const cpImg = checkParamsObj[ 'img' ];
								for (let msiKey of cpImg) {
									if (msiArr.indexOf(msiKey) < 0) {
										throw `参数不正确哦~正确的msgInfo参数为：${cpImg.join(',')}`;				
									}
								}
								break;
							case 4: 	// 名片
								const cpCard = checkParamsObj[ 'card' ];
								for (let msiKey of cpCard) {
									if (msiArr.indexOf(msiKey) < 0) {
										throw `参数不正确哦~正确的msgInfo参数为：${cpCard.join(',')}`;				
									}
								}
								break;
							case 5: 	// 图文
								const cpNews = checkParamsObj[ 'news' ];
								for (let msiKey of cpNews) {
									if (msiArr.indexOf(msiKey) < 0) {
										throw `参数不正确哦~正确的msgInfo参数为：${cpNews.join(',')}`;				
									} else {	// 存在
										if (msiKey === 'articles') {
											const articles = obj.msgInfo.articles;
											if (articles && Object.prototype.toString.apply(articles) === "[object Array]") { // 存在且为数组
												const cpArt = checkParamsObj[ 'articles' ];
												articles.length > 0 && articles.forEach((v) => {
													if (v && Object.prototype.toString.apply(v) === "[object Object]") {
														const mdArr = Object.keys(v);
														for (let mdAKey of cpArt) {
															if (mdArr.indexOf(mdAKey) < 0) {
																throw `参数不正确哦~正确的msgInfo中的articles参数为：${cpArt.join(',')}`;	
															}
														}
													} else {
														throw `参数不正确哦~正确的msgInfo中的articles参数中的每一项需要为对象`;	
													}
												});
											} else {
												`参数不正确哦~正确的msgInfo中的articles参数为数组`;	
											}
										}
									}
								}
								break;
						}
					} else {
						throw `参数不正确哦~正确的msgInfo参数为对象`;
					}
				}
			}
		}

	}

	implement(func, cn, fn, obj = {}) {
		if (func && Object.prototype.toString.apply(func) === "[object Function]") {
			if (Object.prototype.toString.apply(obj) === "[object Object]") {
				func(Object.assign({errMsg: `${cn}: ${fn}`}, obj));
			} else {
				func(`errMsg: ${cn}: ${fn}, ${obj}`);
			}
		}
	}

	// 默认浏览器打开连接
	handleOpenLink = url => {
		if (window.isElectron()) {
			const electron = window.require('electron');
    	const { shell } = electron;
    	shell.openExternal(url);
		} else {
			window.open(url, '_blank');
		}
	}

	componentWillUpdate() {
		const {
  		currentChatPerson
  	} = this.props.chatStore;

  	weaSupport.track(this.event, currentChatPerson.id);
	}

	handleProcess = () => {
		this.handleModal(true);
	};

	handleModal = flag => {
		this.setState({
			processVisible: flag,
		});

		if (!flag) {
			this.setState({
				submitNum: 0,
			});
		}
	};

	handleProcessSubmit(obj) {
		const {
  		sendMessage,
  		currentChatPerson,
  	} = this.props.chatStore;

  	const { 
  		groupCache,
  	} = this.props.dbStore;

  	let lastMessage = {};
  	this.messages = [];
  	let flag = false; // 是否为图片

  	if (!obj.targetId) { // 如果没有设置targetId, 则默认为当前聊天对话框
  		obj.targetId = currentChatPerson.id;
  	}

  	switch (obj.msgType) {
  		case 1: // text 信息
  			this.messagesPush(obj.msgInfo.content, obj.targetId, 'text');
    		break;
    	case 2: // link 信息
	    	this.messagesPush(obj.msgInfo, obj.targetId, 'link');
    		break;
  		case 3: // image 信息
  			this.getImgBase(obj.msgInfo.imgUrl);
	    	flag = true;

	    	this.imgInterval = setInterval(() => {
	    		if (this.imgBase) {
	    			this.messagesPush({image: this.imgBase}, obj.targetId, 'image');
			    	clearInterval(this.imgInterval);
		    		this.imgInterval = null;
		    	}
	    	}, 200);
	    	break;
    	case 4: // 名片信息
    		this.messagesPush(obj.msgInfo, obj.targetId, 'card');
    		break
    	case 5: // 图文信息
    		this.messagesPush(obj.msgInfo, obj.targetId, 'news');
    		break;
  	}

    if (flag) {
    	this.sendInterval = setInterval(() => {
	    	if (!this.imgInterval) {
		    	sendMessage(this.messages);
		    	clearInterval(this.sendInterval);
		    	this.sendInterval = null;
		    }
	    }, 200);
    } else {
    	sendMessage(this.messages);
    }
	}

	messagesPush(obj, id, type) {
		const {
			spliceMessage,
			myGroups,
		} = this.props.chatStore;

		let isGroup = false;

		myGroups && myGroups.length > 0 && myGroups.map(v => {
			if (v.id === id) {
				isGroup = true;
			}
		});

		const { lastMessage } = spliceMessage(type, obj, {id: id, isGroup: isGroup});
		this.messages.push(lastMessage);
	}

	getImgBase(imgUrl) {
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');
		const img = new Image();

		img.onload = () => {
	  	ctx.drawImage(img, 0, 0);
    	this.imgBase = canvas.toDataURL('image/jpeg');
	  }

	  img.src = imgUrl;
	}

  render() {
  	const {
  		processVisible,
  		submitNum,
  	} = this.state;

  	const {
  		className,
  		logo,
  		text,
  		url,
  		type,
  	} = this.props;

    return (
      <div className="create-process">
	      	{type === 'custom' ? <div 
	          className={className}
	          onClick={this.handleProcess}
	        >
          	{logo ?
          		<Tooltip placement='top' title={text}>
          			<img src={buildMediaUrl(logo)} />
          		</Tooltip> : <span>{text}</span>
          	}
	        </div> : <button className="ql-process" onClick={this.handleProcess}><Icon type="retweet" /></button>}
        <Modal
					title='选择流程'
					visible={processVisible}
					onCancel={() => this.handleModal(false)}
					className='create-process-modal'
					maskClosable={false}
					destroyOnClose={true}
					footer={null}
				>
					<div className='content'>
						{processVisible ? <iframe src={url}></iframe> : null}
					</div>
				</Modal>
      </div>
    )
  }
}

Process.defaultProps = {
	className: '',
	logo: '',
	text: '',
	url: 'http://192.168.87.222:7000/test.html', // 测试地址
	type: ''
}