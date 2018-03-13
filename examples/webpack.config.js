const path = require('path')

module.exports = {
  devtool: 'cheap-module-source-map',
  entry: {
    main: ['./src/scss/main.scss', './src/js/main.js']
  },
  output: {
    path: path.join(__dirname, 'assets'),
    filename: '[name].min.js'
  },
  module: {
    rules: [
      {
        enforce: "pre",
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "eslint-loader",
      },
      {
        test: /\.js$/,
        use: [
          'babel-loader'
        ]
      },
      {
        test: /\.s?css$/,
        extract: true,
        use: [
          'style-loader',
          'css-loader?importLoaders=1&minimize=1',
          'postcss-loader'
        ]
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2)$/,
        loader: 'file-loader?name=/fonts/[name].[ext]'
      }
    ]
  },
  resolve: {
    alias: {
      'modules-root': path.resolve(__dirname, 'modules')
    },
  },
  plugins: [],
}
