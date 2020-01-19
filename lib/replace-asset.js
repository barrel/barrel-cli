const cave = require('cave')
const CleanCSS = require('clean-css')
const fs = require('fs')

function replaseAsset (cssAsset, criticalCSS, minify) {
  let cssDiff = cave(cssAsset, {
    css: criticalCSS
  })

  if (minify) {
    cssDiff = new CleanCSS().minify(cssDiff).styles
  }

  fs.writeFileSync(cssAsset, cssDiff, 'utf8')
}

module.exports = replaseAsset
