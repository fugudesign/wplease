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
  
    utils.bot('Synchronizing...')
    
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
        // Install themes filled in wplease.json
        var i = 0
        if (env.settings.themes.length) {
          each(env.settings.themes, (theme, next) => {
            i++
            if (!theme.startsWith('@')) {
              bot(`Checking ${theme}...`)
              var install = wp(`theme install "${plugin}"`, {
                async: true,
                verbose: true,
                flags: {activate: true, 'skip-plugins': true, 'skip-themes': true}
              })
              install.on('close', (code) => {
                if (env.settings.themes.length === i) {
                  handleNewThemes(resolveT)
                }
                next()
              })
            } else {
              if (env.settings.themes.length === i) {
                handleNewThemes(resolveT)
              }
              next()
            }
          })
        } else {
          handleNewThemes(resolveT)
        }
      })
    }
  
    function handleNewThemes (promiseResolve) {
      // Ask for other themes deletion
      var themes = wp('theme list', { flags: {format: 'json', 'skip-plugins': true, 'skip-themes': true} })
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
                        promiseResolve(true)
                      }
                      next()
                    })
                  break
            
                case 'delete':
                  wp(`theme delete ${theme.name}`, {verbose: true})
                  if (themes.length == t) {
                    promiseResolve(true)
                  }
                  next()
                  break
              }
            }
          })
      })
    }
  
    /**
     * Filter plugin name if is premium plugin
     * to get the download url
     * @param plugin
     * @returns {*}
     */
    function hookPremiumPlugin (plugin) {
      return new Promise((resolve2, reject2) => {
        if (plugin === 'advanced-custom-fields-pro') {
          enquirer.ask({
            type: 'input',
            name: `acf_pro_key`,
            message: 'ACF Pro key (paste key or N to cancel)'
          })
            .then(function (answers) {
              if (answers.acf_pro_key === 'N') {
                resolve2(plugin)
              } else if (answers.acf_pro_key) {
                resolve2(`http://connect.advancedcustomfields.com/index.php?p=pro&a=download&k=${answers.acf_pro_key}`)
              } else {
                reject2('You must specify a ACF Pro key to download and install it.')
              }
            })
        } else {
          resolve2(plugin)
        }
      })
    }
    
    function syncPlugins() {
      return new Promise((resolveP, rejectP) => {
        utils.bot('Sync plugins...')
        // Install plugins filled in wplease.json
        var i = 0
        if (env.settings.plugins.length) {
          each(env.settings.plugins, (plugin, next) => {
            i++
            if (!plugin.startsWith('@')) {
              bot(`Checking ${plugin}...`)
              var installed = wp(`plugin is-installed ${plugin}`, {
                async: true,
                verbose: true,
                flags: {'skip-plugins': true, 'skip-themes': true}
              })
              installed.on('close', (code) => {
                // If plugin is installed
                if (code !== 0) {
                  hookPremiumPlugin(plugin)
                    .then(hooked => {
                      if (hooked) {
                        var install = wp(`plugin install "${hooked}"`, {
                          async: true,
                          verbose: true,
                          flags: {activate: true, 'skip-plugins': true, 'skip-themes': true}
                        })
                        install.on('close', (code) => {
                          if (code !== 0 && hooked === plugin) {
                            enquirer.ask({
                              type: 'input',
                              name: `download_url`,
                              message: 'Download link (paste url or N to cancel)'
                            })
                              .then(function (answers) {
                                if (answers.download_url === 'N') {
                                  console.log('')
                                  if (env.settings.plugins.length === i) {
                                    handleNewPlugins(resolveP)
                                  }
                                  next()
                                } else if (answers.download_url) {
                                  var install2 = wp(`plugin install ${answers.download_url}`, {
                                    async: true,
                                    verbose: true,
                                    flags: {activate: true, 'skip-plugins': true, 'skip-themes': true}
                                  })
                                  install2.on('close', (code) => {
                                    if (env.settings.plugins.length === i) {
                                      handleNewPlugins(resolveP)
                                    }
                                    next()
                                  })
                                } else {
                                  reject2('You must specify a WPML url to download and install it.')
                                }
                              })
                          } else {
                            if (env.settings.plugins.length === i) {
                              handleNewPlugins(resolveP)
                            }
                            next()
                          }
                        })
                      }
                    })
                }
                // If plugin is not installed
                else {
                  if (env.settings.plugins.length === i) {
                    handleNewPlugins(resolveP)
                  }
                  next()
                }
              })
            } else {
              if (env.settings.plugins.length === i) {
                handleNewPlugins(resolveP)
              }
              next()
            }
          })
        } else {
          handleNewPlugins(resolveP)
        }
      })
    }
    
    function handleNewPlugins (promiseResolve) {
      // Ask for other plugins deletion
      var plugins = wp('plugin list', {flags: {format: 'json', 'skip-plugins': true, 'skip-themes': true}})
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
                  utils.addPluginToJson(env, plugin.name, action === 'save as custom')
                    .then(function (res) {
                      if (plugins.length == p) {
                        promiseResolve(true)
                      }
                      next()
                    })
                  break
            
                case 'delete':
                  wp(`plugin uninstall ${plugin.name}`, {verbose: true, flags: {deactivate: true, 'skip-plugins': true, 'skip-themes': true}})
                  if (plugins.length == p) {
                    promiseResolve(true)
                  }
                  next()
                  break
              }
            }
          })
      })
    }
  })
}

var inst = new SyncCommand()
module.exports = inst
