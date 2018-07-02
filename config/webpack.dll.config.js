const webpack = require('webpack');

const vendors = [
  "antd",
  "auto-launch",
  "axios",
  "electron-is",
  "electron-log",
  "electron-positioner",
  "electron-unhandled",
  "express",
  "express-history-api-fallback",
  "extend",
  "jquery",
  "lodash",
  "lowdb",
  "mobx",
  "mobx-logger",
  "mobx-react",
  "mobx-react-form",
  "mobx-react-router",
  "moment",
  "pbkdf2",
  "quill",
  "rc-util",
  "react",
  "react-avatar",
  "react-contextmenu",
  "react-copy-to-clipboard",
  "react-custom-scrollbars",
  "react-dev-utils",
  "react-dom",
  "react-draggable",
  "react-icons",
  "react-quill",
  "react-router",
  "react-router-dom",
  "react-virtualized",
  "request",
  "request-progress",
  "semver",
  "slick-carousel",
  "tough-cookie"
];

module.exports = {
  output: {
    path: 'build',
    filename: '[name].js',
    library: '[name]',
  },
  entry: {
    'lib': vendors,
  },
  plugins: [
    new webpack.DllPlugin({
      path: 'manifest.json',
      name: '[name]',
      context: _dirname,
    })
  ]
};

