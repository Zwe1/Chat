import { Quill } from 'react-quill';

//let Inline = Quill.import('blots/inline');
let Embed = Quill.import('blots/embed');

class EmojiBlot extends Embed {

  /**
   * <span class="oli-emoji-content" style="background-position: 0 0"/>
   *
   * @param emoji
   * @returns {*}
   */
  static create(emoji) {
    let node = super.create();
    node.setAttribute('data-key', emoji.name);

    node.classList.add('oli-emoji-content');
    node.style.backgroundPosition = emoji.position;
    node.setAttribute('contenteditable', 'false');
    return node;
  }

  /**
   * 返回 emoji 的id
   *
   * @param node
   * @returns {*}
   */
  static value(node) {
    return node.getAttribute('data-key');
  }

  static formats(node) {
    // We still need to report unregistered src formats
    let format = {};
    if (node.hasAttribute('class')) {
      format.class = node.getAttribute('class');
    }

    if (node.hasAttribute('style')) {
      format.style = node.getAttribute('style');
    }

    if (node.hasAttribute('data-key')) {
      format[ 'data-key' ] = node.getAttribute('data-key');
    }

    return format;
  }

  format(name, value) {
    if (name === 'class' || name === 'style' || name.indexOf('data-') === 0) {
      if (value) {
        this.domNode.setAttribute(name, value);
      } else {
        this.domNode.removeAttribute(name);
      }
    } else {
      super.format(name, value);
    }
  }

}

EmojiBlot.blotName = 'emoji';
EmojiBlot.tagName = 'span';
EmojiBlot.className = 'editor-emoji';

export default EmojiBlot;