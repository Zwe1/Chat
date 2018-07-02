import React, { Component } from 'react';
import { Modal, Input, Button, Icon, Switch, Select } from 'antd';
import { inject, observer } from 'mobx-react';
import _ from 'lodash';

import $ from 'jquery';

import { getCurrentUser } from '../../lowdb';

const Option = Select.Option;

@inject(stores => ({
  homeStore: stores.homeStore,
}))
@observer
export default class SystemSetting extends Component {
	constructor(props) {
		super(props);
		const cut = _.cloneDeep(this.props.homeStore.systemCut);

		this.state = {
			cut: cut,
			error: {},
			close: {},
			repeat: {},
		}
		// keyCode: 91 meta 18 alt 17 ctrl 16 shift 20 caps 9 tab 37 - 40 上下左右 13 enter

		this.disabledKeyCode = [9, 13, 20, 37, 38, 39, 40];
		this.toolKeyCode = [9, 13, 16, 17, 18, 20, 37, 38, 39, 40, 91];
		this.useKeyCode = [16, 17, 18, 91];
	}

	componentDidMount() {
		const { cut } = this.state;

		if (cut && cut.screenCut) {
			this.bindScreenCut();
		}

		if (cut && cut.activeModal) {
			this.bindActiveModal();	
		}

		if (cut && cut.search) {
			this.bindSearch();
		}
	}

	bindScreenCut = () => {
		const { ipcRenderer } = window.require('electron');
		const { hiddenWin } = this.props.homeStore;
		ipcRenderer.send('screenCut', {
			key: this.state.cut['screenCut'],
			hiddenWin,
		});
	};

	bindActiveModal = () => {
		const { ipcRenderer } = window.require('electron');
		ipcRenderer.send('activeModal', {
			key: this.state.cut['activeModal'],
		});
	};

	bindSearch = () => {
		const { ipcRenderer } = window.require('electron');
		ipcRenderer.send('search', {
			key: this.state.cut['search'],
		});

		ipcRenderer.on('search-success', () => {
			// 激活搜索窗口
			$('.input-all-search').find('input').focus();
			$('.input-all-search').find('input').click();
		});
	}

	handleModal = (flag) => {
		const { handleModal } = this.props;
		handleModal && handleModal('SyVisible', flag);
	};

	// input 获取焦点
	handleInputFocus = flag => {
		let clearFlag = true; // 输入是否清空input

		if (this.state.error[flag]) {
			this.setState({
				cut: Object.assign(this.state.cut, {[flag]: ''}),
			});
		}

		// 监听键盘点击事件
		window.onkeydown = e => {
			if (clearFlag) {
				// 开始输入先清空
				this.setState({
					cut: Object.assign(this.state.cut, {[flag]: ''}),
					repeat: Object.assign(this.state.repeat, {[flag]: false}),
				});
				clearFlag = false;
			}
			if (this.disabledKeyCode.indexOf(e.keyCode) > -1) {
				return;
			}
			const inputKey = this.state.cut[flag] ? this.state.cut[flag] : '';
			if (e.keyCode === 8) { // 删除
				if (inputKey) {
					let arr = [];
					if (inputKey.indexOf('+') > 0) {
						arr = inputKey.split('+');
					} else {
						arr = [inputKey];
					}
					arr.splice(arr.length - 1);
					this.setState({
						cut: Object.assign(this.state.cut, {[flag]: arr.join('+')}),
					});					
				}
			} else {
				let key = '';
				let error = false;
				let close = false;
				if (this.useKeyCode.indexOf(e.keyCode) < 0) { // 输入的不为工具键
					key = e.key.toUpperCase();
				} else {
					if (e.key === 'Meta') { // 输入的为command
						key = 'Command';
					} else {
						key = e.key;
					}
				}
				if (inputKey) { // 若输入框不为空
					if (inputKey.indexOf(key) < 0) {
						key = `${inputKey}+${key}`;
					} else {
						key = inputKey;
					}
					close = true;
				} else { // 若输入框为空，同时输入不为工具键
					if (this.useKeyCode.indexOf(e.keyCode) < 0) {
						key = '';
						error = true;
					}
				}
				this.setState({
					cut: Object.assign(this.state.cut, {[flag]: key}),
					error: Object.assign(this.state.error, {[flag]: error}),
					close: Object.assign(this.state.close, {[flag]: close}),
				});
				if (this.toolKeyCode.indexOf(e.keyCode) < 0) {
					if (!error) {
						this.refs[`${flag}Input`].blur();
					}
				}
			}
		}
	};

	// input失去焦点
	handleInputBlur = flag => {
		// 取消监听键盘点击事件
		window.onkeydown = null;

		// 当输入完成的最后一位不是字母，数字，提示错误
		const short = this.state.cut[flag].split('+');
		if (short[short.length - 1].length > 1) {
			this.setState({
				error: Object.assign(this.state.error, {[flag]: true}),
			});
			return;
		}

		const { cut } = this.state;

		for (let i in cut) {
			if (cut[i] === this.state.cut[flag] && i !== flag && this.state.cut[flag] !== '') {
				this.setState({
					repeat: Object.assign(this.state.repeat, {[flag]: true})
				});
				return;
			}
		}

		// 这里就剩下了 输入的正确的快捷键 开始绑定操作
		const { changeSystemCut } = this.props.homeStore;

		changeSystemCut(this.state.cut);

		switch(flag) {
			case 'screenCut':
				this.bindScreenCut();
				break;

			case 'activeModal':
				this.bindActiveModal();
				break;

			case 'search':
				this.bindSearch();
				break;
		}
	};

