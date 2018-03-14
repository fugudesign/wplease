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

  // Generate wpleasefile in project
  utils.bot('Generating wpleasefile...');
  fs.copyFile(
    path.resolve(`${path.dirname(__dirname)}/lib/wpleasefile.js`), 
    path.resolve(`${env.cwd}/wpleasefile.js`), 
    COPYFILE_EXCL,
    function(err) {
      if (err) throw err;
      console.log('Success: wpleasefile was generated in project.');
      console.log('');
    }
  );

  // Generate gitignore file in project
  utils.bot('Generating .gitignore...');
  fs.copyFile(
    path.resolve(`${path.dirname(__dirname)}/lib/gitignore.txt`), 
    path.resolve(`${env.cwd}/.gitignore`), 
    COPYFILE_EXCL,
    function(err) {
      if (err) throw err;
      console.log('Success: .gitignore file was generated in project.');
      console.log('');
    }
  );
  
}

var inst = new initCommand();
module.exports = inst;
