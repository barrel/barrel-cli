const colors = require('colors')
const nodePath = require('path')
const gulp = require('gulp')
const del = require('delete')
const glob = require('glob-all')
const concat = require('gulp-concat')
const wrap = require('gulp-wrapper')
const rename = require('gulp-rename')
const path = require('path')

const config = require('./configure')
const bs = require('./browsersync')
const Err = require('./error')
const {sendToShopify} = require('./util')

class Gulper {

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
        || /modules.*[.](css|js)/.test(path)
      ) {
        resolve()
        return
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

      if (type === 'changed') {
        console.log(`Copying ${path}`.cyan)
        const pipe = gulp
          .src(path)
          .pipe(rename(src.split('/').pop()))
          .pipe(gulp.dest(dir))
        pipe.on('end', e => {
          if (upload) {
            sendToShopify('upload', `/dist/${base}${src}`, e => {
              bs.reload()
              resolve()
            })
          } else {
            resolve()
          }
        })
      } else if (type === 'deleted') {
        del(dest, {force: true}, err => {
          if (err) {
            reject(`Error deleting ${dest}`)
          }
          resolve()
          console.log(`Deleted ${dest}`.blue)
        })
      }
    })
  }

  concat (upload = false) {
    return new Promise((resolve, reject) => {
      const pipe = gulp.src(config.get('cwd')+'/src/config/lib/**')
        .pipe(concat( 'settings_schema.json', {newLine: ','}))
        .pipe(wrap({
          header: '[',
          footer: ']'
        }))
        .pipe(gulp.dest(`${config.get('cwd')}/dist/config`))

      pipe.on('end', e => {
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
    gulp.watch(
      config.get('cwd')+'/src/**/*.*',
      e => {
        try {
          this.copy(e, true)
        } catch (e) {
          new Err(e)
        }
      }
    )
    gulp.watch(
      config.get('cwd')+'/src/config/**',
      e => {
        try {
          this.concat(true)
        } catch (e) {
          new Err(e)
        }
      }
    )

    return this.build()
  }

}

module.exports = (watch = false, forceUpload = false, files = false) => {
  return new Gulper()[watch ? 'watch' : 'build'](forceUpload, files)
}
