#!/usr/bin/env node

'use strict'
var colors = require('colors')
var utils = require('../lib/utils')
var help = require('../lib/help')
var pckg = require('../package.json')

// Command
function DefaultCommand () {}

DefaultCommand.prototype.run = function (env) {
  
  /**
   * Display a default message
   */
  console.log('Version:', pckg.version)
  console.log('')
  console.log('Ask something to the "Wordpress Please" script.')
  console.log('Maybe could you start by:', colors.cyan('wplease --help'))
  console.log('')
}

var inst = new DefaultCommand()
module.exports = inst
