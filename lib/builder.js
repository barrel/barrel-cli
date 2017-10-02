const colors = require('colors')
const config = require('./configure')
const Webpack = require('./webpack')
const Err = require('./error')
const Gulp = require('./Gulp')

class Builder {
  constructor () {
    this.compiler = Webpack(false).compiler
  }

  run () {
    this.compiler.run((err, stats) => {
      this.handleErrors(err, stats)
      console.log('successfully compiled javascript...'.green)
    })

    Gulp(false)
  }

  handleErrors (err, stats) {
    if (err) {
      throw new Error(err)
    }

    if (stats.hasErrors()) {
      let {errors = []} = stats.compilation 
      errors.map(e => e.message)
      throw new Error(errors)
    }
  }
}

module.exports = () => {
  let builder

  try {
    builder = new Builder()
    builder.run()
  } catch (e) {
    new Err(e)
  }

  return builder
}
