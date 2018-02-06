const path = require('path')

module.exports = {
  devtool: 'cheap-module-source-map',
  entry: {
    main: ['./src/scss/main.scss', './src/js/main.js']
  },
  output: {
    path: path.join(__dirname, 'assets'),
    filename: '[name].js'
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
          'css-loader?importLoaders=1',
          'postcss-loader'
        ]
      },
    ]
  },
  resolve: {
    alias: {
      'modules-root': path.resolve(__dirname, 'modules')
    },
  },
  plugins: [],
}
