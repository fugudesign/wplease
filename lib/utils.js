#!/usr/bin/env node

'use strict';
var colors = require('colors');
var deco = colors.dim('===');

module.exports = {

  scriptStart: function(command) {
    console.log('');
    console.log(deco, colors.bold(`WPLEASE -> ${command}`), deco);
    console.log('');
  },

  scriptDone: function() {
    console.log('');
    console.log(deco, colors.bold('DONE'), deco);
    console.log('');
  },

  bot: function(msg) {
    console.log(colors.cyan.bold(msg));
  },

  getSettings: function(path) {
    // Merge default and local settings
    var defaults = require('../init/_wpleasefile');
    var locals = require(path);
    return Object.assign({}, defaults, locals);
  }

};