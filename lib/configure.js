const path = require('path')
const fs = require('fs')
const yaml = require('js-yaml')
const bus = require('./emitter')
const Err = require('./error')

class Configure {
  
  setDefaults () {
    this.defaults = {
      publicPath: '/dev',
      proxy: '//localhost:3000',
      dist: `${this.cwd}/dist`,
      theme_id: '',
      api_key: '',
      password: '',
      store: '',
    }
  }

  constructor(props) {
    this.cwd = process.cwd()
    this.env = process.env.ENV
    this.path1 = `${this.cwd}/config.yml`
    this.path2 = `${this.cwd}/dist/config.yml`
    this.webpackPath = `${this.cwd}/webpack.config.js`
  }

  start () {
    this.setDefaults()
    this.findConfig()
    this.getWebpackConfig()
    this.fillInBlanks()
    bus.emit('configured')
  }

  findConfig () {
    [this.path1, this.path2].every(path => {
      if (fs.existsSync(path)) {
        this.configPath = path
        this.loadConfig(path)
        return false
      } else {
        return true
      }
    })
  }

  loadConfig (path) {
    const config = yaml.safeLoad(
      fs.readFileSync(path)
    )

    if (!config[this.env]) {
      throw new Error(`Environment ${this.env} in ${path} not set`)
    }

    const envConfig = config[this.env]

    Object.keys(envConfig).forEach(key => {
      this[key] = envConfig[key]
    })
  }

  getWebpackConfig () {
    this.webpack = require(this.webpackPath)
  }

  fillInBlanks () {
    if (!this['theme_id']) {
      this.shopify = false
      console.log('No theme_id found so assuming this is not a Shopify project')
    } else {
      this.shopify = true
    }

    this.checkProxyTarget()
    this.checkPublicPath()
    this.checkDist()
  }

  checkProxyTarget () {
    if (this.shopify) {
      this.target = `https://${this.store}`
      console.log(`Proxy target set at ${this.target}`)
    } else {
      if (!this.target) {
        throw new Error('Proxy target not found')
      }
    }
  }

  checkPublicPath () {
    if (this.shopify) {
      this.publicPath = this.defaults.publicPath
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

  setup () {
    if (this.hasRun) {
      return new Promise(resolve => {
        resolve()
      })
    }

    const promise = new Promise(resolve => {
      bus.on('configured', () => resolve())
    })

    this.start()
    
    return promise
  }

  get (prop) {
    return this[prop]
  }

  set (prop, val) {
    this[prop] = val
  }

}

module.exports = new Configure
