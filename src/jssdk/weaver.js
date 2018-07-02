class weaver {
	constructor(prop) {
    this.prop = prop;
    this.event = window.parent.eMobileEvent;
    this.currentId = window.parent.eMobileId;
    this.configFlag = false;
  }

  configFuc() {
  	if (!this.configFlag) {
  		console.log('请先调用config方法');
  		return false;
  	} else {
  		return true;
  	}
  }

  getConversation(obj) {
  	if (this.configFuc()) {
  		this.event && this.event.emit('getConversation', obj);
  	}
  }

	config(obj) {
		this.event && this.event.emit('config', obj);
		this.configFlag = true;
	}

	closeWindow(obj) {
		if (this.configFuc()) {
			this.event && this.event.emit('closeWindow', obj);
		}
	}

	sendMsg(obj) {
		if (this.configFuc()) {
			this.event && this.event.emit('sendMsg', obj);
		}
	}

	openLink(obj) {
		if (this.configFuc()) {
			this.event && this.event.emit('openLink', obj);
		}
	}

	getUserFromConversation(obj) {
		if (this.configFuc()) {
			this.event && this.event.emit('getUserFromConversation', obj);
		}
	}
}

window.em = new weaver();
window.jEmobile = new weaver();