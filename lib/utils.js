#!/usr/bin/env node

'use strict'
var colors = require('colors')
var fs = require('fs')
var path = require('path')
var argv = require('minimist')
var updateJson = require('update-json')

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
   * Get the settings by merging
   * default and local wpleasefil.js files
   * @param path       The path of the local settings file
   * @returns {object}
   */
  getSettings: function (path) {
    // Merge default and local settings
    var defaults = require('../init/_wpleasefile.json')
    var locals = require(path)
    return Object.assign({}, defaults, locals)
  },
  
  /**
   * Add the project name to the wpleasefile.json
   * @param name The project name to add in the file
   */
  addProjectNameToJson: function (cwd, name) {
    return new Promise((resolve, reject) => {
      var file = path.resolve(`${cwd}/wpleasefile.json`)
      var obj = {name: name}
      
      updateJson(file, obj, function (error) {
        if (error) {
          throw error
          reject('Impossible to write in JSON file.')
        }
        else {
          console.log('Success:', `add project name "${name}" to the wpleasefile.json`)
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
  ignoreExtension: function (cwd, extension, type) {
    if (type != 'plugin' && type != 'theme') {
      throw 'Undifined extension type.'
    }
    var file = path.resolve(`${cwd}/.gitignore`)
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
