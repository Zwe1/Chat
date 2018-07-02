const path = require('path');

const paths = require('./paths');
const webpack = require('webpack');

let baseConfig = require('./webpack.config.base');

const HtmlWebpackPlugin = require('html-webpack-plugin');

let devConfig  = {
  ...baseConfig,

  devtool: 'source-map',
};

let devPlugins =  [  
  new HtmlWebpackPlugin({
    inject: true,
    title: 'e Mobile',
    template: paths.appHtml,
    chunks: [ 'main' ],
  }),

  new HtmlWebpackPlugin({
    inject: true,
    template: paths.lookPictureHtml,
    filename: 'pic-preview.html',
    chunks: ['pic-preview'],
  }),

  new HtmlWebpackPlugin({
    inject: true,
    template: paths.testHtml,
    filename: 'test.html',
    chunks: [ 'test' ],
  }),
  
  new HtmlWebpackPlugin({
    inject: true,
    template: paths.updateHtml,
    filename: 'update.html',
    chunks: [ 'update' ],
  }),

  new webpack.DefinePlugin({
    'process.env.NODE_ENV': JSON.stringify('development')
  }),
  
  new webpack.HotModuleReplacementPlugin()
];

devConfig.entry.main = [
  require.resolve('./polyfills'),
  require.resolve('react-dev-utils/webpackHotDevClient'),
  paths.appIndexJs
];

devConfig.entry.test = [paths.testJS];

devPlugins.forEach(plugin => devConfig.plugins.push(plugin));

devConfig.devServer = {
  contentBase: path.join(__dirname, "../build"),
  compress: true,
  hot: true,
  port: 3001,
};

devConfig.output.publicPath = '/';

module.exports = devConfig;


