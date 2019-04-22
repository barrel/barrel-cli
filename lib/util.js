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
      '--themeid', config.get('theme_id'),
      '--password', config.get('password'),
      '--store', config.get('store'),
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

module.exports = {
  sendToShopify
}
