const path = require('path')
const fs = require('fs')
const yaml = require('js-yaml')
const portFinderSync = require('portfinder-sync')
const Err = require('./error')

class Configure {

  constructor() {}

  start ({shouldLoadConfig = true, defaults = {}, watching}) {
    this.shouldLoadConfig = shouldLoadConfig
    this.watching = watching
    this.cwd = process.cwd()
    this.env = process.env.ENV
    this.path1 = `${this.cwd}/config.yml`
    // this.path2 = `${this.cwd}/dist/config.yml`
    this.webpackPath = `${this.cwd}/webpack.config.js`
    this.packagePath = `${this.cwd}/package.json`
    this.ymlFile = false
    this.defaults = Object.assign({}, {
      publicPath: '/dev',
      port: 3000,
      local: 'localhost',
      dist: `${this.cwd}/dist`,
      theme_id: '',
      api_key: '',
      password: '',
      store: '',
      target: '',
      hmr: true,
      domain: false,
      ignore_files: [],
      delay: 0
    }, defaults)

    this.findConfig()
    this.getWebpackConfig()
    this.getPackageJson()
    this.fillInBlanks()
  }

  findConfig () {
    // This used to be 2 paths
    this.ymlFile = [this.path1].find(path => {
      return fs.existsSync(path)
    }) || false
    
    if (!this.ymlFile && this.shouldLoadConfig) {
      throw new Error('Config file not found')
    }

    if (!this.shouldLoadConfig) {
      this.mergeInDefaults({})
    } else {
      this.loadConfig(this.ymlFile)
    }
  }

  loadConfig (path) {
    const config = yaml.safeLoad(
      fs.readFileSync(path)
    )

    if (!config[this.env]) {
      throw new Error(`Environment ${this.env} in ${path} not set`)
    }

    const userConfig = config[this.env]
    this.mergeInDefaults(userConfig)
  }

  mergeInDefaults (userConfig = {}) {
    Object.keys(this.defaults).forEach(k => {
      if (typeof userConfig[k] !== 'undefined') {
        this[k] = userConfig[k]
      } else {
        this[k] = this.defaults[k]
      }
    })
  }

  getWebpackConfig () {
    this.webpack = require(this.webpackPath)
  }

  getPackageJson () {
    this.package = require(this.packagePath)
  }

  fillInBlanks () {
    if (!this['theme_id']) {
      this.shopify = false
    } else {
      this.shopify = true
    }

    this.checkProxyTarget()
    this.checkPort()
    this.checkPublicPath()
    this.checkDist()
  }

  checkProxyTarget () {
    if (this.shopify) {
      this.target = `https://${(this.domain || this.store)}`
      console.log(`Proxy target set at ${this.target}`)
    } else {
      if (!this.target) {
        throw new Error('Proxy target not found')
      }
    }
  }

  checkPort () {
    this.port = portFinderSync.getPort(this.defaults.port)
  }

  checkPublicPath () {
    if (this.shopify) {
      this.publicPath = `https://${this.defaults.local}:${this.port}/`
    } else {
      const uri = this.webpack.output.path.split('/wp-content/')[1]
      this.publicPath = `/wp-content/${uri}`
    }
  }

  checkDist () {
    if (this.shopify) {
      this.dist = this.defaults.dist
    } else {
      this.dist = false
    }
  }

  setup (props) {
    if (this.hasRun) {
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      this.start(props)
      resolve()
    })
  }

  get (prop) {
    return this[prop]
  }

  set (prop, val) {
    this[prop] = val
  }

}

module.exports = new Configure
