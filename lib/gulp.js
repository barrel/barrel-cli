const colors = require('colors')
const nodePath = require('path')
const Err = require('./error')
const gulp = require('gulp')
const del = require('delete')
const glob = require('glob-all')
const theme = require('@shopify/themekit').command
const concat = require('gulp-concat')
const wrap = require('gulp-wrapper')

const config = require('./configure')
const bs = require('./browsersync')

class Gulper {

  watch () {
    gulp.watch(
      `${config.get('cwd')}/src/**`,
      e => this.copy(e, true)
    )
    gulp.watch(
      `${config.get('cwd')}/src/config/**`,
      e => this.concat()
    )
  }

  copy ({type, path}, upload = false) {
    if (
      ~path.indexOf('assets/css')
      || ~path.indexOf('assets/js')
      || ~path.indexOf('src/config')
    ) return

    const src = path
      .match(/(\/customers\/.*|.[^\/]*)$/)[1]
    const base = path.match(/src\/(\D[^\/]*)/)[1]
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

  concat () {
     gulp.src(`${config.get('cwd')}/src/config/**`)
      .pipe(concat( 'settings_schema.json', {newLine: ','}))
      .pipe(wrap({
        header: '[',
        footer: ']'
      }))
      .pipe(gulp.dest(`${config.get('cwd')}/dist/config`))
  }

  build () {
    glob([
      `${config.get('cwd')}/src/**/*.*`
    ], e => {
      console.log(e)
    }).on('match', path => {
      this.copy({type: 'changed', path}, false)
    })

    this.concat()
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
      if (e) throw new Error(e)
      console.log(`[${action}] ${src}`.white)
      bs.reload()
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
