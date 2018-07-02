import '../common/css/jquery.fancybox.css';
import '../common/css/drag.css';
import './lookPicture.less';

window.jQuery = require('jquery');
require('../common/js/jquery.fancybox.min.js');
require('../common/js/drag.js');

const $ = window.jQuery;

window.rotateFlag = 0;
window.scale = 1;

$(document).ready(function () {
  const puls = 1.25;	// 放大倍数
  const minus = 0.8;	//	缩小倍数
  let scaleFlag = true;
  let download = true;
  let downloadNum = 0;

  const { ipcRenderer, remote } = window.require('electron');
  const os = window.require('os');

  const pictureWindow = remote.getCurrentWindow();
  $('.max').append(`<svg fill="currentColor" preserveAspectRatio="xMidYMid meet" height="1em" width="1em" viewBox="0 0 40 40" style="vertical-align: middle;">
    <g>
      <path d="m29.5 5.7h-18.6q-1.4 0-2.5 1.1t-1 2.5v18.6q0 1.4 1 2.5t2.5 1h18.6q1.5 0 2.5-1t1.1-2.5v-18.6q0-1.5-1.1-2.5t-2.5-1.1z m6.4 3.6v18.6q0 2.6-1.9 4.5t-4.5 1.9h-18.6q-2.6 0-4.5-1.9t-1.9-4.5v-18.6q0-2.7 1.9-4.6t4.5-1.8h18.6q2.7 0 4.5 1.8t1.9 4.6z">
      </path>
    </g>
  </svg>`);

  const imgContent = $('.img-content');

  ipcRenderer.on('new-filename', () => {
    const filename = window.filename;

    imgContent.empty();
    $('.fancybox-container').remove();

    if (filename && filename.imgArray) {
      for (let i of filename.imgArray) {
        imgContent.append(`<a href='${i.imgUrl ? i.imgUrl : i.imageBase64}' data-fancybox='images' data-images='${i.messageIndex}'></a>`);
      }

      const drag = function () {
        $('.fancybox-image-wrap').each(function () {
          $(this).myDrag({
            move: 'both',
            randomPosition: false,
            hander: '.hander',
          });
        });
      };

       // 鼠标滚轮放大缩小图片
      const wheel = function () {
        $('.fancybox-slide').each(function () {
          $(this).bind('mousewheel', function (event) {
            if (os.platform() === 'darwin') {
              event.originalEvent.deltaY < 0 ? resizeImg(false) : resizeImg(true);
            } else {
              event.originalEvent.deltaY > 0 ? resizeImg(false) : resizeImg(true);
            }

            event.preventDefault();
          });
        });
      };

      //	fancybox配置
      $(`[data-fancybox]`).fancybox({
        protect: false,
        toolbar: false,
        buttons: [],
        transitionEffect: false,
        spinnerTpl: `<div class='transit'><span class='transit-spin'><i></i><i></i><i></i><i></i></span></div>`,
        beforeClose: function () {
          return false;
        },
        clickContent: function (current, event) {
        },
        afterLoad: function () {
          drag();
          wheel();
        },
        wheel: false,
        touch: false,
      });

      drag();
      wheel();

      //	默认打开图片
      $(`[data-images=${filename.i}]`).click();
    }

  });

  //  旋转角度归0
  $('.fancybox-button').click(function () {
    window.rotateFlag = 0;
    window.scale = 1;
    scaleFlag = true;
  });

  const resizeImg = function (isPlus) {
    if (!scaleFlag) {
      return;
    }
    if (isPlus) {
      if (window.scale > 10) {
        return;
      }
      window.scale *= puls;
    } else {
      if (window.scale < 0.1) {
        return;
      }
      window.scale *= minus;
    }
    scaleFlag = false;
    const image = $('.fancybox-slide--complete').find('.fancybox-image');

    const values = image[ 0 ].style.transform.replace(/[^0-9.\- ]/g, '').split(' ');

    const x = values[ 0 ] || 0;
    const y = values[ 1 ] || 0;
    const rotate = values[ 3 ] || 0;

    const transform = `translate(${x}px, ${y}px) scale(${window.scale}) rotate(${rotate}deg)`;

    image.css({'transform': `${transform}`, 'transition': 'all 0.15s linear'});
    setTimeout(function () {
      scaleFlag = true;
    }, 200);
  };

  //  图片旋转
  $('.reload').click(function () {
    const image = $('.fancybox-slide--complete').find('.fancybox-image');
    
    const values = image[ 0 ].style.transform.replace(/[^0-9.\- ]/g, '').split(' ');

    const x = values[ 0 ] || 0;
    const y = values[ 1 ] || 0;
    const scale = values[ 2 ] || 1;

    window.rotateFlag++;
    image.css({'transform': `translate(${x}px, ${y}px) scale(${scale}) rotate(${window.rotateFlag * 90}deg)`, 'transition': ''});
  });

  //  图片放大
  $('.plus-o').click(function () {
    resizeImg(true);
  });

  //  图片缩小
  $('.minus-o').click(function () {
    resizeImg(false);
  });

  //  图片下载
  $('.download').click(function () {
    download = true;
    downloadNum++;
    const url = $('.fancybox-slide--complete').find('.fancybox-image').attr('src');
    ipcRenderer.send('download', {
      dlpath: url,
      savePath: ''
    });

    ipcRenderer.on('download-completed', (event, arg) => {
      if (!download) {
        return;
      }
      download = false;
      $('.look-message').append(`<div class='message-notice fade-in notice-${downloadNum}'>
        <div class='message-notice-content success'>
          <i class='check-circle'></i>
          <span>下载成功</span>
        </div>
      </div>`);
      const notice = $(`.notice-${downloadNum}`);
      setTimeout(function () {
        notice.removeClass('fade-in');
        notice.addClass('fade-out');
        setTimeout(function () {
          notice.remove();
        }, 1000);
      }, 2000);
    });
  });

  // 左箭头按钮，右箭头按钮
  $('.fancybox-button--arrow_left, .fancybox-button--arrow_right').click(function() {
    $('.fancybox-slide').find('.fancybox-image').css('transform', '');
  });

  $('.close').click(function () {
    imgContent.empty();
    $('.fancybox-container').remove();
    pictureWindow.hide();
  });

  $('.minus').click(function () {
    pictureWindow.minimize();
  });

  $('.max').click(function () {
    if (pictureWindow.isMaximized()) {
      pictureWindow.unmaximize();
    } else {
      pictureWindow.maximize();
    }
  });


});