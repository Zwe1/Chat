var http = require('http');

function randomPort(callback) {
  var server = http.createServer();
  server.listen(0);
  server.on('listening', function () {
    var port = server.address().port;
    server.close();

    if (callback) {
      callback(port);
    }
  });
}

// randomPort(function(port) {
//   console.log(port);
// });

module.exports = randomPort;
