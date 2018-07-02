import moment from 'moment';

/**
 *
 * @param target
 * @returns {*}
 */
export function formatShort(target) {
  if (!moment.isMoment(target)) {
    target = moment(target);
  }

  let now = moment();
  let diffDays = now.diff(target, 'days');
  let diffHours = now.diff(target, 'hours');

  if (diffDays === 0 && diffHours < now.get('hour')) {// 今天之内
    return target.format('HH:mm');
  }

  //if (diffDays === 1) { // 昨天
  //  return target.format('昨天');
  //}

  //if (diffDays < 7 && diffDays < now.get('day')) { // 本周
  //  return target.format('dddd');
  //}

  if (diffDays < moment().dayOfYear()) { // 今年
    return target.format('MM-DD');
  }

  return target.format('YYYY/MM/DD');
}

/**
 *
 * 今天的消息 直接显示时间
 * 昨天的显示昨天的时间
 * 再之前的消息 直接显示日期和时间
 *
 * @param target
 * @returns {*}
 */
export function formatLong(target) {
  if (!moment.isMoment(target)) {
    target = moment(target);
  }

  let now = moment();
  let diffDays = now.diff(target, 'days');
  let diffHours = now.diff(target, 'hours');

  if (diffDays === 0 && diffHours < now.get('hour')) { // 今天之内
    return target.format('HH:mm');
  }

  //if (diffDays === 1) { // 昨天
  //  return target.format('昨天 HH:mm');
  //}

  if (diffDays < moment().dayOfYear()) { // 今年
    return target.format('M-D HH:mm');
  }

  return target.format('YYYY/M/D HH:mm');
}

export function formatToS(target) {
  if (!moment.isMoment(target)) {
    target = moment(target);
  }

  let now = moment();
  let diffDays = now.diff(target, 'days');
  let diffHours = now.diff(target, 'hours');

  if (diffDays === 0 && diffHours < now.get('hour')) { // 今天之内
    return target.format('HH:mm:ss');
  }

  if (diffDays < moment().dayOfYear()) { // 今年
    return target.format('M-D HH:mm:ss');
  }

  return target.format('YYYY/M/D HH:mm:ss');
}

//export function formatToS(date) {
//  const formatString = 'YYYY年MM月DD日 HH:mm:ss';
//
//  if (!moment.isMoment(date)) {
//    return moment(date).format(formatString);
//  }
//
//  return date.format(formatString);
//}