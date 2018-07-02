import React, { Component } from 'react';
import { Modal, Button } from 'antd';
import { inject, observer } from 'mobx-react';

@inject(stores => ({
  homeStore: stores.homeStore,
}))
@observer
export default ChangeSetting => {
	return class Setting extends Component {
		constructor(props) {
			super(props);
			this.state = {
				rValue: '', // 主题选中
				cValue: '', // 企业选中
			}
			this.ntValue = '';	// 主题默认
			this.ncValue = '';	// 企业默认
			this.visible = false;
		}

		// 设置第一次打开的值为接口获取的值
		componentWillReceiveProps(nextProps) {
			const { visible } = nextProps;
			if (visible !== this.visible && visible) {
				this.visible = true;
				this.setState({
					rValue: this.calcThemeRadioValue(nextProps.homeStore.themeList),
				});
				if (this.ncValue) {
					this.setState({
						cValue: this.ncValue,
					});
				} else {
					this.setState({
						cValue: this.calcCompanyRadioValue(nextProps.homeStore.companyList),
					});
				}
			}
			this.visible = false;
		}

		handleModal = (flag) => {
			const { handleModal, visibleKey = '' } = this.props;
			handleModal && handleModal(visibleKey, flag);
		};

		async handleThemeSubmit() {
			const { rValue } = this.state;
			if (rValue === '' || rValue === this.ntValue) {
				this.handleModal(false);
				return;
			}
			const { selectTheme } = this.props.homeStore;
			await selectTheme(rValue);
			this.handleModal(false);
			this.ntValue = rValue;
		}

		handleChangeTRadio = (e) => {
			this.setState({
				rValue: e.target.value,
			});
		};

		handleChangeCRadio = (e) => {
			this.setState({
				cValue: e.target.value,
			});
		};

		calcCompanyRadioValue = list => {
			if (this.ncValue) {
				return this.ncValue;
			}
			if (list && list.length > 0) {
				this.ncValue = list[0].corpid;
				return list[0].corpid;
			}
			return '';
		};

		calcThemeRadioValue = list => {
			const rv = list && list.length > 0 ? list.map(v => {
				const radio = v.themelist.filter(r => r.selected)[0];
				this.ntValue = radio ? radio.theme_id : '';
				return this.ntValue;
			}).filter(v => v !== '') : [];
			return rv.length > 0 ? rv[0] : '';
		};

		async handleCompanySubmit () {
			const { cValue } = this.state;

			if (cValue === '' || cValue === this.ncValue) {
				this.handleModal(false);
				return;
			}
			const { changeCompany } = this.props.homeStore;
			await changeCompany(cValue);
			this.handleModal(false);
			this.ncValue = cValue;
		};

		render() {
			const { 
				rValue,
				cValue,
			} = this.state;

			const { 
				visible,
			} = this.props;

			const { 
				themeList, 
				selectThemePending,
				companyList,
				setMainCompanyPending,
			} = this.props.homeStore;

			const defaultRValue = this.calcThemeRadioValue(themeList);

			const defaultCValue = this.calcCompanyRadioValue(companyList);

			const props = {
				visible: visible,
				handleModal: this.handleModal,
			};

			const themeProps = {
				handleThemeSubmit: this.handleThemeSubmit.bind(this),
				themeList: themeList,
				selectThemePending: selectThemePending,
				rValue: rValue ? rValue : defaultRValue,
				handleChangeRadio: this.handleChangeTRadio,
			};

			const companyProps = {
				companyList: companyList,
				handleCompanySubmit: this.handleCompanySubmit.bind(this),
				cValue: cValue ? cValue : defaultCValue,
				setMainCompanyPending: setMainCompanyPending,
				handleChangeRadio: this.handleChangeCRadio,
			}

			return (
				<ChangeSetting {...props} {...themeProps} {...companyProps}/>
			)
		}
	}
}