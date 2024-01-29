const path = require('path')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: {
    development: './src/development.js',
    viewer: './src/viewer.js'
  },
  output: {
    path: path.resolve(__dirname, 'public'),
    filename: '[name].js',
  },
  performance: {
    maxEntrypointSize: 1024000,
    maxAssetSize: 1024000
  },
  target: [ 'web', 'es5' ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    compress: true,
    port: 9000,
    hot: false,
  },
  context: path.join(__dirname, ''),
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: './static', to: './' }
      ]
    })
  ],
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin(
        {
          terserOptions: {
              format: {
                  comments: false,
              },
          },
          extractComments: false,
        }
      )
    ],
  },
}
