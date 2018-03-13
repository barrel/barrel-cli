const config = {
  parser: 'postcss-scss',
  plugins: [
    require('./tasks/postcss-module-import'),
    require('postcss-sassy-mixins'),

    require('autoprefixer')({
      browsers: [
        'last 3 versions',
        'iOS >= 8',
        'Safari >= 8',
        'ie 11',
      ]
    }),
    require('precss'),
    require('postcss-hexrgba'),
    require('postcss-automath')
  ]
}

module.exports = config
