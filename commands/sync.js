#!/usr/bin/env node

'use strict'
var colors = require('colors')
var Enquirer = require('enquirer')
var fs = require('fs')
var path = require('path')
var wp = require('wp-astro')
var each = require('sync-each')

var utils = require('../lib/utils')
var help = require('../lib/help')
var pckg = require('../package.json')

// create a new prompt instance
var enquirer = new Enquirer()
enquirer.register('confirm', require('prompt-confirm'))
enquirer.register('radio', require('prompt-radio'))

// Command
function SyncCommand () {}

SyncCommand.prototype.run = function (env, type) {
  env.settings = utils.getSettings(env)
  return new Promise((resolve, reject) => {
    if (!type) {
      var params = utils.cliCommandParams()
      if (params.length) {
        type = params[0]
      }
    }
    
    if (!fs.existsSync(env.configPath)) {
      enquirer.ask({type: 'confirm', name: 'init', message: 'Initialize project', 'default': false})
        .then(function (answers) {
          if (answers.init) {
            InitScript.run(env)
              .then((res) => {
                console.log('')
                sync()
              })
              .catch((err) => {
                console.log(err)
                sync()
              })
          } else {
            console.log('')
            resolve(true)
          }
        })
    } else {
      sync()
    }
    
    function sync() {
      if (type) {
        syncTheType(type)
      } else {
        enquirer.ask({
          type: 'radio',
          name: 'sync_type',
          message: 'What to sync (space to select)',
          default: 'all',
          choices: [
            'all',
            'plugins',
            'themes'
          ]
        })
          .then(function (answers) {
            syncTheType(answers.sync_type)
          })
      }
    }
    
    function syncTheType(sync_type) {
      switch (sync_type) {
        
        case 'all':
          syncPlugins()
            .then(res => {
              syncThemes()
                .then(res => {
                  resolve(true)
                })
            })
          break
        
        case 'plugins':
          syncPlugins()
            .then(res => {
              resolve(true)
            })
          break
        
        case 'themes':
          syncThemes()
            .then(res => {
              resolve(true)
            })
          break
        
      }
    }
    
    function syncThemes() {
      return new Promise((resolveT, rejectT) => {
        utils.bot('Sync themes...')
        // Install themes filled in wpleasefile
        env.settings.themes.forEach(function (theme) {
          if (!theme.startsWith('@')) {
            wp(`theme install ${theme}`, {verbose: true, flags: {activate: true}})
          }
        })
        // Ask for other themes deletion
        var themes = wp('theme list', { flags: {format: 'json'} })
        themes = themes.filter(theme => {
          var isCustom = env.settings.themes.indexOf(`@${theme.name}`) > -1
          var isInSettings = env.settings.themes.indexOf(theme.name) > -1
          return !isInSettings && !isCustom
        })
        var t = 0
        each(themes, (theme, next) => {
          t++
          console.log('Warning:', `${theme.name} theme is not present in your wplease.json.`)
          enquirer.ask({
            type: 'radio',
            name: `action_to_${theme.name}`,
            message: 'What to do with (space to select)',
            default: 'save',
            choices: [
              'save',
              'save as custom',
              'delete'
            ]
          })
            .then(function (answers) {
              var action = answers[`action_to_${theme.name}`]
              if (action) {
                switch (action) {
                  default:
                  case 'save':
                  case 'save as custom':
                    utils.addThemeToJson(env, theme.name, action === 'save as custom')
                      .then(function (res) {
                        if (themes.length == t) {
                          resolveT(true)
                        }
                        next()
                      })
                    break
          
                  case 'delete':
                    wp(`theme uninstall ${theme.name}`, {verbose: true, flags: {deactivate: true}})
                    if (themes.length == t) {
                      resolveT(true)
                    }
                    next()
                    break
                }
              }
            })
        })
      })
    }
    
    function syncPlugins() {
      return new Promise((resolveP, rejectP) => {
        utils.bot('Sync plugins...')
        // Install plugins filled in wpleasefile
        /*env.settings.plugins.forEach(function (plugin) {
          if (!plugin.startsWith('@')) {
            wp(`plugin install ${plugin}`, {verbose: true, flags: {activate: true}})
          }
        })*/
        // Ask for other plugins deletion
        var plugins = wp('plugin list', {flags: {format: 'json'}})
        plugins = plugins.filter(plugin => {
          var hasVersion = plugin.version
          var isCustom = env.settings.plugins.indexOf(`@${plugin.name}`) > -1
          var isInSettings = env.settings.plugins.indexOf(plugin.name) > -1
          return hasVersion && !isInSettings && !isCustom
        })
        var p = 0
        each(plugins, (plugin, next) => {
          p++
          console.log('Warning:', `${plugin.name} plugin is not present in your wplease.json.`)
          enquirer.ask({
            type: 'radio',
            name: `action_to_${plugin.name}`,
            message: 'What to do with (space to select)',
            default: 'save',
            choices: [
              'save',
              'save as custom',
              'delete'
            ]
          })
            .then(function (answers) {
              var action = answers[`action_to_${plugin.name}`]
              if (action) {
                switch (action) {
                  default:
                  case 'save':
                  case 'save as custom':
                    // TODO: auto add as custom if not in wordpress repo
                    //var official = wp(`plugin search ${plugins.name}`, ['--per-page=1 ', '--field=slug', '--quiet'])
                    utils.addPluginToJson(env, plugin.name, action === 'save as custom')
                      .then(function (res) {
                        if (plugins.length == p) {
                          resolveP(true)
                        }
                        next()
                      })
                    break
                  
                  case 'delete':
                    wp(`plugin uninstall ${plugin.name}`, {verbose: true, flags: {deactivate: true}})
                    if (plugins.length == p) {
                      resolveP(true)
                    }
                    next()
                    break
                }
              }
            })
        })
      })
    }
  })
}

var inst = new SyncCommand()
module.exports = inst
