#!/usr/bin/env node

'use strict';
var colors = require('colors');
var fs = require('fs');
var path = require('path');

var deco = colors.dim('===');

module.exports = {

  scriptStart: function(command) {
    console.log('');
    console.log(deco, colors.white.bold(`WPLEASE -> ${command}`), deco);
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
  },

  addThemeToGitignore: function(dir, theme) {
    var file = path.resolve(`${dir}/.gitignore`);
    try {  
        // Add theme path as git unignore
        var data = fs.readFileSync(file, 'utf8');
        var replacement = `!/wp-content/themes/${theme}`;
        if (!data.match(replacement)) {
          var result = data.replace(/\# end WPlease/g, `${replacement}/\n# end WPlease`);
        
          // Overwrite file content
          fs.writeFileSync(file, result, 'utf8', function (err) {
            if (err) return console.log(err);
          });
          console.log('Success:', `add unignore rule for "${theme}" theme in project.`);
          console.log('');
        }
    } catch(e) {
        console.log('Error:', e.stack);
    }
  }

};