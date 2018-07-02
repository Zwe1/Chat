import generateKey from './agoraSign';

let AgoraRTC = require('../exlib/AgoraRTCSDK-2.0.0');

class Agora {

  constructor(appId, channel) {
    this.appId = appId;

    // 互通模式
    // 纯 Web 模不需要传入 mode
    this.client = AgoraRTC.createClient({
      mode: 'interop'
    });

    this.localStream = null;

    this.cameraId = null;
    this.microphoneId = null;

    this.key = null;

    // 这个 channel 应该是 video.js 产生的。
    // 对方接收到这个 channel 之后，加入channel 就好了
    this.channel = channel || 'roomName';

    this.remoteStreamList = [];

    this.cameraList = [];
    this.microphoneList = [];
    this.outputList = [];

    this.resolution = "480p";
    this.maxFrameRate = 15;

    this.initDevices();
  }

  init() {
    if (this.key === null) {
      this.key = generateKey(this.channel);
    }

    // TODO: ajax 获取 key

    this.client.init(this.appId, () => {
      console.log("AgoraRTC client initialized");

      this.client.join(this.key, this.channel, undefined, (uid) => {
        console.log("join channel success.");
        // 从现在开始计时，呼叫等待时间
        // TODO: 要不要设定一个超时时间
        if (this.onJoinChannelSuccess) {
          this.onJoinChannelSuccess(uid);
        }

        this.initLocalStream(uid);
      }

      );
    });

    this.subscribeStreamEvents();
  }

  initLocalStream(uid) {
    if (this.localStream) {
      // local stream exist already
      this.client.unpublish(this.localStream, function (err) {
        console.log("Unpublish failed with error: ", err);
      });

      this.localStream.close();
    }

    let options = {
      streamID: uid,
      audio: false,
      audioEnabled: false,
      video: false,
      videoEnabled: false,
      screen: false
    };

    if (this.cameraId !== null) {
      options.video = true;
      options.videoEnabled = true;
      options.cameraId = this.cameraId;
    }

    if (this.microphoneId !== null) {
      options.audio = true;
      options.audioEnabled = true;
      options.microphoneId = this.microphoneId;
    }

    // let videoProfile = this.getVideoProfile();

    console.log('video options:', options);
    this.localStream = AgoraRTC.createStream(options);

    if (this.cameraId === null) {
      this.localStream.disableVideo();
    }

    if (this.microphoneId === null) {
      this.localStream.disableAudio();
    }

    // The user has granted access to the camera and mic.
    this.localStream.on("accessAllowed", function () {
      console.log("[agora] - accessAllowed");
    });

    // The user has denied access to the camera and mic.
    this.localStream.on("accessDenied", function () {
      console.log("[agora] - accessDenied");
    });

    // this.localStream.setVideoResolution(this.resolution);
    // this.localStream.setVideoProfile(videoProfile);
    this.localStream.init(
      () => {
        console.log('localStream has init success.');
        //localStream.play('agora_local');

        // 上传本地视频流
        this.client.publish(this.localStream, function (err) {
          console.log("Timestamp: " + Date.now(), " Publish local stream error: " + err);
        });

        // 该回调通知应用程序本地音视频流已上传。
        this.client.on('stream-published', () => {
          console.log('本地音视频流已上传。');

          if (this.onLocalStreamPublished) {
            this.onLocalStreamPublished(this.localStream);
          }
        });
      },
      (err) => {
        // error
        console.log("本地音视频流初始化失败~ 不过没关系, 可以看到请他人的画面和声音~", err);

        if (this.onInitLocalStreamError) {
          this.onInitLocalStreamError(err);
        }
      }
    );
  }

  getVideoProfile() {
    const resolution = this.resolution;
    const frameRate = this.maxFrameRate;
    let result = '';

    switch (resolution) {
      case '120p':
        result = "120P";
        break;
      case '240p':
        result = "240P";
        break;
      case '360p':
        if (frameRate === 15) {
          result = "360P";
        } else {
          result = "360P_4";
        }
        break;
      case '480p':
        if (frameRate === 15) {
          result = "480P_8";
        } else {
          result = "480P_9";
        }
        break;
      case '720p':
        if (frameRate === 15) {
          result = "720P";
        } else {
          result = "720P_3";
        }
        break;
      case '1080p':
        if (frameRate === 15) {
          result = "1080P";
        } else {
          result = "1080P_3";
        }
        break;
      default:
        // 720p, 30
        // Do nothing
        break;
    }

    return result;
  }

