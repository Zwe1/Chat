import emojiFactory from './emoji-data';

// config
let configs = {
  size: 25,
  lang: "zh",
  reg: /[\uf000-\uf700]/g
};

function computeBgPosition(position, sizePx = 25) {
  let scale = sizePx / configs.size;

  let [ x, y ] = position.split(' ');
  x = x.split("px")[ 0 ];
  y = y.split("px")[ 0 ];

  return parseInt(x) * scale + "px " + parseInt(y) * scale + "px";
}

/**
 *
 * @param nativeEmoji
 * @returns {*}
 */
function calculateUTF(nativeEmoji) {
  if (61440 < nativeEmoji.charCodeAt(0)) {
    let emojiUnicodeKey = escape(nativeEmoji).replace("%u", "u1");
    let emoji = emojiFactory[ emojiUnicodeKey ];
    if (emoji) {
      return emoji.tag;
    }
  }

  return nativeEmoji;
}

/**
 * 将字符串中的unicode码转化为可以显示的原生emoji字符
 *
 * @param  {string} emojis   必填，需要转化的字符串
 * @param  {regExp} reg      可选，标识unicode码的匹配范围。默认为init时设置的regExp，如果不设置，默认为/[\uf000-\uf700]/g
 * @return {string}          转化后的字符串
 */
function emojiDecode(emojis, reg) {
  return emojis.replace(reg, function (emoji) {
    return calculateUTF(emoji) || emoji;
  });
}

function getEmojiHtml(object) {
  let size = object.size;
  let name = object.name;
  let position = object.position;

  let style = `width:${size}px;height:${size}px;line-height:${size}px;background-position:${position};background-size: auto ${size}px;`;
  return `<span class='oli-emoji-content chat-emoji' name='[${name}]' style='${style}'></span>`;
}

function createSpan(emojiDetail) {
  return getEmojiHtml({
    size: configs.size,
    position: computeBgPosition(emojiDetail.position),
    name: emojiDetail[ configs.lang ]
  });
}


/**
 *
 */
export class OliEmoji {

  /* 是否支持 emoji 表情显示，如果不支持要用 html */
  isSupportEmoji = (function () {
    var node = document.createElement("canvas");
    if (!node.getContext || !node.getContext("2d") || typeof node.getContext("2d").fillText !== "function") {
      return false;
    }

    var ctx = node.getContext("2d");
    ctx.textBaseline = "top";
    ctx.font = "32px Arial";
    ctx.fillText('\ud83d\ude03', 0, 0);
    return ctx.getImageData(16, 16, 1, 1).data[ 0 ] !== 0;
  })();

  /* 所有emoji的名称，语言为init中设置的语言 */
  emojiSymbols = [];

  /* 所有emoji的具体信息，包括tag, en, zh, name, html */
  emojiDetails = [];

  /* 用于 emoji 正则匹配 */
  regExpTag;

  constructor(options) {
    configs = {
      ...configs,
      ...options
    };

    this.setupEmojiRegExp(emojiFactory);
  }

  setupEmojiDetail(emoji, key) {
    let lang = configs.lang;

    let emojiSymbol = emoji[ lang ];
    let position = computeBgPosition(emoji.position);

    this.emojiSymbols.push(emojiSymbol);
    this.emojiDetails.push({
      name: "[" + emojiSymbol + "]", // symbols
      tag: emoji.tag,
      zh: emoji.zh,
      en: emoji.en,
      key,
      position
    });
  }

  setupEmojiRegExp(emojiFac) {
    this.emojiSymbols.length = 0;
    this.emojiSymbols = [];

    let tags = [];
    for (let key in emojiFac) {
      let emoji = emojiFac[ key ];
      tags.push(escape(emoji.tag));
      this.setupEmojiDetail(emoji, key);
    }

    tags = tags.join("|");
    let regExp = new RegExp("%", "g");
    tags = tags.replace(regExp, function () {
      return "\\";
    });

    this.regExpTag = new RegExp("(" + tags + ")", "g");
  }

  /**
   * 返回｛key, position｝用来构建 html，如果用户点击了 span，通过 name 获取到正式的表情。
   *
   * @returns {Array} 所有的表情位置
   */
  getAllEmojiPositions() {
    return this.emojiDetails.map(emoji => {
      return {
        position: emoji.position,
        key: emoji.key,
        name: emoji.name,
      }
    });
  }

  /**
   * 根据 symbol 获得 emoji 字符串
   *
   * @param symbol
   * @returns {string}
   */
  getEmojiBySymbol(symbol) {
    let temp = symbol.slice(1, symbol.length - 1);
    let lang = configs.lang;

    let result = this.emojiDetails.filter(emoji => emoji[ lang ] === temp);
    return result.length === 1
      ? result[ 0 ].tag
      : `[${symbol}]`;
  }

  /**
   * 将字符串中的原生emoji字符转化为 对应的文字标识
   *
   * @param  {string} emojis 必填，需要转化的字符串
   * @return {string}          转化后的字符串
   */
  emojiToSymbol(emojis) {
    let reg = configs.reg;
    let lang = configs.lang;

    emojis = emojiDecode(emojis, reg);

    return emojis.replace(this.regExpTag, (emojiTag) => {
      for (let emojiKey in emojiFactory) {
        if (emojiFactory[ emojiKey ].tag == emojiTag) {
          return "[" + emojiFactory[ emojiKey ][ lang ] + "]";
        }
      }
    });
  }

  /**
   * 将字符串中的 对应文字标识 转化为原生emoji
   *
   * @param  {string} symbols 必填 [大笑]
   * @return {string}
   */
  symbolToEmoji(symbols) {
    return symbols.replace(/\[([^\[\]]+?)\]/g, (symbol) => {
      return this.getEmojiBySymbol(symbol);
    });
  }

  /**
   * 将字符串中的原生emoji字符转化为html标签
   *
   * @param  {string} emojiStr 必填，包含原生emoji字符的字符串
   * @return {string}          转化后，包含emoji背景的span标签
   */
  emojiToHTML(emojiStr) {
    emojiStr = emojiDecode(emojiStr, configs.reg);

    return emojiStr.replace(this.regExpTag, function (emojiTag) {
      let span;
      for (let key in emojiFactory) {
        if (emojiFactory[ key ].tag == emojiTag) {
          span = createSpan(emojiFactory[ key ]);
          break;
        }
      }

      return span;
    });
  };

  /**
   * 将字符串中的 对应文字标识 转化为html标签
   *
   * @param  {string} symbol 必填，包含symbol的字符串
   * @return {string}        转化后，包含emoji背景的span标签
   */
  symbolToHTML(symbol) {
    let emoji = this.symbolToEmoji(symbol);
    return this.emojiToHTML(emoji);
  };

}


export default new OliEmoji();