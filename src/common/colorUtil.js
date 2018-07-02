// 判断是否是深
export function isColorDark(colorHex, threshold) {
  if (!colorHex || typeof colorHex != 'string') {
    return false;
  }

  if (colorHex.indexOf('#') == 0) {
    colorHex = colorHex.substring(1, colorHex.length);
  }

  var temp = colorHex.split('');
  var R, G, B;
  
  // #abcdef
  if (temp.length == 6) {
    R = temp[0] + temp[1];
    G = temp[2] + temp[3];
    B = temp[4] + temp[5];
  }

  // #abc
  else if (temp.length == 3) {
    R = temp[0] + temp[0];
    G = temp[1] + temp[1];
    B = temp[2] + temp[2];
  } else {
    return false;
  }

  var Gray = parseInt(R, 16) * 0.299 + parseInt(G, 16) * 0.587 + parseInt(B, 16) * 0.114;
  if (Gray < (threshold ? threshold : 125)) {
    return true;
  } else {
    return false;
  }
}