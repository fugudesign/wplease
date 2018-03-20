#!/usr/bin/env node

'use strict'
var colors = require('colors')
var Enquirer = require('enquirer')
var fs = require('fs')
var path = require('path')
var wp = require('wp-astro')

var utils = require('../lib/utils')
var help = require('../lib/help')
var pckg = require('../package.json')

// create a new prompt instance
var enquirer = new Enquirer()
enquirer.register('confirm', require('prompt-confirm'))
enquirer.register('radio', require('prompt-radio'))

// Command
function AddCommand () {}

AddCommand.prototype.run = function (env, type, slug) {
  env.settings = utils.getSettings(env)
  
  return new Promise((resolve, reject) => {
    var params = utils.cliCommandParams()
    
    // Get command params
    if (!type) {
      if (params.length && (params[0] == 'plugin' || params[0] == 'theme')) {
        addTheType(params[0])
      } else {
        askForType()
      }
    } else {
      askForType()
    }
    
    function askForType () {
      enquirer.ask({
        type: 'radio',
        name: 'add_type',
        message: 'What to add',
        default: 'plugin',
        choices: [
          'plugin',
          'theme'
        ]
      })
        .then(function (answers) {
          addTheType(answers.add_type)
        })
    }
  
    function addTheType (type) {
      if (type && !slug) {
        if (params.length > 1) {
          switchType(type, params[1])
        } else {
          enquirer.ask({
            type: 'input',
            name: 'extension_slug',
            message: `Name of your ${type}`
          })
            .then(function (answers) {
              if (answers.extension_slug) {
                switchType(type, answers.extension_slug)
              } else {
                console.log('Warning:', `You must specify a ${type} name.`)
              }
            })
        }
      }
    }
  
    /**
     *
     * @param type
     * @param slug
     */
    function switchType (type, slug) {
      
      // Call function depending on the params
      if (type && slug) {
        switch (type) {
          default:
          case 'plugin':
            addPlugin(slug)
              .then(res => {
                resolve(true)
              })
            break
      
          case 'theme':
            addTheme(slug)
              .then(res => {
                resolve(true)
              })
            break
      
        }
      }
    }
  
    /**
     * Function to add a plugin to the wplease.json and to the Wordpress
     * @param name
     */
    function addPlugin(name) {
      return new Promise((resolveP, rejectP) => {
        if (env.settings.plugins.indexOf(name) > -1) {
          console.log('Warning:', `The plugin "${name}" is already installed.`)
          resolveP(true)
        } else {
          var install = wp(`plugin install ${name}`, {verbose: true, async: true, flags: {activate: true}})
          install.on('close', function(code) {
            if (code === 0) {
              utils.addPluginToJson(env, name)
                .then(function (res) {
                  resolveP(true)
                })
            } else {
              resolveP(true)
            }
          })
        }
      })
    }
  
    /**
     * Function to add a plugin to the wplease.json and to the Wordpress
     * @param name
     */
    function addTheme(name) {
      return new Promise((resolveT, rejectT) => {
        if (env.settings.themes.indexOf(name) > -1) {
          console.log('Warning:', `The theme "${name}" is already installed.`)
          resolveT(true)
        } else {
          var install = wp(`theme install ${name}`, {verbose: true, async: true, flags: {activate: true}})
          install.on('close', function(code) {
            if (code === 0) {
              utils.addThemeToJson(env, name)
                .then(function (res) {
                  resolveT(true)
                })
            } else {
              resolveT(true)
            }
          })
        }
      })
    }
  })
}

var inst = new AddCommand()
module.exports = inst
