const log = require('electron-log');
const util = require('util');
 
log.info('Hello, log');

// Log level
// error, warn, info, verbose, debug, silly
// log.transports.file.level = false;
// log.transports.console.level = false;
log.transports.console.level = 'debug';
 
/**
 * Set output format template. Available variables:
 * Main: {level}, {text} 
 * Date: {y},{m},{d},{h},{i},{s},{ms},{z} 
 */
// log.transports.console.format = '{h}:{i}:{s}:{ms} {text}';
 
// Set a function which formats output
// log.transports.console.format = (msg) => util.format.apply(util, msg.data);

// Same as for console transport
// log.transports.file.level = 'warn';
// log.transports.file.format = '{h}:{i}:{s}:{ms} {text}';
 
// Set approximate maximum log size in bytes. When it exceeds,
// the archived log will be saved as the log.old.log file
// log.transports.file.maxSize = 5 * 1024 * 1024;
 
// Write to this file, must be set before first logging
// log.transports.file.file = __dirname + '/log.txt';
 
// fs.createWriteStream options, must be set before first logging
// you can find more information at
// https://nodejs.org/api/fs.html#fs_fs_createwritestream_path_options
// log.transports.file.streamConfig = { flags: 'w' };
 
// set existed file stream
// log.transports.file.stream = fs.createWriteStream('log.txt');

exports.logError = function error(msg) {
  log.error(msg);
};

exports.logDebug = function debug(msg) {
  log.debug(msg);
};

exports.logInfo = function info(msg) {
  log.info(msg);
};


