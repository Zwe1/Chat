import { Quill } from 'react-quill';
let BlockEmbed = Quill.import('blots/block/embed');

class VideoBlot extends BlockEmbed {

  static create(url) {
    let node = super.create();

    // Set non-format related attributes with static values
    node.setAttribute('src', url);

    return node;
  }

  static formats(node) {
    // We still need to report unregistered embed formats
    let format = {};
    if (node.hasAttribute('height')) {
      format.height = node.getAttribute('height');
    }

    if (node.hasAttribute('width')) {
      format.width = node.getAttribute('width');
    }
    return format;
  }

  static value(node) {
    return node.getAttribute('src');
  }

  format(name, value) {
    // Handle unregistered embed formats
    if (name === 'height' || name === 'width') {
      if (value) {
        this.domNode.setAttribute(name, value);
      } else {
        this.domNode.removeAttribute(name, value);
      }
    } else {
      super.format(name, value);
    }
  }
}

VideoBlot.blotName = 'video';
VideoBlot.tagName = 'video';