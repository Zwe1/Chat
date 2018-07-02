import uuid from 'uuid';
import moment from 'moment';

var native_random = Math.random; 

Math.random = function(min, max, exact) { 
  if (arguments.length === 0) { 
    return native_random(); 
  } else if (arguments.length === 1) { 
    max = min; 
    min = 0; 
  } 

  var range = min + (native_random()*(max - min)); 
  return exact === void(0) ? Math.round(range) : range.toFixed(exact); 
};

export function chatlistData(number = 300) {
  let dummy = [];

  for (let i = 0; i < number; i++) {
    dummy.push({
      id: uuid.v4(),
      isGroup: false,
      date: moment(),
      name: `oli${i}`,
      isTop: false,
      lastTime: moment(),
      targetType: '1',
      targetId: uuid.v4(),
      unreadCount: Math.random(0, 20),
      // unreadCount: 2,
      last: 'con.msgcontent',
      fromUserId: 'con.userid',
    });
  }

  return dummy;
}