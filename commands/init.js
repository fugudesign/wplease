#!/usr/bin/env node

'use strict';
var utils = require('../lib/utils');
var fs = require('fs');
var path = require('path');
var { COPYFILE_EXCL } = fs.constants;

// Command
function initCommand() {}

initCommand.prototype.run = function(env) {
  // Get the settings
  var settings = utils.getSettings(env.configPath);

  utils.bot('Generating wpleasefile and gitignore files...');

  // Generate wpleasefile in project
  fs.copyFile(
    path.resolve(`${path.dirname(__dirname)}/lib/wpleasefile.js`), 
    path.resolve(`${env.cwd}/wpleasefile.js`), 
    COPYFILE_EXCL,
    function(err) {
      if (err) console.log('Info: wpleasefile already exits in project.');
      else console.log('Success: wpleasefile was generated in project.');
    }
  );

  // Generate gitignore file in project
  fs.copyFile(
    path.resolve(`${path.dirname(__dirname)}/lib/gitignore.txt`), 
    path.resolve(`${env.cwd}/.gitignore`), 
    COPYFILE_EXCL,
    function(err) {
      if (err) console.log('Info: .gitnignore already exits in project.');
      else console.log('Success: .gitignore was generated in project.');
    }
  );
  
}

var inst = new initCommand();
module.exports = inst;
