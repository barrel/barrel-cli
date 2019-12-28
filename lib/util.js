const colors = require('colors')
const theme = require('@shopify/themekit').command
const fs = require('fs')
const config = require('./configure')
const Err = require('./error')
const minimatch = require('minimatch')

const sendToShopify = (action, src, cb) => {
  const file = src.replace(/\/?dist\//, '')

  if (isIgnoredFile(file)) {
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

const isIgnoredFile = file => {
  const ignoreFiles = config.get('ignore_files')

  if (!ignoreFiles) {
    return
  }

  return ignoreFiles.some(pattern => minimatch(file, pattern, { matchBase: true }))
}

module.exports = {
  sendToShopify,
  isIgnoredFile
}
