#!/usr/bin/env node

'use strict'
var colors = require('colors')
var fs = require('fs')
var path = require('path')
var argv = require('minimist')
var each = require('sync-each')
var updateJson = require('update-json')
var _ = require('lodash');

var deco = colors.dim('===')

/**
 * UTILITY FUNCTIONS
 */
module.exports = {
  
  /**
   * Get command arguments
   */
  cliArgs: function () {
    return argv(process.argv.slice(2))
  },
  
  /**
   * Get parameters
   */
  cliParams: function () {
    var args = this.cliArgs()
    var params = args._
    return params
  },
  
  /**
   * Get command
   */
  cliCommand: function () {
    var params = this.cliParams()
    return params.length ? params[0] : 'default'
  },
  
  /**
   * Get command parameters
   */
  cliCommandParams: function () {
    var params = this.cliParams()
    params.shift()
    return params
  },
  
  /**
   * Get command flags
   */
  cliFlags: function () {
    var args = this.cliArgs()
    var flags = args
    delete flags._
    return flags
  },
  
  /**
   * Overridable console.log equivalent function
   * @param message        The message to debug
   * @param optionalParams The other optional params
   */
  debug: function (message, ...optionalParams) {
    console.log(message, ...optionalParams)
  },
  
  /**
   * Display the command name
   * @param command The command to display
   */
  scriptStart: function (command) {
    console.log('')
    var suffix = command === 'default' ? '' : ` -> ${command}`
    console.log(deco, colors.white.bold(`WPLEASE${suffix}`), deco)
    console.log('')
  },
  
  /**
   * Console log a highlighted message
   * @param msg The message to log as bot
   */
  bot: function (msg) {
    console.log(colors.cyan.bold(msg))
  },
  
  /**
   * Check if a custom theme is present in wpleasefile
   * @param env
   * @returns {boolean}
   */
  hasCustomTheme: function (env) {
    var custom = env.settings.themes.filter(theme => theme.startsWith('@'))
    return custom.length > 0 ? custom[0].replace('@', '') : false
  },
  
  /**
   * Check if a custom plugin is present in wpleasefile
   * @param env
   * @returns {boolean}
   */
  hasCustomPlugin: function (env) {
    var custom = env.settings.plugins.filter(plugin => plugin.startsWith('@'))
    return custom.length > 0 ? custom[0].replace('@', '') : false
  },
  
  /**
   * Get the settings by merging
   * default and local wpleasefil.js files
   * @param path       The path of the local settings file
   * @returns {object}
   */
  getSettings: function (env) {
    
    // Merge default and local settings
    var defaultFile = fs.readFileSync(`${path.dirname(__dirname)}/init/_wplease.json`);
    var defaults = JSON.parse(defaultFile);
    var localFile = fs.readFileSync(env.configPath);
    var locals = JSON.parse(localFile);
    
    return _.defaultsDeep(locals, defaults)
  },
  
  /**
   * Add the project name to the wplease.json
   * @param name The project name to add in the file
   */
  addProjectNameToJson: function (env, name) {
    return new Promise((resolve, reject) => {
      env.settings = this.getSettings(env)
      var file = path.resolve(`${env.cwd}/wplease.json`)
      var obj = {name: name}
      
      updateJson(file, obj, function (error) {
        if (error) {
          throw error
          reject('Impossible to write in JSON file.')
        }
        else {
          console.log('Success:', `add project name "${name}" to the wplease.json`)
          console.log('')
          resolve(true)
        }
      })
    })
  },
  
  /**
   * Add the project name to the wplease.json
   * @param name The project name to add in the file
   */
  addThemeToJson: function (env, theme, custom) {
    return new Promise((resolve, reject) => {
      env.settings = this.getSettings(env)
      var file = path.resolve(`${env.cwd}/wplease.json`)
      var name = custom ? `@${theme}` : theme
      var obj = {themes: _.union(env.settings.themes, [name])}
      updateJson(file, obj, function (error) {
        if (error) {
          throw error
          reject('Impossible to write in JSON file.')
        }
        else {
          console.log('Success:', `add theme "${theme}" to the wplease.json`)
          console.log('')
          resolve(true)
        }
      })
    })
  },
  
  /**
   * Add the plugin to the wplease.json
   * @param env    The global env var
   * @param plugin The plugin name to add in the file
   * @param custom Boolean, true if custom plugin, false if not
   */
  addPluginToJson: function (env, plugin, custom) {
    return new Promise((resolve, reject) => {
      env.settings = this.getSettings(env)
      var file = path.resolve(`${env.cwd}/wplease.json`)
      var name = custom ? `@${plugin}` : plugin
      var obj = {plugins: _.concat(env.settings.plugins, [name])}
      updateJson(file, obj, function (error) {
        if (error) {
          throw error
          reject('Impossible to write in JSON file.')
        }
        else {
          console.log('Success:', `add plugin "${plugin}" to the wplease.json`)
          console.log('')
          resolve(true)
        }
      })
    })
  },
  
  /**
   * Remove the plugin from the wplease.json
   * @param env    The global env var
   * @param plugin The plugin name to remove in the file
   * @param custom Boolean, true if custom plugin, false if not
   */
  removePluginFromJson: function (env, plugin, custom) {
    return new Promise((resolve, reject) => {
      env.settings = this.getSettings(env)
      var file = path.resolve(`${env.cwd}/wplease.json`)
      var name = custom ? `@${plugin}` : plugin
      var obj = {plugins: env.settings.plugins.filter(p => name !== p)}
      updateJson(file, obj, function (error) {
        if (error) {
          throw error
          reject('Impossible to write in JSON file.')
        }
        else {
          console.log('Success:', `remove plugin "${plugin}" from the wplease.json`)
          console.log('')
          resolve(true)
        }
      })
    })
  },
  
  /**
   * Remove the theme from the wplease.json
   * @param env    The global env var
   * @param theme The theme name to remove in the file
   * @param custom Boolean, true if custom theme, false if not
   */
  removeThemeFromJson: function (env, theme, custom) {
    return new Promise((resolve, reject) => {
      env.settings = this.getSettings(env)
      var file = path.resolve(`${env.cwd}/wplease.json`)
      var name = custom ? `@${theme}` : theme
      var obj = {themes: env.settings.themes.filter(p => name !== p)}
      updateJson(file, obj, function (error) {
        if (error) {
          throw error
          reject('Impossible to write in JSON file.')
        }
        else {
          console.log('Success:', `remove theme "${theme}" from the wplease.json`)
          console.log('')
          resolve(true)
        }
      })
    })
  },
  
  /**
   * Add a gitignore rule for a theme or plugin
   * @param cwd       Current working directory
   * @param extension Slug of the extension to ignore
   * @param type      Type of the extention to ignore
   */
  ignoreExtension: function (env, extension, type) {
    if (type != 'plugin' && type != 'theme') {
      throw 'Undifined extension type.'
    }
    var file = path.resolve(`${env.cwd}/.gitignore`)
    try {
      // Add extension path as git unignore
      var data = fs.readFileSync(file, 'utf8')
      var replacement = `!/wp-content/${type}s/${extension}`
      if (!data.match(replacement)) {
        var result = data.replace(/\# end WPlease/g, `${replacement}/\n# end WPlease`)
        
        // Overwrite file content
        fs.writeFileSync(file, result, 'utf8', function (err) {
          if (err) return console.log(err)
        })
        console.log('Success:', `add unignore rule for "${extension}" ${type} in project.`)
        console.log('')
      }
    } catch (e) {
      console.log('Error:', e.stack)
    }
  }
  
}
