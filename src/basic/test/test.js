import './test.less';

// document.ready
(function () {
   var ie = !!(window.attachEvent && !window.opera);
   var wk = /webkit\/(\d+)/i.test(navigator.userAgent) && (RegExp.$1 < 525);
   var fn = [];
   var run = function () { for (var i = 0; i < fn.length; i++) fn[i](); };
   var d = document;
   d.ready = function (f) {
      if (!ie && !wk && d.addEventListener)
      return d.addEventListener('DOMContentLoaded', f, false);
      if (fn.push(f) > 1) return;
      if (ie)
         (function () {
            try { d.documentElement.doScroll('left'); run(); }
            catch (err) { setTimeout(arguments.callee, 0); }
         })();
      else if (wk)
      var t = setInterval(function () {
         if (/^(loaded|complete)$/.test(d.readyState))
         clearInterval(t), run();
      }, 0);
   };
})();


// 通知事件（只有在https才有用）
window.Notification && Notification.requestPermission(); // 获取权限

document.ready(function () {
	let emobileUnread = 0; // 未读消息数量
	let isShine = false; // 浏览器窗体是否获得焦点
	let oldTitle = document.title; // 之前设置的title
	let changeTitleInterval = null; // 来回设置title的定时器

	em && em.config({
		appId: '企业id',
	});

	var currentId = em.currentId;

	console.log(currentId);

	document.querySelector('button.clear').onclick = function() {
		const addAry = document.querySelectorAll('div.add-div') || [];

		for (let item of addAry) {
			item.parentNode.removeChild(item);
		}
	}

	document.querySelector('button.cancel').onclick = function() {
		em && em.closeWindow({
			success: function(res) {
				console.log(res);
			},
			fail: function(res) {
				console.log(res);
			},
			complete: function(res) {
				console.log(res);
			},
			cancel: function(res) {
				console.log(es);
			}
		});
	}

	document.querySelector('button.submit').onclick = function() {
		em && em.sendMsg({
			msgType: 1,
			msgInfo: {
				content: '这是一条普通的信息',
			},
			fail: function(err) {
				console.log(err);
			}
		});
		em && em.closeWindow();
	}

	document.querySelector('button.photo').onclick = function() {
		em && em.sendMsg({
			msgType: 3,
			msgInfo: {
				imgUrl: 'http://img.zcool.cn/community/0142135541fe180000019ae9b8cf86.jpg@1280w_1l_2o_100sh.png',
			},
			fail: function(err) {
				console.log(err);
			}
		});
		em && em.closeWindow();
	}

	document.querySelector('button.link').onclick = function() {
		em && em.sendMsg({
			msgType: 2,
			msgInfo: {
				iconTxt: '我是大标题',
	      iconUrl: 'http://img05.tooopen.com/images/20140328/sy_57865838889.jpg',
	      iconFontcolor: '',
	      iconBgcolor: '',
	      title: '我是一条链接消息',
	      description: '描述描述描述描述描述描述描述描述描述描述描述描述描述描述描述描述描述描述描述描述描述描述描述描述描述描述描述描述描述描述描述描述描述',
	      url: 'https://www.baidu.com',
	      imageUrl: 'http://img05.tooopen.com/images/20140328/sy_57865838889.jpg',
	      image: '',
			},
			fail: function(err) {
				console.log(err);
			}
		});
		em && em.closeWindow();
	}

	// document.querySelector('button.card').onclick = function() {
	// 	em && em.sendMsg({
	// 		msgType: 4,
	// 		msgInfo: {
	// 			name: conversation.name,
	// 			hrmCardId: currentId,
	// 		}
	// 	});
	// 	em && em.closeWindow();
	// }

	document.querySelector('button.single').onclick = function() {
		em && em.sendMsg({
			msgType: 5,
			msgInfo: {
				articles: [{
					title: '标题',
	        description: '我就是一大串的描述我就是一大串的描述我就是一大串的描述我就是一大串的描述我就是一大串的描述我就是一大串的描述我就是一大串的描述我就是一大串的描述',
	        url: 'https://www.baidu.com',
	        imageurl: 'http://img05.tooopen.com/images/20140328/sy_57865838889.jpg',
	        image: '',
	        btntxt: '查看详情'
				}]
			},
			fail: function(err) {
				console.log(err);
			}
		});
		em && em.closeWindow();
	}

	document.querySelector('button.single-no').onclick = function() {
		em && em.sendMsg({
			msgType: 5,
			msgInfo: {
				articles: [{
					title: '标题标题标题标题标题标题标题标题标题标题标题标题标题标题标题标题',
	        description: '我就是一大串的描述我就是一大串的描述我就是一大串的描述我就是一大串的描述我就是一大串的描述我就是一大串的描述我就是一大串的描述我就是一大串的描述',
	        url: 'https://www.baidu.com',
	        imageurl: '',
	        image: '',
	        btntxt: ''
				}]
			},
			fail: function(err) {
				console.log(err);
			}
		});
		em && em.closeWindow();
	}

	document.querySelector('button.more').onclick = function() {
		em && em.sendMsg({
			msgType: 5,
			msgInfo: {
				articles: [{
					title: '标题1',
	        description: '我就是一大串的描述我就是一大串的描述我就是一大串的描述我就是一大串的描述我就是一大串的描述我就是一大串的描述我就是一大串的描述我就是一大串的描述',
	        url: 'https://www.baidu.com',
	        imageurl: 'http://img05.tooopen.com/images/20140328/sy_57865838889.jpg',
	        image: '',
	        btntxt: '查看详情'
				}, {
					title: '标题2标题2标题2标题2标题2标题2标题2标题2标题2标题2标题2',
	        description: '我就是一大串的描述我就是一大串的描述我就是一大串的描述我就是一大串的描述我就是一大串的描述我就是一大串的描述我就是一大串的描述我就是一大串的描述',
	        url: 'http://192.168.1.241:8076/web/#/1?page_id=57',
	        imageurl: 'http://img05.tooopen.com/images/20140328/sy_57865838889.jpg',
	        image: '',
	        btntxt: ''
				}, {
					title: '标3标3标3标3标3标3标3标3标3标3标3标3标3标3标3标3标3标3标3标3标3标3标3标3标3标3标3v',
	        description: '我就是一大串的描述我就是一大串的描述我就是一大串的描述我就是一大串的描述我就是一大串的描述我就是一大串的描述我就是一大串的描述我就是一大串的描述',
	        url: 'https://www.baidu.com',
	        imageurl: 'http://img05.tooopen.com/images/20140328/sy_57865838889.jpg',
	        image: '',
	        btntxt: '查看详情'
				}]
			},
			fail: function(err) {
				console.log(err);
			}
		});
		em && em.closeWindow();
	}

	document.querySelector('button.open').onclick = function() {
		em && em.openLink({
			url: 'http://www.baidu.com',
			success: function(res) {
				console.log(res);
			}
		});
	}

	document.querySelector('button.get').onclick = function() {
		em && em.getUserFromConversation({
			targetId: currentId,
			success: function(res) {
				console.log(res);
			},
			fail: function(err) {
				console.log(err);
			}
		});
	}

	document.querySelector('button.add').onclick = function() {
		document.getElementsByTagName('body')[ 0 ].insertAdjacentHTML('beforeend', `<div class='add-div'>aaaaaaa</div>`);
	}

	if(navigator.userAgent.indexOf('Electron') <= 0) {
		document.getElementsByTagName('body')[ 0 ].insertAdjacentHTML('beforeend', `<div class='eMobile-prod'>
	    <div class='eMobile-button'>我是按钮</div>
	    <div class='eMobile-content' style='display: none;'>
	      <div class='eMobile-overlay'></div>
	      <div class='eMobile-dialog'>
	        <div class='eMobile-close'></div>
	        <iframe src='http://localhost:3001/' class='eMobile-iframe'></iframe>
	      </div>
	    </div>
	  </div>`);
	}

	// 按钮的点击事件
  let domInterval = setInterval(function() {
  	const eButton = document.getElementsByClassName('eMobile-button')[ 0 ];
	  const eContent = document.getElementsByClassName('eMobile-content')[ 0 ];
	  const eDialog = document.getElementsByClassName('eMobile-dialog')[ 0 ];
	  const eClose = document.getElementsByClassName('eMobile-close')[ 0 ];
	  const eOverlay = document.getElementsByClassName('eMobile-overlay')[ 0 ];
	  const eIframe = document.getElementsByTagName('iframe')[ 0 ];

	  if (eButton && eContent && eDialog && eClose && eOverlay && eIframe) {
	  	// iframe的window对象
		  const iframeWindow = eIframe.contentWindow;

		  iframeWindow.onfocus = function() {
		    setTimeout(function() {
		    	isShine = false;
		    });
			};
			
			iframeWindow.onblur = function() {
				setTimeout(function() {
		    	isShine = true;
				});
			};

		  clearInterval(domInterval);

	  	// 展开
	  	eButton.onclick = function() {
		  	eContent.setAttribute('style', 'display: block');
		  	eDialog.classList.remove('eMobile-dialog-hide');
		  	iframeWindow.focused = true;
		  	setTimeout(function() {
		  		eDialog.classList.add('eMobile-dialog-show');
		  	});
		  }

		  // 遮罩层隐藏
		  eOverlay.onclick = function() {
		  	eDialog.classList.remove('eMobile-dialog-show');
		  	eDialog.classList.add('eMobile-dialog-hide');
		  	iframeWindow.focused = false;
		  	setTimeout(function() {
					eContent.setAttribute('style', 'display: none');
				}, 500);
		  }

		  // X按钮隐藏
		  eClose.onclick = function() {
		  	eDialog.classList.remove('eMobile-dialog-show');
		  	eDialog.classList.add('eMobile-dialog-hide');
		  	iframeWindow.focused = false;
		  	setTimeout(function() {
					eContent.setAttribute('style', 'display: none');
				}, 500);
		  }

	  }
  }, 200);

  // 消息提醒
  if (window.Notification) {
  	let unreadInterval = setInterval(function() {
	  	const eButton = document.getElementsByClassName('eMobile-button')[0];

	  	const flag = emobileUnread !== window.totalUnreadCount;

	  	if (flag) {
	  		emobileUnread = window.totalUnreadCount;
	  	}

	  	if (eButton && flag) {
	  		if (emobileUnread) {
	  			eButton.innerHTML = `您有新的消息(${emobileUnread})`;
	  			const eMobileUnreadObject = window.eMobileUnreadObject;

	  			console.log(eMobileUnreadObject);

	  			if (isShine) {
	  				const noti = new Notification(eMobileUnreadObject.name, {
			        body: eMobileUnreadObject.last,
			        icon: 'http://img.zcool.cn/community/010f87596f13e6a8012193a363df45.jpg@1280w_1l_2o_100sh.jpg',
			        tag: eMobileUnreadObject.fromUserId ? eMobileUnreadObject.fromUserId : 'unknown',
			        renotify: true,
				    });

				    noti.onclick = function (e) {
				    	eButton.click();
				    	const eIframe = document.getElementsByTagName('iframe')[ 0 ];
				    	const iframeWindow = eIframe && eIframe.contentWindow;
				    	iframeWindow.eMobileClickId = e.target.tag;
				    }
	  			}
	  			changeTitle(emobileUnread);
	  		} else {
	  			eButton.innerHTML = '我是按钮';
	  			clearInterval(changeTitleInterval);
	  			changeTitleInterval = null;
	  			document.title = oldTitle;
	  		}
	  	}
	  }, 1000);
  }

  // 顶部title修改
  const changeTitle = function(unread) {
  	if (changeTitleInterval) {
  		return;
  	}
  	changeTitleInterval = setInterval(function() {
  		if (isShine) {
	      if (/新/.test(document.title)) {
	      	document.title = '【　　　　　】';
	      } else {
	        document.title = '【你有(' + unread + ')条新消息】';    
	      }
	    } else {
	    	document.title = oldTitle;
	    }
  	}, 500);
  }

  window.onfocus = function() {
    isShine = false;
	};

	window.onblur = function() {
    isShine = true;
	};

	// for IE
	document.onfocusin = function() {
    isShine = false;
	};
	
	document.onfocusout = function() {
    isShine = true;
	};
})