const express = require('express');
const fallback = require('express-history-api-fallback');

const generatePort = require('./generatePort');


exports.initExpress = function initExpress(callback, rootPath) {
  const app = express();

  // First, find files from src folder
  app.use(express.static(rootPath));

  // History api fallback
  app.use(fallback('index.html', { rootPath }));

  // Other files should not happen, respond 404
  app.get('*', (req, res) => {
    console.log('Warning: unknown req: ', req.path);
    res.sendStatus(404);
  });

  generatePort(function (port) {
    app.listen(port, (err) => {
      if (err) {
        console.error(err);
      }

      let urlPrefix = `http://localhost:${port}`;

      console.log(`Server listening at http://localhost:${port}`);

      if (callback) {
        callback(urlPrefix, port);
      }
    });
  });
};