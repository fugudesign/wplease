#!/usr/bin/env node

'use strict';
var pckg = require('../package.json');
var program = require('commander');

program
  .version(pckg.version);

program
  .command('init')
  .description('Initialize a Wordpress project for WPlease usage.');

program
  .command('install')
  .description('Run the install script for Wordpress creation, restoration or development in project.');

program
  .command('delete')
  .description('Delete all the gitignored files in project.');

program.on('--help', function(){
    console.log('');
  });

program.parse(process.argv);

module.exports = program;