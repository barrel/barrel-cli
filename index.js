#! /usr/bin/env node
'use strict'

const path = require('path')
const fs = require('fs')
const program = require('commander')
const colors = require('colors')

const pkg = require('./package.json')

program
  .version(pkg.version)
  .option('-w --watch', 'recursively watch src directory')
  .option('-e --env [env]', 'specify an environment')
  .option('-b, --build [env]', 'deploy a theme')
  .option('-d, --deploy [env]', 'deploy a theme')
  .option('--debug', 'enable available debugging')
  .parse(process.argv)

if (program.debug) {
  process.env.DEBUG = '*'
}

process.env.ENV = program.env || 'development'

if (process.env.ENV !== 'development') {
  process.env.NODE_ENV = 'production'
}

const Err = require('./lib/error')
const configure  = require('./lib/configure')
const watcher    = require('./lib/watcher')
const builder    = require('./lib/builder')
const deployer   = require('./lib/deployer')

/**
 * Clear terminal bc it's prettier
 */
process.stdout.write('\x1B[2J\x1B[0f')

configure.setup(program.watch).then(() => {
  switch (true) {
    case program.watch: 
      watcher()
      break
    case program.build:
      builder()
      break
    case program.deploy:
      if (configure.get('shopify')) {
        deployer()
      }
      break
  }
}).catch(e => {
  new Err(e)
})