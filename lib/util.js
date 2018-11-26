const colors = require('colors')
const theme = require('@shopify/themekit').command
const config = require('./configure')

const sendToShopify = (action, src, cb) => {
  if (~config.get('ignore').indexOf(
    src.replace(/\/?dist\//, '')
  )) {
    console.log(`Ignoring: ${src}`.blue)
    return cb()
  }

  theme({
    args: [
      action, 
      '--env', process.env.ENV, 
      '--config', config.get('configPath'),
      src
    ],
    logLevel: 'silent'
  }, e => {
    if (e) {
      console.log(`${e}`.red)
    } else {
      console.log(`[${action}] ${src}`.white)
    }

    cb(e)
  })
}

const processSvg = ($, file) => {
  const $svg = $('svg')
  const $newSvg = $('<svg aria-hidden="true" focusable="false" role="presentation" class="icon" />')
  const fileName = file.relative.replace('.svg', '')
  const viewBoxAttr = $svg.attr('viewbox')

  // Add necessary attributes
  if (viewBoxAttr) {
    const width = parseInt(viewBoxAttr.split(' ')[2], 10)
    const height = parseInt(viewBoxAttr.split(' ')[3], 10)
    const widthToHeightRatio = width / height
    if (widthToHeightRatio >= 1.5) {
      $newSvg.addClass('icon--wide')
    }
    $newSvg.attr('viewBox', viewBoxAttr)
  }

  // Add required classes to full color icons
  if (file.relative.indexOf('-full-color') >= 0) {
    $newSvg.addClass('icon--full-color')
  }

  $newSvg
    .addClass(fileName)
    .append($svg.contents())

  $newSvg.append($svg.contents())
  $svg.after($newSvg)
  $svg.remove()
}

module.exports = {
  sendToShopify,
  processSvg
}
