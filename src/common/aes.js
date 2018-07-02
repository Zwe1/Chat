// import pbkdf2 from 'pbkdf2';
let pbkdf2 = require('pbkdf2');
let aesjs = require('aes-js');

export function generateKey() {
  let key128 = pbkdf2.pbkdf2Sync('password', 'salt', 1, 128 / 8, 'sha512');
  return [...key128];
}

export function encrypt(text, key) {
  let dummy = new Buffer(key, "hex");
  let textBytes = aesjs.utils.utf8.toBytes(text);
  let aesCtr = new aesjs.ModeOfOperation.ctr(dummy, new aesjs.Counter(5));
  let encryptedBytes = aesCtr.encrypt(textBytes);
  let encryptedHex = aesjs.utils.hex.fromBytes(encryptedBytes);
  //console.log(encryptedHex);

  return encryptedHex;
}

export function decrypt(encrypted, key) {
  let dummy = new Buffer(key, "hex");
  let encryptedBytes = aesjs.utils.hex.toBytes(encrypted);
  let aesCtr = new aesjs.ModeOfOperation.ctr(dummy, new aesjs.Counter(5));
  let decryptedBytes = aesCtr.decrypt(encryptedBytes);
  let decryptedText = aesjs.utils.utf8.fromBytes(decryptedBytes);
  //console.log(decryptedText);

  return decryptedText;
}

// let text = 'Text may be any length you wish, no padding is required.';
//
// let myKey = generateKey();
//
// let encrypted = encrypt(text, myKey);
// console.log('------------------------------------');
// decrypt(encrypted, myKey);