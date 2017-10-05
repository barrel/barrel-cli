const fs = require('fs')
const path = require('path')
const colors = require('colors')

const WDM = require('webpack-dev-middleware')
const WHM = require('webpack-hot-middleware')

const config = require('./configure')
const Webpack = require('./webpack')
const bus = require('./emitter')
const Err = require('./error')
const Gulp = require('./gulp')
const bs = require('./browsersync')

class Watcher {

  constructor() {
    this.compiler = Webpack(true).compiler
    
    if (this.isSSL()) {
      Promise.all([
        new Promise(r => this.getSSLKey(r)),
        new Promise(r => this.getSSLCrt(r))
      ]).then(() => {
        try {
          this.serve()
          this.copy()
        } catch (e) {
          new Err(e)
        }
      })
    } else {
      this.serve()
      this.copy()
    }
  }

  getServerConfig () {
    const publicPath = config.get('publicPath')
    let target = config.get('target')
    if (config.get('shopify')) {
      target+=`?preview_theme_id=${config.get('theme_id')}`
    }

    return {
      proxy: {
        middleware: [
          WDM(this.compiler, {noInfo: true, publicPath}),
          WHM(this.compiler)
        ],
        target,
      },
      // https: this.getSSL(),
      https: false,
      notify: false
    }
  }

  serve () {
    bs.init(this.getServerConfig())
  }

  copy () {
    if (config.get('shopify')) {
      Gulp(true)
    }
  }

  isSSL () {
    const target = config.get('target')
    return /^https:/.test(target)
  }

  getSSLKey (r) {
    fs.readFile(
      `${__dirname}/cert/s.key`,
      'utf8',
      (err, data) => {
        this.SSLKey = data
        r()
      }
    )
  }

  getSSLCrt (r) {
    fs.readFile(
      `${__dirname}/cert/s.crt`,
      'utf8',
      (err, data) => {
        this.SSLCrt = data
        r()
      }
    )
  }

  getSSL() {
    if (this.isSSL()) {
      return {
        key: this.SSLKey,
        cert: this.SSLCrt
      }
    } else {
      return false
    }
  }
}

module.exports = () => {
  let watcher
  try {
    watcher = new Watcher()
  } catch (e) {
    new Err(e)
  }

  return watcher
}
