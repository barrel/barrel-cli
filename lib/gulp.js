const colors = require('colors')
const nodePath = require('path')
const gulp = require('gulp')
const del = require('delete')
const glob = require('glob-all')
const theme = require('@shopify/themekit').command
const concat = require('gulp-concat')
const wrap = require('gulp-wrapper')

const config = require('./configure')
const bs = require('./browsersync')
const Err = require('./error')

class Gulper {

  constructor() {
    if (config.get('watching')) {
      config.set('keepAlive', true)
    }
  }

  watch () {
    // Start things off by building
    this.build()

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
  }

  copy ({type, path}, upload = false) {
    if (
      ~path.indexOf('assets/css')
      || ~path.indexOf('assets/js')
      || ~path.indexOf('src/config')
    ) return

    let src = path.match(/(\/customers\/.*|.[^\/]*)$/)
    if (src && src[1]) {
      src = src[1]
    } else {
      throw new Error('Error copying path: '+path)
    }
    
    let base = path.match(/src\/(\D[^\/]*)/)
    if (base && base[1]) {
      base = base[1]
    } else {
      throw new Error('Error copying path: '+path)
    }
    
    const dest = `${config.get('cwd')}/dist/${base}${src}`
    const dir = nodePath.dirname(dest)

    if (type === 'changed') {
      console.log(`Copying ${dest}`.cyan)
      const pipe = gulp
        .src(path)
        .pipe(gulp.dest(dir))
      pipe.on('end', e => {
        if (upload) {
          this.sendToShopify('upload', `/dist/${base}/${src}`)
        }
      })
    } else if (type === 'deleted') {
      del(dest, {force: true}, err => {
        if (err) throw new Error(`Error deleting ${dest}`)
        console.log(`Deleted ${dest}`.blue)
      })
    }
  }

  concat (upload = false) {
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
          this.sendToShopify('upload', `/dist/config/settings_schema.json`)
        }
      })
  }

  build () {
    glob([
      `${config.get('cwd')}/src/**/*.*`
    ], e => {
      // console.log(e)
    }).on('match', path => {
      this.copy({type: 'changed', path}, false)
    })

    this.concat(false)
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

  sendToShopify (action, src) {
    theme({
      args: [
        action, 
        '--env', process.env.ENV, 
        '--config', config.get('configPath'),
        src
      ],
      logLevel: 'silent'
    }, e => {
      if (e) {
        console.log(`${e}`.red)
      } else {
        console.log(`[${action}] ${src}`.white)
        bs.reload()
      }
    })
  }
}

module.exports = (watch = false) => {
  let gulper

  try {
    gulper = new Gulper()
    gulper[watch ? 'watch' : 'build']()
  } catch (e) {
    new Err(e)
  }

  return gulper
}
