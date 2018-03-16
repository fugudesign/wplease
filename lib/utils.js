#!/usr/bin/env node

'use strict';
var colors = require('colors');
var fs = require('fs');
var path = require('path');

var deco = colors.dim('===');

/**
 * UTILITY FUNCTIONS
 */
module.exports = {

  /**
   * Overridable console.log equivalent function
   */
  debug: function(message, ...optionalParams) {
    console.log(message, ...optionalParams);
  },

  /**
   * Display the command name
   */
  scriptStart: function(command) {
    console.log('');
    console.log(deco, colors.white.bold(`WPLEASE -> ${command}`), deco);
    console.log('');
  },

  /**
   * Display the command end
   */
  scriptDone: function() {
    console.log('');
    console.log(deco, colors.bold('DONE'), deco);
    console.log('');
  },

  /**
   * Console log a highlighted message
   */
  bot: function(msg) {
    console.log(colors.cyan.bold(msg));
  },

  /**
   * Get the settings by merging 
   * default and local wpleasefil.js files
   */
  getSettings: function(path) {
    // Merge default and local settings
    var defaults = require('../init/_wpleasefile');
    var locals = require(path);
    return Object.assign({}, defaults, locals);
  },

  /**
   * Add a gitignore rule for a theme or plugin
   */
  ignoreExtension: function(cwd, extension, type) {
    if (type != 'plugin' && type != 'theme') {
      throw 'Undifined extension type.';
    }
    var file = path.resolve(`${cwd}/.gitignore`);
    try {  
        // Add extension path as git unignore
        var data = fs.readFileSync(file, 'utf8');
        var replacement = `!/wp-content/${type}s/${extension}`;
        if (!data.match(replacement)) {
          var result = data.replace(/\# end WPlease/g, `${replacement}/\n# end WPlease`);
        
          // Overwrite file content
          fs.writeFileSync(file, result, 'utf8', function (err) {
            if (err) return console.log(err);
          });
          console.log('Success:', `add unignore rule for "${extension}" ${type} in project.`);
          console.log('');
        }
    } catch(e) {
        console.log('Error:', e.stack);
    }
  }

};