const webpack = require('webpack');
const paths = require('./paths');

const autoprefixer = require('autoprefixer');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');

const publicPath = paths.servedPath;

module.exports = {

  entry: {
    'pic-preview': [paths.lookPictureJS],
    'url-input': [paths.urlInput],
    'weaver': [paths.weaverJs],
    'update': [paths.updateJS],
  },

  output: {
    path: paths.appBuild,
    filename: 'js/[name].js',
    chunkFilename: 'js/[name].chunk.js',
    publicPath,
    // devtoolModuleFilenameTemplate: info => path.resolve(info.absoluteResourcePath).replace(/\\/g, '/'),
  },

  module: {
    rules: [
      // {
      //   enforce: 'pre',
      //   test: /\.(js|jsx)$/,
      //   include: paths.appSrc,
      //   // exclude: /node_modules/,
      //   loader: 'eslint-loader'
      // },

      {
        test: /\.(js|jsx)$/,
        // exclude: /node_modules/,
        include: paths.appSrc,
        use: [
          {
            loader: 'babel-loader',
            options: {
              plugins: [
                ['import', [{ libraryName: "antd", style: 'css' }]],
                ["transform-decorators-legacy"],
                ['transform-runtime'],
              ],
            },
          }
        ]
      },

      {
        test: /\.less$/,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              ident: 'postcss',
              plugins: () => [
                autoprefixer({ 
                  browsers: ['last 4 versions'], 
                  flexbox: 'no-2009' 
                }),
              ]
            }
          },
          'less-loader'
        ]
      },

      {
        test: /\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
            },
          },
        ]
      },

      {
        test: /\.(png|svg|jpg|gif)$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 8192,
              name: 'media/[name].[ext]',
            }
          }
        ]
      },

      {
        loader: 'file-loader',
        exclude: [/\.(js|jsx)$/, /\.html$/, /\.json$/, /\.less$/, /\.css$/, /\.(png|svg|jpg|jpeg|bmp|gif)$/],
        options: {
          name: 'media/[name].[ext]',
        },
      },
    ]
  },

  // optimization: {
  //   runtimeChunk: 'single',
  //   splitChunks: {
  //     cacheGroups: {
  //       vendors: {
  //         test: /node_modules/,
  //         name: 'vendors',
  //         enforce: true,
  //         chunks: 'initial'
  //       }
  //     }
  //   }
  // },

  plugins: [  
    new HtmlWebpackPlugin({
      inject: false,
      template: paths.urlInputHtml,
      filename: 'url-input.html',
      chunks: [ 'url-input' ],
    }),

    new CleanWebpackPlugin(),
    new webpack.NamedModulesPlugin(),
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
  ],

  resolve: {
    extensions: ['*', '.js', '.jsx']
  }

};


