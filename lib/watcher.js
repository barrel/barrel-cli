const fs = require('fs')
const path = require('path')
const colors = require('colors')

const WDM = require('webpack-dev-middleware')
const WHM = require('webpack-hot-middleware')

const config = require('./configure')
const Webpack = require('./webpack')
const Err = require('./error')
const Mutator = require('./mutator')
const bs = require('./browsersync')

class Watcher {

  constructor() {
    this.compiler = Webpack(true).compiler

    this.copy()
    this.serve()
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
          WDM(this.compiler, {
            publicPath,
            noInfo: true,
            headers: {
              'Access-Control-Allow-Origin': '*'
            }
          }),
          ...(config.get('hmr') ? [
            WHM(this.compiler)
          ] : [])
        ],
        proxyReq: [
          ( proxyReq ) => {
            proxyReq.setHeader('X-DEV', '1')
          }
        ],
        target
      },
      snippetOptions: {
        rule: {
          match: /<head[^>]*>/i,
          fn: function(snippet, match) {
            return match + snippet
          }
        }
      },
      open: (this.isLocalhost() ? 'internal' : 'external'),
      host: config.get('local'),
      port: config.get('port'),
      https: this.getSSL(),
      notify: true
    }
  }

  serve () {
    bs.init(this.getServerConfig())
  }

  copy () {
    if (config.get('shopify')) {
      return Mutator(true)
    }

    return Promise.resolve()
  }

  isSSL () {
    const target = config.get('target')
    return /^https:/.test(target)
  }

  isLocalhost () {
    return /localhost/.test(config.get('local'))
  }

  getSSL() {
    if (this.isSSL()) {
      return {
        key: `${__dirname}/cert/s.key`,
        cert: `${__dirname}/cert/s.crt`
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
