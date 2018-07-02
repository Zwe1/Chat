let EventEmitter = require('events').EventEmitter;

class weaSupport {
	constructor(prop) {
		this.prop = prop;
	}

	static track(e, id) {
		let event = new EventEmitter();
		event.on('config', obj => { 
	    console.log('config 事件触发'); 
	    console.log(obj);
		});

		event.on('closeWindow', obj => {
			e.emit('closeWindow', obj);
		});

		event.on('sendMsg', obj => {
			e.emit('sendMsg', obj);
		});

		event.on('openLink', obj => {
			e.emit('openLink', obj);
		});

		// event.on('getConversation', obj => {
		// 	e.emit('getConversation', obj);
		// });

		event.on('getUserFromConversation', obj => {
			e.emit('getUserFromConversation', obj)
		});

		window.eMobileId = id;

		window.eMobileEvent = event;
	}
}

module.exports = weaSupport;