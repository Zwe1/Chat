var edge = require('edge');
var path = require('path');

var slapi = edge.func(path.join(__dirname, 'slapi.cs'));
slapi(null, function (error, result) {
  if (error) {
    console.error(error);
    throw error;
  }

  console.log('result:', result);
});