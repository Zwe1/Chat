// 图片转canvas对象
export function imageToCanvas(src, obj, cb) {
  let img = new Image();
  img.src = src;
  img.onload = function () {
    let that = this;
    // 默认按比例压缩
    let w = that.width, h = that.height, scale = w / h;
    // 指定最大宽度
    if (obj.maxWidth && obj.maxWidth < w) {
      w = obj.maxWidth;
      h = w / scale;
    }
    // 指定最大高度
    if (obj.maxHeight && obj.maxHeight < h) {
      h = obj.maxHeight;
      w = h * scale;
    }
    w = obj.width || w;
    h = obj.height || h;

    //生成canvas
    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');
    // 创建属性节点
    let anw = document.createAttribute("width");
    anw.nodeValue = w;
    let anh = document.createAttribute("height");
    anh.nodeValue = h;
    canvas.setAttributeNode(anw);
    canvas.setAttributeNode(anh);
    ctx.drawImage(that, 0, 0, w, h);
    cb && cb(canvas);
  }
}

// 利用canvas压缩图片
export function compressImg(src, options, cb) {
  console.log("compressed image.!");

  // let w = options? (options.width || 240) : 240;
  imageToCanvas(src, options, function (canvas) {
    let defaultQuality = 0.1;
    let quality = options ? (options.quality || defaultQuality) : defaultQuality;
    let base64 = canvas.toDataURL('image/jpeg', quality);
    base64 = base64.replace(/^data:image\/\w+;base64,/, "");
    cb && cb(base64);
  });
}

//将base64转换为文件
export function dataURLtoFile(dataurl, filename) {
  let arr = dataurl.split(',');
  let mime = arr[ 0 ].match(/:(.*?);/)[ 1 ];
  let bstr = atob(arr[ 1 ]);
  let n = bstr.length;
  let u8arr = new Uint8Array(n);

  while(n--){
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type:mime });
}