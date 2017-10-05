const colors = require('colors')
const config = require('./configure')

class CustomError {
  constructor (err) {
    console.log(`😭 ❕❕❕❕ >>>> ${err.message}`.white)
    console.log(`${err.stack}`.blue)
    
    if (!config.get('keepAlive')) {
      process.exit(1)
    }
  }
}

module.exports = CustomError