	handleInputClear = flag => {
		this.setState({
			cut: Object.assign(this.state.cut, {[flag]: ''}),
			close: Object.assign(this.state.close, {[flag]: false})
		});
	};

	handleInputChange = flag => {};

	renderShortCut = key => {
		const { cut, error, close, repeat } = this.state;

		let spanText = '';

		switch(key) {
			case 'search':
				spanText = '搜索快捷键';
				break;
			case 'screenCut':
				spanText = '截图快捷键';
				break;
			case 'activeModal':
				spanText = '激活窗口快捷键';
				break;
		}

		return (
			<div className='list'>
				<span>{spanText}</span>
				<div className='input-content'>
					<input 
						onFocus={() => this.handleInputFocus(key)} 
						onBlur={() => this.handleInputBlur(key)}
						onChange={() => this.handleInputChange(key)}
						value={cut[key]}
						ref={`${key}Input`}
						placeholder={'请定义快捷键'}
					/>
					{close[key] && <span className='input-clear' onClick={() => this.handleInputClear(key)} />}
				</div>
				{error[key] ? <p className='input-error'>请输入正确的快捷键</p> : repeat[key] ? <p className='input-error'>快捷键冲突了</p> : null}
			</div>
		)
	};

	// 登录
	renderLogin() {
		const {
			autoSwitch,
			autoLoginSwitch,
			handleSwitch,
		} = this.props.homeStore;

		return (
			<div className='login-content'>
				<h1 className='h1-bottom'>登录</h1>
				<div className='con-content'>
					<span className='con-title'>自动登录</span>
					<div className='con-switch'>
						<Switch onChange={(checked) => handleSwitch(checked, 'autoLoginSwitch')} checked={autoLoginSwitch} />
					</div>
				</div>
				{window.isWindows() && <div className='con-content'>
					<span className='con-title'>开机自动启动</span>
					<div className='con-switch'>
						<Switch onChange={(checked) => handleSwitch(checked, 'autoSwitch')} checked={autoSwitch} />
					</div>
				</div>}
			</div>
		)
	}

	// 主面板
	renderMainPanel() {
		const {
			handlePanelSelect,
			panelSelect,
		} = this.props.homeStore;

		return (
			<div className='main-panel'>
				<h1 className='h1-bottom'>主面板</h1>
				<div className='con-content'>
					<span className='con-title'>关闭主面板</span>
					<Select className='con-select' value={panelSelect} onChange={(value) => handlePanelSelect(value)}>
						<Option value='1'>最小化到托盘</Option>
						<Option value='2'>退出程序</Option>
					</Select>
				</div>
			</div>
		)
	}

	// 通知
	renderNotice() {
		const { 
			voiceSwitch,
			iconSwitch, 
			handleSwitch,
		} = this.props.homeStore;

		return (
			<div className='notice-content'>
				<h1 className='h1-bottom'>通知</h1>
				<div className='con-content'>
					<span className='con-title'>消息提示音</span>
					<div className='con-switch'>
						<Switch onChange={(checked) => handleSwitch(checked, 'voiceSwitch')} checked={voiceSwitch} />
					</div>
				</div>
				<div className='con-content'>
					<span className='con-title'>桌面图标闪烁</span>
					<div className='con-switch'>
						<Switch onChange={(checked) => handleSwitch(checked, 'iconSwitch')} checked={iconSwitch} />
					</div>
				</div>
			</div>
		)
	}

	// 快捷键
	renderAllShortCut() {
		const {
			sendMsgSelect,
			handleSendMsgSelect,
		} = this.props.homeStore;

		return (
			<div className='short-cut-content'>
				<h1>快捷键</h1>
				{this.renderShortCut('search')}
				{window.isWindows() && this.renderShortCut('screenCut')}
				{this.renderShortCut('activeModal')}
				<div className='con-content send-msg-con'>
					<span className='con-title'>发送消息</span>
					<Select className='con-select' value={sendMsgSelect} onChange={(value) => handleSendMsgSelect(value)}>
						<Option value='1'>{window.isMac() ? 'Enter发送，Command+Enter换行' : 'Enter发送，Ctrl+Enter换行'}</Option>
						<Option value='2'>{window.isMac() ? 'Command+Enter发送，Enter换行' : 'Ctrl+Enter发送，Enter换行'}</Option>
					</Select>
				</div>
			</div>
		)
	}

	render() {
		const { visible } = this.props;

		return (
			<Modal
				title='系统设置'
				className='system-setting-modal'
				visible={visible}
				maskClosable={false}
				onCancel={() => this.handleModal(false)}
				footer={[
          <Button key='cancle' onClick={() => this.handleModal(false)}>取消</Button>,
	        <Button key='ok' type='primary' onClick={() => this.handleModal(false)}>
	          确定
	        </Button>
        ]}
			>
				<div className='short-cut'>
					{this.renderLogin()}
					{this.renderMainPanel()}
					{this.renderNotice()}
					{this.renderAllShortCut()}
				</div>
			</Modal>
		)
	}
}