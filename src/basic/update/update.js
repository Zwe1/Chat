import './update.less';
import $ from 'jquery';
import { computeSize } from '../../common/fileUtil';

const { ipcRenderer } = window.require('electron');

$(() => {

  ipcRenderer.on('send-version-info', (e, args) => {
    const { currentVersion, serverVersion } = args;
    console.log('receive:', args);

    $('.span-current').text(currentVersion);
    $('.span-server').text(serverVersion);
  });

  // ipc init
  const downloadUrl = `${window.baseURL}/download`;
  const $labelError = $('.label-error');

  function showError(error) {
    $labelError.text(error).show();
  }

  function hideError(error) {
    $labelError.text('').hide();
  }

  let total = 0;

  ipcRenderer.on('update-download-error', (event) => {
    console.log('error', event);
    showError(event);

    let r = confirm('下载失败，重试吗？');
    if (r) {
      ipcRenderer.send('update-download-start', downloadUrl);
    }
  });

  ipcRenderer.on('update-download-finish', (event) => {
    console.log('finish', event);
    $('.progress-bar').width('100%');

    setTimeout(function() {
      let r = confirm('下载好了，要更新吗？')
      if (r) {
        ipcRenderer.on('install-update-no-file', function (event, data) {
          showError(data);
        });

        ipcRenderer.send('install-update-after-download');
      }
    }, 1000);
  });

  ipcRenderer.on('update-download-progress', (event, state) => {
    console.log('progress:', state);
    const {
      percent = 0,
      speed = 0,
      size = {},
      // time = {}
    } = state;

    $('.label-size-speed').show();

    $('.progress-bar').width(`${percent.toFixed(2) * 100}%`);
    $('.span-total').text(computeSize(size.total));
    $('.span-speed').text(`${computeSize(speed)} / s`);
  });

  // 稍等一下
  setTimeout(function() {
    hideError();
    ipcRenderer.send('update-download-start', downloadUrl);
    $('.label-size-speed').show();
  }, 500);
});
 
