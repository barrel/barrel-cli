const colors = require('colors')
const theme = require('@shopify/themekit').command
const fs = require('fs')
const config = require('./configure')
const Err = require('./error')

const sendToShopify = (action, src, cb) => {
  if (~config.get('ignore').indexOf(
    src.replace(/\/?dist\//, '')
  )) {
    console.log(`Ignoring: ${src}`.blue)
    return cb()
  }

  ;(config.get('ymlFile')
    ? Promise.resolve(true)
    : new Promise((resolve, reject) => {
      if (fs.existsSync(config.get('path1'))) {
        return resolve()
      }
      theme({
        args: [
          'configure',
          '--themeid', config.get('theme_id'),
          '--password', config.get('password'),
          '--store', config.get('store')
        ],
        logLevel: 'silent'
      }, e => {
        if (e) {
          console.log(`${e}`.red)
          reject()
        } else {
          resolve()
        }
      })
    })
  ).then(() => {
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
  }).catch(e => {
    new Err(e)
  })
}

module.exports = {
  sendToShopify
}
