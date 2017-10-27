const path = require('path')

module.exports = {
  plugins: [
    require('postcss-import')({ addModulesDirectories: ['node_modules' ], } ),
    require('postcss-inline-svg'),
    require("postcss-color-function"),
    require('autoprefixer')({
      browsers: [
        'last 3 versions',
        'iOS >= 8',
        'Safari >= 8',
        'ie 11',
      ]
    }),
    require('postcss-extend'),
    require('precss'),
  ]
}
