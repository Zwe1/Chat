var ref = require("ref");
var ffi = require("ffi");
var path = require('path');

//var Struct = require('ref-struct');
//
//var TimeVal = Struct({
//  'tv_sec': 'long',
//  'tv_usec': 'long'
//});
//var TimeValPtr = ref.refType(TimeVal);
//
//var lib = new ffi.Library(null, {
//  'gettimeofday': [ 'int', [ TimeValPtr, "pointer" ] ]
//});
//
//var tv = new TimeVal();
//
//lib.gettimeofday(tv.ref(), null);
//console.log("Seconds since epoch: " + tv.tv_sec);


//
//var current = ffi.Library(null, {
//  'atoi': [ 'int', [ 'string' ] ]
//});
//
//current.atoi('1234'); // 1234

//
//let user32 = ffi.Library('user32', {
//  'GetWindowLongPtrW': ['int', ['int', 'int']],
//  'SetWindowLongPtrW': ['int', ['int', 'int', 'long']],
//  'GetSystemMenu': ['int', ['int', 'bool']],
//  'DestroyWindow': ['bool', ['int']]
//});
//
//console.log(user32.GetSystemMenu(1, true));

//var kernel32 = ffi.Library("kernel32", {
//  'SetDllDirectoryA': ["bool", ["string"]]
//});
//
//var result = kernel32.SetDllDirectoryA("C:/Users/Administrator/Desktop/SDK/bin/Win32/");
//console.log('set dll directory', result);
module.exports = function () {
  var slsdk = ffi.Library(path.join(__dirname, 'slsdk.dll'), {
    "SLInitialize": [ 'bool', [] ],
    "SLUninitialize": [ 'bool', [] ],
    //"SLGetLastError",
    //"SLGetErrorDesc",
    //"SLCreateClient",
    //"SLSetClientCallback",
    //"SLClientLogin",
    //"SLGetClientAddress",
    //"SLDestroyClient",
  });

  slsdk.SLInitialize();
};


//function TEXT(text){
//  return new Buffer(text, 'ucs2').toString('binary');
//}
//
//var user32 = new ffi.Library('user32', {
//  'MessageBoxW': [ 'int32', [ 'int32', 'string', 'string', 'int32' ] ]
//});
//var OK_or_Cancel = user32.MessageBoxW(0, TEXT('I am Node.JS!'), TEXT('Hello, World!'), 1);
//
//console.log(OK_or_Cancel);

//var agora = new ffi.Library(path.join(__dirname,'agora_rtc_sdk'), {
//  'createAgoraRtcEngine': [ 'int32', [ ] ]
//});
//
//console.log(agora.createAgoraRtcEngine());