#!/usr/bin/env node

'use strict';
var utils = require('../lib/utils');
var Liftoff = require('liftoff');
var path = require('path');
var exec = require('child_process').exec;

// Set env var for ORIGINAL cwd
// before anything touches it
process.env.INIT_CWD = process.cwd();

// Create a custom node cli
var cli = new Liftoff({
  name:'wplease'
});

// Exit with 0 or 1
var failed = false;
process.once('exit', function(code) {
  if (code === 0 && failed) {
    process.exit(1);
  }
});

// Parse those args m8
var argv = utils.cliArgs();
var command = utils.cliCommand();
var flags = utils.cliFlags();
var shoulddebug = flags.verbose;
var debug = utils.debug;

if (!shoulddebug) {
  debug = function() {}
}

cli.on('require', function(name) {
  debug('Requiring external module', name);
});

cli.on('requireFail', function(name) {
  debug('Failed to load external module', name);
});

cli.on('respawn', function(flags, child) {
  var nodeFlags = flags.join(', ');
  var pid = child.pid;
  debug('Node flags detected:', nodeFlags);
  debug('Respawned to PID:', pid);
});

cli.launch({
  cwd: argv.cwd
}, handleArguments);

function handleArguments(env) {
  
  // Use the default wpleasefile.js if local one not exists
  if (!env.configPath) {
    env.configPath = path.resolve(`${path.dirname(__dirname)}/init/_wpleasefile.js`);
  }
  
  // Get the settings
  env.settings = utils.getSettings(env.configPath);

  // Chdir before requiring wpleasefile to make sure
  // we let them chdir as needed
  if (process.cwd() !== env.cwd) {
    process.chdir(env.cwd);
    debug('Working directory changed to', env.cwd);
  }
  
  // Execute the command
  execCommand(command, env);
}

/**
 * Function to execute a js command
 * @param {string} command 
 * @param {object} env 
 */
function execCommand(command, env) {
  try {
    var script = require(`../commands/${command}`);
    utils.scriptStart(command);
    script.run(env);
  } catch (err) {
    console.debug(err);
  }
}
