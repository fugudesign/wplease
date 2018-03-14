#!/usr/bin/env node

'use strict';
var utils = require('../lib/utils');
var Enquirer = require('enquirer');
var exec = require('child_process').exec;

// create a new prompt instance
var enquirer = new Enquirer();
enquirer.register('confirm', require('prompt-confirm'));

// Command
function deleteCommand() {}

deleteCommand.prototype.run = function(env) {
  // Get the settings
  var settings = utils.getSettings(env.configPath);

  enquirer.ask({type: 'confirm', name: 'delete', message: 'Are you sure you want to delete the Wordpress files ? This action is irreversible.', 'default': 'my-website'})
  .then(function(answers) {
    if (answers.delete) {
      console.log('');
      
      utils.bot('Deleting Wordpress...');

      exec('rm -fR wp-* && rm -f *.php && rm -f *.html && rm -f *.txt && rm -f .htaccess', 
        (e, stdout, stderr) => {
          if (e instanceof Error) {
              console.error(e);
              throw e;
          }
          console.log('Success: Deleted Wordpress installation.');
          console.log('');
      });
    }
  });
}

var inst = new deleteCommand();
module.exports = inst;
