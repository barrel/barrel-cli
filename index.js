#! /usr/bin/env node
'use strict'

const path = require('path')
const fs = require('fs')
const program = require('commander')
const colors = require('colors')

const pkg = require('./package.json')
const bus = require('./lib/emitter')

program
  .version(pkg.version)
  .option('-w --watch', 'recursively watch src directory')
  .option('-e --env [env]', 'specify an environment')
  .option('-b, --build [env]', 'deploy a theme')
  .option('--debug', 'enable available debugging')
  .parse(process.argv)

if (program.debug) {
  process.env.DEBUG = '*'
}

process.env.ENV = program.env || 'development'

const Err = require('./lib/error')
const configure = require('./lib/configure')
const watcher   = require('./lib/watcher')
const builder   = require('./lib/builder')
const gulp = require('./lib/gulp')


/**
 * Clear terminal bc it's prettier
 */
process.stdout.write('\x1B[2J\x1B[0f')

try {
  configure.setup(program.watch).then(() => {
    program.watch ? watcher() : builder()
  })
} catch (e) {
  new Err(e)
}
