const colors = require('colors')
const config = require('./configure')
const Err = require('./error')
const deps = require('./deps.json')
const {exec} = require('child_process')

class Installer {
  constructor () {}

  run () {
    const dependencies = Object.keys(deps)
    .map(key => `${key}@${deps[key]}`)
    .join(' ')

    this.install(dependencies)
    .then(msg => {
        console.log(msg)
    })
    .catch(msg => {
        console.log(msg)
    })
  }
  
  exec ( command = "ls" ) {
    return new Promise( (resolve, reject) => {
      exec(command, (err, stdout) => {
        if (err) {
          console.error(err)
          reject(err.message)
          return
        }
        resolve(stdout)
      })
    })
  }

  install (dependencies) {
    return this.exec(`cd ${config.get('cwd')} && npm i -D ${dependencies}`)
  }
}

module.exports = () => {
  try {
    const installer = new Installer()
    return installer.run()
  } catch (e) {
    new Err(e)
  }
}
