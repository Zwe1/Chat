/**
 * 尝试 parse 字符串，如果出错，返回默认值
 */
export function tryParse(str, defaultValue = {}) {
  try {
    return JSON.parse(str);
  } catch(e) {
    return defaultValue;
  }
};