  initDevices() {
    this.microphoneList = [];
    this.cameraList = [];
    this.outputList = [];

    Agora.getDevices((devices) => {
      console.log('devices:', devices);

      devices.forEach(item => {
        if (item.kind === 'audioinput' && item.deviceId !== 'default' && item.deviceId !== 'communications') {
          this.microphoneList.push(item);
        } else if (item.kind === 'videoinput') {
          this.cameraList.push(item);
        } else {
          this.outputList.push(item);
        }
      });

      console.log('microphoneList:', this.microphoneList);
      console.log('cameraList:', this.cameraList);

      const firstMicro = this.microphoneList[0];
      this.microphoneId = firstMicro ? firstMicro.deviceId : null;

      const firstCamera = this.cameraList[0];
      this.cameraId = firstCamera ? firstCamera.deviceId : null;
    });
  }

  subscribeStreamEvents() {
    /**
     * 远程音视频流已添加回调事件
     */
    this.client.on('stream-added', function (evt) {
      var stream = evt.stream;
      console.log("New stream added: " + stream.getId());

      // this.client.setRemoteVideoStreamType(stream, this.client.remoteVideoStreamTypes.REMOTE_VIDEO_STREAM_LOW);
      this.client.subscribe(stream, function (err) {
        console.log("Subscribe stream failed", err);
      });
    });

    /**
     * 对方用户已离开会议室回调事件
     */
    this.client.on('peer-leave', function (evt) {
      console.log("Peer has left: " + evt);
      this.onStreamOnPeerLeave(evt.uid);
    });

    /**
     * 远程音视频流已订阅回调事件
     */
    this.client.on('stream-subscribed', function (evt) {
      var stream = evt.stream;
      console.log("Got stream-subscribed event", evt);
      console.log("Subscribe remote stream successfully: " + stream.getId());
      this.onStreamOnPeerAdded(stream);
    });

    /**
     * 远程音视频流已删除回调事件
     */
    this.client.on("stream-removed", function (evt) {
      var stream = evt.stream;
      console.log("Stream removed: " + evt.stream.getId());
      this.onStreamOnPeerLeave(stream.getId());
    });
  }

  onStreamOnPeerAdded (stream) {
    this.addToRemoteStreamList(stream);

    if (this.onRemoteListChange) {
      this.onRemoteListChange(this.remoteStreamList, stream);
    }
  }

  onStreamOnPeerLeave (stream) {
    this.removeFromRemoteStreamList(stream.getId());

    if (this.onRemoteListChange) {
      this.onRemoteListChange(this.remoteStreamList, stream);
    }
  }

  addToRemoteStreamList(stream) {
    if (stream) {
      this.remoteStreamList.push({
        id: stream.getId(),
        stream: stream
      });
    }
  }

  removeFromRemoteStreamList(id) {
    for (let i = 0; i < this.remoteStreamList.length; i++) {
      let cur = this.remoteStreamList[i];
      if (cur.id === id) {
        let dummy = this.remoteStreamList.splice(i, 1);
        if (dummy.length === 1) {
          console.log('stream stop...');
          dummy[0].stream.stop(); // 删除之前要停止
          break;
        }
      }
    }
  }

  static getResolutionArray(reso) {
    switch (reso) {
      case "120p":
        return [160, 120];
      case "240p":
        return [320, 240];
      case "360p":
        return [640, 360];
      case "480p":
        return [848, 480];
      case "720p":
        return [1280, 720];
      case "1080p":
        return [1920, 1080];
      default:
        return [1280, 720];
    }
  }

  calculateVideoSize(multiple) {
    var viewportWidth = document.body.clientWidth,
      viewportHeight = document.body.clientHeight,

      curResolution = Agora.getResolutionArray(this.resolution),

      width,
      height,

      newWidth,
      newHeight,

      ratioWindow,
      ratioVideo;

    if (multiple) {
      width = viewportWidth / 2 - 50;
      height = viewportHeight / 2 - 40;
    } else {
      width = viewportWidth - 100;
      height = viewportHeight - 80;
    }

    ratioWindow = width / height;
    ratioVideo = curResolution[0] / curResolution[1];

    if (ratioVideo > ratioWindow) {
      // calculate by width
      newWidth = width;
      newHeight = width * curResolution[1] / curResolution[0];
    } else {
      // calculate by height
      newHeight = height;
      newWidth = height * curResolution[0] / curResolution[1];
    }

    // 这个是最小宽度，高度
    newWidth = Math.max(newWidth, 160);
    newHeight = Math.max(newHeight, 120);

    return {
      width: newWidth,
      height: newHeight
    };
  }

  stopLocalAndRemoteStreams() {
    if (this.localStream) {
      this.localStream.stop();
    }

    this.remoteStreamList.forEach(item => {
      item.stream.stop();
    });
  }

  static playLocal(id) {
    this.localStream.play(id);
  }

  static play(stream) {
    stream.play(stream.getId());
  }

}

Agora.getDevices = AgoraRTC.getDevices;

export default Agora;

// let a = new Agora('sdsdsd');
// console.log(a);
//
// a.onRemoteListChange = () => {
//
// };
