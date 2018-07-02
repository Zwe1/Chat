/**
 *
 * @param str
 * @returns {*}
 */
export function escape2Html(str) {
  let arrEntities = {
    'lt': '<',
    'gt': '>',
    'nbsp': ' ',
    'amp': '&',
    'quot': '"',
    'apos': '\''
  };

  return str.replace(/&(lt|gt|nbsp|amp|quot|apos);/ig, function (all, t) {
    return arrEntities[ t ];
  });
}

export function unescapeFromHtml(str = '') {
  let arrEntities = {
    '<': 'lt',
    '>': 'gt',
    ' ': 'nbsp',
    '&': 'amp',
    '"': 'quot',
    '\'': 'apos',
  };

  return str.replace(/(<|>| |&|"|')/ig, function (all, t) {
    return `&${arrEntities[ t ]};`
  });
}

/*
 * @param xmlString
 * @returns {Document}
 */
export function string2XML(xmlString) {
  let parser = new DOMParser();
  return parser.parseFromString(xmlString, "text/xml");
}