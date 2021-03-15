const colors = require('colors')
const nodePath = require('path')
const glob = require('glob-all')
const fs = require('fs-extra')

const config = require('./configure')
const bs = require('./browsersync')
const Err = require('./error')
const {sendToShopify} = require('./util')
const chokidar = require('chokidar')

class Mutator {

  constructor() {
    if (config.get('watching')) {
      config.set('keepAlive', true)
    }
  }

  build (upload = false, files = false) {
    return new Promise((resolve, reject) => {
      let matches = []

      if (files) {
        return resolve(files.slice(0))
      }

      glob([
        `${config.get('cwd')}/src/**/*.*`
      ], e => {
        // console.log(e)
      }).on('match', path => {
        matches.push(path)
        // this.copy({type: 'changed', path}, upload)
      }).on('end', () => {
        resolve(matches)
      })
    }).then(matches => {
      if (!matches[0]) {
        return Promise.resolve()
      }

      matches = matches.filter(path => !/[.]DS_Store/i.test(path))

      const first = this.copy({type: 'changed', path: matches.shift()}, upload)
      const chain = matches.reduce((prev, path) => {
        return prev.then(this.copy.bind(this, {
            type: 'changed', path
          }, upload)
        )
      }, first)

      return chain
    }).then(() => {
      if (!files) {
        return this.concat(upload)
      }

      if (files.some(path => {
        return ~path.indexOf('config/')
      })) {
        return this.concat(upload)
      }

      return Promise.resolve()
    }).catch(e => {
      new Err(e)
    })
  }

  copy ({type, path}, upload = false) {
    return new Promise((resolve, reject) => {
      /**
       * If the file is in the assets directory
       * and within the
       */
      if (~path.indexOf('src/assets/css')) {
        return resolve()
      } else if (~path.indexOf('src/assets/js')) {
        return resolve()
      } else if (~path.indexOf('src/config')) {
        return resolve()
      } else if (!~path.indexOf('src')) {
        return resolve()
      } else if (!~path.indexOf('src/assets') && /.([.](css|js(?!on)|vue)$)/.test(path)) {
        return resolve()
      }

      if (!path.match(/\.[0-9a-z]+$/i)) {
        throw `Error copying path ${path}`;
      }

      const fileName = path.split('/').pop()

      let base = ''
      let src = fileName.replace(/(.*)([.]section|[.]template)([.]liquid)/, '$1$3')

      if (/\/locales/.test(path)) {
        base = 'locales'
      } else if (/assets/.test(path)) {
        base = 'assets'
      } else if (/\/templates/.test(path) || /[.]template/.test(path)) {
        if (/\/templates\/customers/.test(path)) {
          base = 'templates/customers'
        } else {
          base = 'templates'
        }
      } else if (/\/sections/.test(path) || /[.]section/.test(path)) {
        base = 'sections'
      } else if (/\/layout/.test(path) || /[.]layout/.test(path)) {
        base = 'layout'
      } else {
        base = 'snippets'
      }

      const dest = (
        /.([.](css|js(?!on)|svg|jpe?g|gif|png|css\.liquid)$)/.test(path)
        ? ({
          absolute: `${config.get('cwd')}/dist/assets/${src}`,
          relative: `/dist/assets/${src}`
        })
        : ({
          absolute: `${config.get('cwd')}/dist/${base}/${src}`,
          relative: `/dist/${base}/${src}`
        })
      )

      if (type === 'changed' || type === 'added') {
        console.log(`Copying ${dest.relative}`.cyan)
        fs.copySync(path, `${dest.absolute}`)
        if (upload) {
          sendToShopify('upload', dest.relative, e => {
            bs.emitter.emit('shopify_upload_finished')
            resolve()
          })
        } else {
          resolve()
        }
      }
    })
  }

  concat (upload = false) {
    return new Promise((resolve, reject) => {

      const settingsSchema = glob
        .sync(`${config.get('cwd')}/src/config/lib/**`)
        .reduce((arr, path) => {
          if (!~path.indexOf('json')) {
            return arr
          }
          const partial = fs.readFileSync(path, 'utf8').trim()

          if (partial) {
            arr.push(partial)
          }
          return arr
        }, []).join(',')

      fs.outputFile(
        `${config.get('cwd')}/dist/config/settings_schema.json`,
        `[${settingsSchema}]`,
        err => {
          if (err) {
            console.log('There was an error writing settings_schema.json'.blue)
            return
          }

          console.log(`Copied settings`.blue)

          if (upload) {
            sendToShopify('upload', `/dist/config/settings_schema.json`, () => {
              bs.emitter.emit('shopify_upload_finished')
              resolve()
            })
          } else {
            resolve()
          }
        })
    })
  }

  setFileLocation (file) {
    let {dirname: path} = file

    if (
      ~path.indexOf('assets/css')
      || ~path.indexOf('assets/js')
    ) {
      file = false
    }
  }

  watch () {
    chokidar.watch(`${config.get('cwd')}/src/**/*`, {ignoreInitial: true})
      .on('add', path => this.respondToFileChange(path))
      .on('change', path => this.respondToFileChange(path))
  }

  respondToFileChange (path) {
    if (~path.indexOf('config/')) {
      this.concat(true)
    } else {
      this.copy({type: 'changed', path}, true)
    }
  }
}

module.exports = (watch = false, forceUpload = false, files = false) => {
  return new Mutator()[watch ? 'watch' : 'build'](forceUpload, files)
}
