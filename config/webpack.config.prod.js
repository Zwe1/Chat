const paths = require('./paths');
const webpack = require('webpack');

let baseConfig = require('./webpack.config.base');

const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');

let prodConfig = {
  ...baseConfig,

  devtool: 'false',
};

let prodPlugins = [
  new UglifyJSPlugin({
    uglifyOptions: {
      compress: {
        comparisons: false,
        drop_debugger: true,
        drop_console: true
      },
      output: {
        comments: false,
        ecma: 5,
        // ascii_only: true,
      },
    },
    sourceMap: true
  }),

  new webpack.DefinePlugin({
    'process.env.NODE_ENV': JSON.stringify('production')
  }),
  
];

prodConfig.entry.main = [
  paths.appIndexJs
];

prodPlugins.forEach(plugin => prodConfig.plugins.push(plugin));

module.exports = prodConfig;

