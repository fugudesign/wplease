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

  utils.bot('Generating init files in project...');

  // Generate init files in project
  // template files in init dir must begin by an underscore
  // (ie. _index.html)
  fs.readdirSync(path.resolve(`${path.dirname(__dirname)}/init/`)).forEach(file => {
    fs.copyFile(
      path.resolve(`${path.dirname(__dirname)}/init/${file}`), 
      path.resolve(`${env.cwd}/${file.substr(1)}`), 
      COPYFILE_EXCL,
      function(err) {
        if (err) console.log(`Info: ${file.substr(1)} already exits in project.`);
        else console.log(`Success: ${file.substr(1)} was generated in project.`);
      }
    );
  });
  
}

var inst = new initCommand();
module.exports = inst;
