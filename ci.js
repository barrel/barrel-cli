#! /usr/bin/env node
'use strict'

process.env.NODE_ENV = 'production'
process.env.IS_CI = true

const Err = require('./lib/error')
const configure  = require('./lib/configure')
const deployer   = require('./lib/deployer')

module.exports = function run (props) {
  return configure.setup({
    ...props,
    watching: false
  }).then(() => {
    return deployer()
  }).catch(e => {
    new Err(e)
  })
}
