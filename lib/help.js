#!/usr/bin/env node

'use strict';
var pckg = require('../package.json');
var program = require('commander');

program
  .version(pckg.version);

program
  .command('init [--sync|-s]')
  .description('Initialize a Wordpress project for WPlease usage. The sync flag auto run the sync command script to add plugins and themes to wplease.json.');

program
  .command('install [<project-name>]')
  .description('Run the install script for Wordpress creation, restoration or development in project.');

program
  .command('sync [all|plugins|themes]')
  .description('Synchronize plugins and themes with the wplease.json.');

program
  .command('add [plugin|theme] [<slug>]')
  .description('Add a plugin or theme, activate it and add it to the wplease.json.');

program
  .command('remove [plugin|theme] [<slug>]')
  .description('Remove a plugin or theme, deactivate it and remove it from the wplease.json.');

program
  .command('delete')
  .description('Delete all the gitignored files in project.');

program.on('--help', function(){
    console.log('');
  });

program.parse(process.argv);

module.exports = program;
