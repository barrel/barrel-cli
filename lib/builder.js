const colors = require('colors')
const glob = require('glob-all')
const config = require('./configure')
const Webpack = require('./webpack')
const Err = require('./error')
const Gulp = require('./Gulp')
const {sendToShopify} = require('./util')

class Builder {
  constructor () {
    this.compiler = Webpack(false).compiler
  }

  run (upload = false, files = false) {
    return this.compile().then(() => {
      if (!upload){
        return Promise.resolve()
      } else {
        return this.sendCompiledJSAndCSS(upload)
      } 
    }).then(() => {
      if (config.get('shopify')) {
        return Gulp(false, upload, files)
      }
    })
  }

  compile () {
    return new Promise((resolve, reject) => {
      this.compiler.run((err, stats) => {
        // console.dir(stats.compilation.entrypoints.main)
        this.handleErrors(err, stats)
        console.log('successfully compiled files...'.green)
        resolve()
      })
    })
  }

  handleErrors (err, stats) {
    if (err) {
      throw new Error(err)
    }

    if (stats.hasErrors()) {
      let {errors = []} = stats.compilation 
      errors.map(e => e.message)
      throw new Error(errors)
    }
  }

  sendCompiledJSAndCSS (forceUpload) {
    return new Promise((resolve, reject) => {
      let matches = []

      glob([
        `${config.get('cwd')}/dist/assets/**.{js,css,css.liquid}`
      ], e => {

      }).on('match', path => {
        matches.push(path)
      }).on('end', () => {
        resolve(matches)
      })
    }).then(matches => {
      if (!matches[0]) {
        return Promise.resolve()
      }

      matches = matches.map(p => {
        return p.replace(config.get('cwd'), '')
      })

      const first = new Promise((resolve, reject) => {
        sendToShopify('upload', matches.shift(), () => {
          resolve()
        })
      })

      const chain = matches.reduce((prev, path) => {
        return prev.then(() => {
          return new Promise((resolve, reject) => {
            sendToShopify('upload', path, () => {
              resolve()
            })
          }) 
        })
      }, first)

      return chain
    })
  }
}

module.exports = (upload = false, files = false) => {
  try {
    builder = new Builder()
    return builder.run(upload, files)
  } catch (e) {
    new Err(e)
  }
}
