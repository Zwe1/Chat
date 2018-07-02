/**
 * 生成人名和日期的水印背景
 *
 * @param name
 * @param phone
 * @returns {string}
 * @constructor
 */
export function generateLogoBg(name = '', phone = '') {
  const canvas = document.createElement("canvas");
  canvas.setAttribute('width', 200);
  canvas.setAttribute('height', 80);

  const date = new Date();
  const formatDate = `${date.getYear() + 1900}-${date.getMonth() + 1}-${date.getDate()}`;
  const ctx = canvas.getContext('2d');

  ctx.font = '12px Arial';
  ctx.fillStyle = '#eee';
  ctx.rotate(-15 * Math.PI / 180);
  ctx.fillText(`${name}${phone.substr(-4)} e-mobile`, 10, 80);
  ctx.fillText(formatDate, 35, 100);

  return canvas.toDataURL();
}
