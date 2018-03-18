#!/usr/bin/env node

'use strict';
var utils = require('../lib/utils');
var Enquirer = require('enquirer');
var exec = require('child_process').exec;

// create a new prompt instance
var enquirer = new Enquirer();
enquirer.register('confirm', require('prompt-confirm'));

// Command
function DeleteCommand() {}
DeleteCommand.prototype.run = function(env) {

  /**
   * Ask for confirmation about deleting all 
   * gitignored files and folders
   */
  enquirer.ask({
    type: 'confirm',
    name: 'delete',
    message: 'Are you sure you want to delete all git ignored files ? This action is irreversible.',
    default: false
  })
  .then(function(answers) {
    if (answers.delete) {
      console.log('');
      
      utils.bot('Deleting git ignored files...');

      // Delete all git ignored files and folders
      exec('git clean -xdf', 
      (err, stdout, stderr) => {
          if (err instanceof Error) {
              console.error(err);
              throw err;
          }
          console.log('Success: Deleted git ignored files.');
          console.log('');
      });
    }
  });
}

var inst = new DeleteCommand();
module.exports = inst;
