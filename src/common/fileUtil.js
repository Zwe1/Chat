/**
 *
 * @param size
 * @returns {string}
 */
export function computeSize(size) {
  let kb = Math.round(size / 1024 * 100) / 100;
  if (kb < 1024) {
    return kb + 'KB';
  }

  let mb = Math.round(kb / 1024 * 100) / 100;
  if (mb < 1024) {
    return mb + 'MB';
  }

  let gb = Math.round(mb / 1024 * 100) / 100;
  return gb + 'GB'
}