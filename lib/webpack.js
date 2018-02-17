const path = require('path')
const webpack = require('webpack')
const merge = require('webpack-merge')
const MinifyPlugin = require("babel-minify-webpack-plugin")
const ExtractTextPlugin = require("extract-text-webpack-plugin")
const colors = require('colors')
const config = require('./configure')
const Err = require('./error')

class Webpacker {
  constructor (watching = false) {
    this.watching = watching
    this.hmr = 'webpack-hot-middleware/client?reload=true'

    this.getConfig()
    this.prepareEntry()
    this.prepareOutput()
    this.prepareResolve()
    this.prepareResolveLoader()
    this.preparePlugins()
    this.prepareModule()

    this.initCompiler()
  }

  getConfig () {
    this.config = config.get('webpack')
  }

  prepareEntry () {
    const {entry} = this.config
    if (!this.watching) {
      this.entry = entry
      return
    }
    if (typeof entry === 'string') {
      this.entry = [entry].push(this.hmr)
      return
    }
    if (typeof entry === 'object') {
      this.entry = {}
      Object.keys(entry).map(k => {
        if (typeof entry[k] === 'string') {
          this.entry[k] = [entry[k]]
        } else {
          this.entry[k] = entry[k]
        }
        this.entry[k].push(this.hmr)
      })
    }
  }

  prepareOutput () {
    this.output = Object.assign({}, this.config.output)
    this.output.publicPath = config.get('publicPath')
  }

  prepareResolve () {
    this.resolve = Object.assign({
      modules: [
        path.resolve(__dirname, "../node_modules"), "node_modules"
      ]
    }, (this.config.resolve || {}))
  }

  prepareResolveLoader () {
    this.resolveLoader = {
      modules: [
        path.resolve(__dirname, "../node_modules"), "node_modules"
      ]
    }
  }

  preparePlugins () {
    this.plugins = [
      ...(this.watching ? [
        new webpack.SourceMapDevToolPlugin(),
        new webpack.HotModuleReplacementPlugin()
      ] : [
        new ExtractTextPlugin(`[name].min.css${(config.get('shopify') ? '.liquid' : '')}`),
        new MinifyPlugin()
      ]),
      new webpack.NoEmitOnErrorsPlugin(),
      new webpack.DefinePlugin({
        BRRL_PUBLIC_PATH: JSON.stringify(config.get('publicPath')),
        BRRL_PATH: function(path) {
          if (document.location.hostname === 'localhost') {
            return path
          } else {
            return SHOPIFY_CDN
          }
        }
      }),
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
        DEBUG: !(process.env.NODE_ENV === 'production')
      })
    ]
  }

  prepareModule () {
    this.module = Object.assign({}, this.config.module)

    if (!this.module.rules) {
      throw new Error('webpack.module must have "rules" property')
    }

    const rules = this.module.rules

    rules.map(r => {
      let {extract, use} = r
      if (!extract) return 
      delete r.extract
      if (this.watching) return
      if (!Array.isArray(use)) {
        throw new Error('webpack.module.rules.use must be array')
      }
      if (use.length < 2) {
        throw new Error('webpack.module.rules.use must have a min length of 2')
      }
      r.use = ExtractTextPlugin.extract({
        fallback: use[0], 
        use: use.splice(1)
      })
    })
  }

  initCompiler () {
    let {
      entry,
      output,
      resolve,
      resolveLoader,
      plugins,
      module: _module
    } = this

    const obj = {
      entry,
      output,
      resolve,
      resolveLoader,
      plugins,
      module: _module
    }

    this.compiler = webpack(obj)
  }
}

module.exports = (watching) => {
  let webpacker

  try {
    webpacker = new Webpacker(watching)
  } catch (e) {
    new Err(e)
  }

  return webpacker
}
