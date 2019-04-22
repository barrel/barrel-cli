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
      if (
        ~path.indexOf('assets/css')
        || ~path.indexOf('assets/js')
        || ~path.indexOf('src/config')
        || !~path.indexOf('src')
        || /modules.*[.](css|js|vue)/.test(path)
        || /dashboard.*[.](css|js|vue)/.test(path)
      ) {
        resolve()
        return
      }

      if (!path.match(/\.[0-9a-z]+$/i)) {
        throw `Error copying path ${path}`;
      }

      let src = path.match(/(\/customers\/.*|.[^\/]*)$/)
      if (src && src[1]) {
        src = src[1]
      } else {
        reject('Error copying path: '+path)
      }
      
      let base = path.match(/src\/(\D[^\/]*)/)
      if (base && base[1]) {
        base = base[1]
      } else {
        reject('Error copying path: '+path)
      }

      // Supports a hybrid modules directory
      if (/.liquid$/.test(src) && /modules/.test(base))  {
        if (/section.liquid$/.test(src)) {
          base = 'sections'
          src = src.replace(/[.]section/, '')
        } else if (/template.liquid$/.test(src)) {
          base = 'templates'
          src = src.replace(/[.]template/, '')
        } else {
          base = 'snippets'
        }
      }

      const dest = `${config.get('cwd')}/dist/${base}${src}`
      const dir = nodePath.dirname(dest)

      if (type === 'changed' || type === 'added') {
        console.log(`Copying ${path}`.cyan)
        fs.copySync(path, `${dir}/${src.split('/').pop()}`)
        if (upload) {
          sendToShopify('upload', `/dist/${base}${src}`, e => {
            bs.reload()
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
              bs.reload()
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
