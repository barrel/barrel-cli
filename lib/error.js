const colors = require('colors')

class CustomError {
  constructor (err) {
    console.log(`😭 ❕❕❕❕ >>>> ${err.message}`.white)
    console.log(`${err.stack}`.blue)
    process.exit(1)
  }
}

module.exports = CustomError
