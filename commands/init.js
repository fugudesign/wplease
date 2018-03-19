#!/usr/bin/env node

'use strict'
var utils = require('../lib/utils')
var fs = require('fs')
var path = require('path')
var Enquirer = require('enquirer')
var each = require('sync-each')
var {COPYFILE_EXCL} = fs.constants

// create a new prompt instance
var enquirer = new Enquirer()
enquirer.register('confirm', require('prompt-confirm'))

// Command
function InitCommand () {}

InitCommand.prototype.run = function (env) {
  return new Promise((resolve, reject) => {
    
    utils.bot('Generating init files in project...')
    
    // Generate init files in project
    // template files in init dir must begin by an underscore
    // (ie. _index.html)
    var files = fs.readdirSync(path.resolve(`${path.dirname(__dirname)}/init/`))
    var i = 0
    each(files,
      function (file, next) {
        i++
        var template = path.resolve(`${path.dirname(__dirname)}/init/${file}`)
        var filename = file.substr(1)
        var copy = path.resolve(`${env.cwd}/${filename}`)
        
        // If file already exits, ask for override
        if (fs.existsSync(copy)) {
          enquirer.ask({
            type: 'confirm',
            name: `override_init_file_${i}`,
            message: `Override existing ${filename}`,
            default: false
          })
            .then(function (answers) {
              if (answers[`override_init_file_${i}`]) {
                copyInitFile(template, copy, filename, next)
                if (files.length === i) {
                  resolve(true)
                }
              } else {
                console.log(`Success: existing ${filename} kept in project.`)
                console.log('')
                if (files.length === i) {
                  resolve(true)
                }
                next()
              }
            })
        } else {
          copyInitFile(template, copy, filename, next)
          if (files.length === i) {
            resolve(true)
          }
        }
      },
      function (err, transformedItems) {
        if (err) {
          console.log(err)
          reject(err)
        }
      }
    )
    
    // Function to copy template file to destination
    function copyInitFile (template, copy, filename, next) {
      fs.copyFile(template, copy, function (err) {
        if (err) console.log(err)
        else {
          console.log(`Success: ${filename} was generated in project.`)
          console.log('')
        }
        next()
      })
    }
  })
  
}

var inst = new InitCommand()
module.exports = inst
