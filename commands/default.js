#!/usr/bin/env node

'use strict';
var colors = require('colors');
var utils = require('../lib/utils');
var help = require('../lib/help');
var pckg = require('../package.json');

// Command
function defaultCommand() {}
defaultCommand.prototype.run = function(env) {
  // Get the settings
  var settings = utils.getSettings(env.configPath);

  /**
   * Display a default message
   */
  console.log('Version:', pckg.version);
  console.log('');
  console.log('Ask something to the "Wordpress Please" script.');
  console.log('Maybe could you start by:', colors.cyan('wplease --help'));
  console.log('');
}

var inst = new defaultCommand();
module.exports = inst;
