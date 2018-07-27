#! /usr/bin/env node
'use strict'

const deps = require('./lib/deps.json')
const {exec} = require('child_process')

class Installer {
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
    // Last npm i is to recreate full .bin folder
    return this.exec(`cd ${process.cwd()} && npm i -D ${dependencies} && npm i`)
  }
}

const installer = new Installer()
installer.run()
