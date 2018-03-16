#!/usr/bin/env node

'use strict';
var utils = require('../lib/utils');
var Liftoff = require('liftoff');
var path = require('path');
const argv = require('minimist')(process.argv.slice(2));
var exec = require('child_process').exec;

// Set env var for ORIGINAL cwd
// before anything touches it
process.env.INIT_CWD = process.cwd();

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

function log(message, ...optionalParams) {
  if (shouldLog) {
    console.log(message, ...optionalParams);
  }
}

// Parse those args m8
var cliPackage = require('../package');
var args = argv._;
var command = args.length ? args[0] : 'default';
var shouldLog = argv.verbose;

cli.on('require', function(name) {
  log('Requiring external module', name);
});

cli.on('requireFail', function(name) {
  log('Failed to load external module', name);
});

cli.on('respawn', function(flags, child) {
  var nodeFlags = flags.join(', ');
  var pid = child.pid;
  log('Node flags detected:', nodeFlags);
  log('Respawned to PID:', pid);
});

cli.launch({
  cwd: argv.cwd
}, handleArguments);

function handleArguments(env) {

  if (!env.configPath) {
    env.configPath = path.resolve(`${path.dirname(__dirname)}/init/_wpleasefile.js`);
  }

  // Chdir before requiring wpleasefile to make sure
  // we let them chdir as needed
  if (process.cwd() !== env.cwd) {
    process.chdir(env.cwd);
    log('Working directory changed to', env.cwd);
  }
  
  execCommand(command, env);
}

function execCommand(command, env) {
  try {
    var script = require(`../commands/${command}`);
    utils.scriptStart(command);
    script.run(env);
  } catch (err) {
    console.log(err);
  }
}
