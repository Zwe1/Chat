var crypto = require('crypto');

var VENDOR_KEY = "0e530d79365f4f3fa8427eca4bc3b232";
var SIGN_KEY = "9349e1579c27475d9333f2ecb4e46246";

/**
 * vendorkey - given by agora.io
 * signKey - given by agora.io
 * channelName - the name of channel to join
 * unixTs - the unix timestamp(in seconds) when the key is generated
 * randomInt - the random salt(0- 99999999) used to generate the sign key
 *
 * return the dynamic key the client used to join a channel
 */
var generateDynamicKey = function(vendorKey, signKey, channelName, unixTs, randomInt) {
  var unixTsStr = unixTs.toString();
  var rndTxt = randomInt.toString(16);
  var randomIntStr = ("00000000" + rndTxt).substring(rndTxt.length);
  var sign = generateSignature(vendorKey, signKey, channelName, unixTsStr, randomIntStr);
  return sign + vendorKey + unixTsStr + randomIntStr;
};

var generateSignature = function(vendorKey, signKey, channelName, unixTsStr, randomIntStr) {
  var buffer = Buffer.concat([new Buffer(vendorKey), new Buffer(unixTsStr), new Buffer(randomIntStr), new Buffer(channelName)]);
  var sign = encodeHMac(signKey, buffer);
  return sign.toString('hex');
};

var encodeHMac = function(key, message) {
  return crypto.createHmac('sha1', key).update(message).digest('hex');
};

var generate = function (channelName) {
  if (!channelName) {
    return false;
  }

  var ts = Math.round(new Date().getTime() / 1000);
  var rnd = Math.round(Math.random() * 100000000);
  return generateDynamicKey(VENDOR_KEY, SIGN_KEY, channelName, ts, rnd);
};

export default generate;

// console.log(generate('nihao'));
