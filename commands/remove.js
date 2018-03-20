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
function RemoveCommand () {}

RemoveCommand.prototype.run = function (env, type, slug) {
  env.settings = utils.getSettings(env)
  
  return new Promise((resolve, reject) => {
    var params = utils.cliCommandParams()
    
    // Get command params
    if (!type) {
      if (params.length && (params[0] == 'plugin' || params[0] == 'theme')) {
        removeTheType(params[0])
      } else {
        askForType()
      }
    } else {
      askForType()
    }
    
    function askForType () {
      enquirer.ask({
        type: 'radio',
        name: 'remove_type',
        message: 'What to remove (space to select)',
        default: 'plugin',
        choices: [
          'plugin',
          'theme'
        ]
      })
        .then(function (answers) {
          removeTheType(answers.remove_type)
        })
    }
  
    function removeTheType (type) {
      if (type && !slug) {
        if (params.length > 1) {
          switchType(type, params[1])
        } else {
          var choices = []
          switch (type) {
            default:
            case 'plugin':
              var plugins = wp('plugin list', {flags: {format: 'json'}})
              // Filter the custom plugins
              plugins = plugins.filter(plugin => {
                return plugin.version && env.settings.plugins.indexOf(`@${plugin.name}`) === -1
              })
              // Reduce array of objects to array of strings
              choices = plugins.map(plugin => plugin.name)
              break
  
            case 'theme':
              var themes = wp('theme list', {flags: {format: 'json'}})
              // Filter the custom themes
              themes = themes.filter(theme => env.settings.themes.indexOf(`@${theme.name}`) === -1)
              // Reduce array of objects to array of strings
              choices = themes.map(theme => theme.name)
              break
          }
          
          enquirer.ask({
            type: 'radio',
            name: `${type}_to_remove`,
            message: `Which ${type} to remove (space to select)`,
            choices: choices
          })
            .then(function (answers) {
              if (answers[`${type}_to_remove`]) {
                switchType(type, answers[`${type}_to_remove`])
              } else {
                console.log('Warning:', `You must specify a ${type} to remove.`)
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
            removePlugin(slug)
              .then(res => {
                resolve(true)
              })
            break
      
          case 'theme':
            removeTheme(slug)
              .then(res => {
                resolve(true)
              })
            break
      
        }
      }
    }
  
    /**
     * Function to remove a plugin to the wplease.json and to the Wordpress
     * @param name
     */
    function removePlugin(name) {
      return new Promise((resolveP, rejectP) => {
        var remove = wp(`plugin delete ${name}`, {verbose: true, async: true})
        remove.on('close', function(code) {
          if (code === 0) {
            utils.removePluginFromJson(env, name)
              .then(function (res) {
                resolveP(true)
              })
          } else {
            resolveP(true)
          }
        })
      })
    }
  
    /**
     * Function to remove a plugin to the wplease.json and to the Wordpress
     * @param name
     */
    function removeTheme(name) {
      return new Promise((resolveT, rejectT) => {
        var remove = wp(`theme delete ${name}`, {verbose: true, async: true})
        remove.on('close', function(code) {
          if (code === 0) {
            utils.removeThemeFromJson(env, name)
              .then(function (res) {
                resolveT(true)
              })
          } else {
            resolveT(true)
          }
        })
      })
    }
  })
}

var inst = new RemoveCommand()
module.exports = inst
