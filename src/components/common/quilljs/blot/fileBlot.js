import { Quill } from 'react-quill';

let BlockEmbed = Quill.import('blots/block/embed');
import { computeSize } from '../../../../common/fileUtil';


class FileBlot extends BlockEmbed {

  static createFile(file, node) {

    function getAvatarSrc(type) {
      //文件类型
      const types = {
        'image': ['gif','png','jpg','bpm','img'],
        'word': ['doc','docx'],
        'excel': ['xls','xlsx'],
        'ppt': ['ppt','pptx'],
        'pdf': ['pdf'],
        'music': ['mp3','wav','mid'],
        'video': ['mp4','avi','ra','rm','rmvb','mpg','mpeg','mov','wmv'],
        'txt': ['txt'],
        'zip': ['zip','gz'],
        'rar': ['rar'],
        'key': ['key'],
      };

      for (let [name, fix] of Object.entries(types)) {
        if (fix.includes(type)) {
          return 'img-' + name;
        }
      }

      return 'img-default';
    };

    let iconEle = document.createElement('div');
    const type = getAvatarSrc(file.type);
    iconEle.classList.add(type, 'file-blot-logo');
    let nameEle = document.createElement('p');
    nameEle.textContent = file.name;
    nameEle.classList.add('file-blot-name');

    let sizeEle = document.createElement('p');
    sizeEle.textContent = computeSize(file.size);
    sizeEle.classList.add('file-blot-size');

    // let imgEle = document.createElement('img');
    // if (file.type) {
    //   imgEle.src = '';
    //   imgEle.onload = () => {
    //     node.appendChild(imgEle);
    //   }
    // }

    node.appendChild(iconEle);
    node.appendChild(nameEle);
    node.appendChild(sizeEle);
    node.setAttribute('contenteditable', 'false');
    node.setAttribute('title', file.name);
  }

  static create(file) {
    let node = super.create();
    let keys = Object.keys(file);

    keys.forEach(key => {
      node.dataset[key] = file[key];
    });

    FileBlot.createFile(file, node);
    return node;
  }

  static value(domNode) {
    return domNode.dataset;
  }

}

FileBlot.blotName = 'file';
FileBlot.tagName = 'div';
FileBlot.className = 'quill-file-blot';

export default FileBlot;