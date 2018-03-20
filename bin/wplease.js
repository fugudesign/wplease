#!/usr/bin/env node

'use strict'
var utils = require('../lib/utils')
var Liftoff = require('liftoff')
var fs = require('fs')
var path = require('path')
var colors = require('colors')
var exec = require('child_process').exec
var Enquirer = require('enquirer')

// Set env var for ORIGINAL cwd
// before anything touches it
process.env.INIT_CWD = process.cwd()

// create a new prompt instance
var enquirer = new Enquirer()
enquirer.register('confirm', require('prompt-confirm'))

// Create a custom node cli
var cli = new Liftoff({
  name: 'wplease',
  configName: 'wplease'
})

// Exit with 0 or 1
var failed = false
process.once('exit', function (code) {
  if (code === 0 && failed) {
    process.exit(1)
  }
})

// Parse those args m8
var argv = utils.cliArgs()
var command = utils.cliCommand()
var flags = utils.cliFlags()
var shoulddebug = flags.verbose
var debug = utils.debug

if (!shoulddebug) {
  debug = function () {}
}

cli.on('require', function (name) {
  debug('Requiring external module', name)
})

cli.on('requireFail', function (name) {
  debug('Failed to load external module', name)
})

cli.on('respawn', function (flags, child) {
  var nodeFlags = flags.join(', ')
  var pid = child.pid
  debug('Node flags detected:', nodeFlags)
  debug('Respawned to PID:', pid)
})

cli.launch({
  cwd: argv.cwd
}, handleArguments)

function handleArguments (env) {
  
  if (fs.existsSync(`${env.cwd}/wpleasefile.js`) || fs.existsSync(`${env.cwd}/wpleasefile.json`)) {
    if (fs.existsSync(`${env.cwd}/wpleasefile.js`)) {
      console.log('')
      console.log(colors.bold.red('WARNING:'), colors.red(`The wpleasefile.js file has changed for wplease.json`))
      console.log(`A wpleasefile.js was detected in your project.`)
      console.log(`You need to update your project.`)
      console.log(`Please run ${colors.cyan('wplease init')} or ${colors.cyan('wplease install')} and accept to init`)
      console.log(`then update the new file with your custom config.`)
      baseInit(env)
    }
  
    if (fs.existsSync(`${env.cwd}/wpleasefile.json`)) {
      console.log('')
      console.log(colors.bold.red('WARNING:'), colors.red(`The wpleasefile.json file has changed for wplease.json`))
      console.log(`A wpleasefile.json was detected in your project.`)
      enquirer.ask({type: 'confirm', name: 'rename_config_file', message: 'Rename it', 'default': true})
        .then(function (answers) {
          if (answers.rename_config_file) {
            try {
              fs.renameSync(`${env.cwd}/wpleasefile.json`, `${env.cwd}/wplease.json`)
              console.log('Success:', 'renamed wpleasefile.json to wplease.json')
              baseInit(env)
            } catch (err) {
              console.log(err)
              baseInit(env)
            }
          }
        })
    }
  } else {
    baseInit(env)
  }
}

function baseInit (env) {
  
  // Use the default wplease.json if local one not exists
  if (!env.configPath) {
    env.configPath = path.resolve(`${path.dirname(__dirname)}/init/_wplease.json`)
  }
  
  // Get the settings
  env.settings = utils.getSettings(env)
  
  // Chdir before requiring wpleasefile to make sure
  // we let them chdir as needed
  if (process.cwd() !== env.cwd) {
    process.chdir(env.cwd)
    debug('Working directory changed to', env.cwd)
  }
  
  // Execute the command
  execCommand(command, env)
}

/**
 * Function to execute a js command
 * @param {string} command
 * @param {object} env
 */
function execCommand (command, env) {
  try {
    var script = require(`../commands/${command}`)
    utils.scriptStart(command)
    script.run(env)
  } catch (err) {
    console.debug(err)
  }
}
