const { resolve } = require('path');
const webpack = require('webpack');

module.exports = {
  mode: 'production',
  entry: './index.ts',
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    fallback: {
      stream: require.resolve('stream-browserify'),
      assert: require.resolve('assert/'),
    },
    alias: {
      process: 'process/browser',
    },
  },
  context: resolve(__dirname, 'src'),
  output: {
    filename: 'index.js',
    libraryTarget: 'commonjs',
    path: resolve(__dirname, './dist'),
    publicPath: '/',
  },
  module: {
    rules: [
      {
        test: /\.m?js/,
        resolve: {
          fullySpecified: false,
        },
      },
      {
        test: [/\.jsx?$/, /\.tsx?$/],
        use: {
          loader: 'babel-loader',
          options: {
            rootMode: 'upward',
          },
        },
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(scss|sass)$/,
        use: ['style-loader', 'css-loader', 'sass-loader'],
      },
      {
        test: /\.(jpe?g|png|gif|svg)$/i,
        use: [
          'file-loader?hash=sha512&digest=hex&name=img/[contenthash].[ext]',
          'image-webpack-loader?bypassOnDebug&optipng.optimizationLevel=7&gifsicle.interlaced=false',
        ],
      },
    ],
  },
  devtool: 'source-map',
  plugins: [
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery',
      process: 'process/browser',
    }),
  ],
  externals: {
    react: 'react',
  },
  performance: {
    hints: false,
  },
};
