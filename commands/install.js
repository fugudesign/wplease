#!/usr/bin/env node

'use strict'
var utils = require('../lib/utils')
var wp = require('wp-astro')
var fs = require('fs')
var path = require('path')
var Enquirer = require('enquirer')
var async = require('async')

var InitScript = require('./init')
var SyncScript = require('./sync')

// create a new prompt instance
var enquirer = new Enquirer()
enquirer.register('password', require('prompt-password'))
enquirer.register('confirm', require('prompt-confirm'))

// Command
function InstallCommand () {}

InstallCommand.prototype.run = function (env) {
  async.waterfall([
    
    /**
     * Check for the project name as param
     */
    function (callback) {
      var params = utils.cliCommandParams()
      if (params.length) {
        enquirer.answers.project = params[0]
        callback(null, enquirer.answers)
      } else {
        if (env.settings.name) {
          enquirer.answers.project = env.settings.name
          callback(null, enquirer.answers)
        } else {
          enquirer.ask({type: 'input', name: 'project', message: 'Project name', 'default': 'my-website'})
            .then(function (answers) {
              callback(null, answers)
            })
        }
      }
    },
    
    /**
     * INIT
     * Ask for run init command before install
     */
    function (inputs, callback) {
      enquirer.ask({type: 'confirm', name: 'init', message: 'Initialize project', 'default': false})
        .then(function (answers) {
          if (answers.init) {
            env.project_name = answers.project
            InitScript.run(env)
              .then((res) => {
                console.log('')
                callback(null, answers)
              })
              .catch((err) => {
                console.log(err)
                callback(null, answers)
              })
          } else {
            console.log('')
            callback(null, answers)
          }
        })
    },
    
    /**
     * DOWNLOAD
     * Get the last Wordpress version
     */
    function (inputs, callback) {
      try {
        utils.bot('Checking Wordpress...')
        var version = wp('core version')
        if (Boolean(version)) {
          enquirer.ask({type: 'confirm', name: 'override_wp', message: 'Override Wordpress', 'default': false})
            .then(function (answers) {
              if (answers.override_wp) {
                console.log('')
                installWordpress()
              } else {
                console.log('')
              }
              callback(null, answers)
            })
        } else {
          console.log('')
          installWordpress()
          callback(null, inputs)
        }
      } catch (err) {
        console.log('')
        installWordpress()
        callback(null, inputs)
      }
      
      function installWordpress () {
        utils.bot('Getting Wordpress...')
        wp('core download', {
          verbose: true,
          flags: {
            locale: env.settings.config.locale,
            force: true
          }
        })
      }
    },
    
    /**
     * DATABASE SETTINGS
     * Ask for database env.settings
     */
    function (inputs, callback) {
      try {
        utils.bot('Checking config...')
        var config = wp('config path')
        if (Boolean(config)) {
          inputs.config = true
          callback(null, inputs)
        } else {
          console.log('')
          createConfig()
        }
      } catch (err) {
        console.log('')
        createConfig()
      }
      
      function createConfig () {
        utils.bot('Defining database settings...')
        var project = inputs ? inputs.project : 'wp' + Math.random().toString(36).substr(2, 8)
        var prefix = project.substr(0, 4)
        var questions = [
          {type: 'input', name: 'dbname', message: 'Database name', 'default': project},
          {type: 'input', name: 'dbprefix', message: 'Database prefix', 'default': `${prefix}_`},
          {type: 'input', name: 'dbuser', message: 'Database user', 'default': 'root'},
          {type: 'password', name: 'dbpass', message: 'Database password?'},
        ]
        enquirer.ask(questions)
          .then(function (answers) {
            console.log('')
            if (answers) {
              callback(null, answers)
            }
          })
      }
    },
    
    /**
     * CONFIG
     * Generate wp-config.php
     */
    function (inputs, callback) {
      if (!inputs.config) {
        utils.bot('Creating config file...')
        wp('config create', {
          verbose: true,
          input: `
          define('WP_DEBUG', ${env.settings.config.debug});
          define('WP_POST_REVISIONS', ${env.settings.config.post_revisions});
          define('DISABLE_WP_CRON', ${env.settings.config.disable_cron});
          define('DISALLOW_FILE_EDIT', ${env.settings.config.disallow_file_edit});
        `,
          flags: {
            'dbname': inputs.dbname,
            'dbprefix': inputs.dbprefix,
            'dbuser': inputs.dbuser,
            'dbpass': inputs.dbpass,
            'skip-check': true,
            'extra-php': true
          }
        })
      }
      callback(null, inputs)
    },
    
    /**
     * DATABASE
     * Ask for create, keep or override the database
     */
    function (inputs, callback) {
      utils.bot('Managing database...')
      var dbCheck = wp('db check', {async: true})
      dbCheck.on('close', function (code) {
        // If the database already exists
        if (code === 0) {
          enquirer.ask([
            {type: 'confirm', name: 'override_db', message: 'Replace existant database', 'default': false}
          ])
            .then(function (answers) {
              // Override the database if user ask yes
              if (answers.override_db) {
                wp('db drop', {flags: {'yes': true}})
                createDB(answers)
              } else {
                answers.keep_db = true
                console.log('')
                callback(null, answers)
              }
            })
        }
        // If the data base doen't exist
        else {
          createDB(inputs)
        }
        
        function createDB (inputs) {
          var db = wp('db create', {async: true, verbose: true})
          db.on('close', function (code, signal) {
            if (code === 0) {
              callback(null, inputs)
            }
          })
        }
      })
    },
    
    /**
     * WORDPRESS SETTINGS
     * Ask for site and admin env.settings
     */
    function (inputs, callback) {
      inputs.need_install = false
      if (!inputs.keep_db) {
        defineSiteSettings()
      } else {
        var installed = wp('core is-installed')
        if (installed) {
          callback(null, inputs)
        } else {
          inputs.need_install = true
          defineSiteSettings()
        }
      }
      
      function defineSiteSettings () {
        utils.bot('Defining site and admin settings...')
        var project = inputs.project
        var uniqPass = Math.random().toString(36).substr(2, 8)
        var title = project.charAt(0).toUpperCase() + project.slice(1)
        var questions = [
          {type: 'input', name: 'url', message: 'Site url', 'default': `${project}.loc`},
          {type: 'input', name: 'title', message: 'Site title', 'default': title},
          {type: 'input', name: 'admin_user', message: 'Admin login', 'default': 'admin'},
          {type: 'input', name: 'admin_email', message: 'Admin email', 'default': `admin@${project}.com`},
          {type: 'password', name: 'admin_password', message: 'Admin password', 'default': uniqPass},
        ]
        enquirer.ask(questions)
          .then(function (answers) {
            console.log('')
            
            if (answers) {
              callback(null, answers)
            }
          })
      }
    },
    
    /**
     * INSTALL
     * Run the Wordpress install
     */
    function (inputs, callback) {
      if (inputs.need_install || !inputs.keep_db) {
        utils.bot('Installing Wordpress...')
        wp('core install', {
          verbose: true,
          flags: {
            'url': inputs.url,
            'title': inputs.title,
            'admin_user': inputs.admin_user,
            'admin_password': inputs.admin_password,
            'admin_email': inputs.admin_email
          }
        })
        callback(null, inputs)
      } else {
        callback(null, inputs)
      }
    },
  
    /**
     * PLUGINS
     * Install plugins from the list in local
     * or default wplease.json file
     */
    function (inputs, callback) {
      SyncScript.run(env, 'plugins')
        .then(res => {
          callback(null, inputs)
        })
    },
    
    /**
     * CUSTOM THEME
     * Ask for a custom theme creation or usage,
     * add its rule in gitignore file
     * and ask for its activatation
     */
    function (inputs, callback) {
      utils.bot('Custom theme...')
      var theme = utils.hasCustomTheme(env)
      if (theme) {
        inputs.theme_slug = theme
        activateTheme(inputs)
      } else {
        // Ask for generate theme
        enquirer.ask([
          {type: 'confirm', name: 'generate_theme', message: 'Custom theme'}
        ])
          .then(function (answers) {
            if (answers.generate_theme) {
        
              // Ask for the theme slug
              enquirer.ask([{type: 'input', name: 'theme_slug', message: 'Theme slug', 'default': inputs.project}])
                .then(function (answers) {
                  activateTheme(answers)
                })
            } else {
              console.log('')
              callback(null, answers)
            }
          })
      }
      
      function activateTheme (answers) {
        // Check if the theme already exists
        fs.exists(`${env.cwd}/wp-content/themes/${answers.theme_slug}/`, function(exists) {
          if (exists) {
            console.log('Warning:', `theme ${answers.theme_slug} already exists.`)
  
            // Ask for activate the theme
            enquirer.ask([{type: 'confirm', name: 'activate_theme', message: 'Activate theme'}])
              .then(function (answers) {
                if (answers.activate_theme) {
                  var activate = wp(`theme activate ${answers.theme_slug}`, {async: true, verbose: true, flags:{'skip-plugins': true, 'skip-themes': true}})
                  activate.on('close', function (code, signal) {
          
                    // Add custom theme to wpleasefile
                    utils.addThemeToJson(env, answers.theme_slug, true)
                      .then(function (res) {
              
                        // Autoinject ungitignore for theme
                        utils.ignoreExtension(env, answers.theme_slug, 'theme')
              
                        callback(null, answers)
                      })
                  })
                }
              })
          } else {
            var name = answers.theme_slug.charAt(0).toUpperCase() + answers.theme_slug.slice(1)
            enquirer.ask([
              {type: 'input', name: 'theme_name', message: 'Theme name', 'default': name},
              {type: 'input', name: 'theme_author', message: 'Theme author'},
              {type: 'input', name: 'theme_author_uri', message: 'Theme author URI'},
              {type: 'confirm', name: 'theme_sassify', message: 'Sassify theme'},
              {type: 'confirm', name: 'theme_activate', message: 'Activate theme'}
            ])
              .then(function (answers) {
                if (answers) {
                  console.log('')
        
                  // Add custom theme to wpleasefile
                  utils.addThemeToJson(env, answers.theme_slug, true)
                    .then(res => {
            
                      // Autoinject ungitignore for theme
                      utils.ignoreExtension(env, answers.theme_slug, 'theme')
            
                      // Generate new theme
                      wp(`scaffold _s ${answers.theme_slug}`, {
                        verbose: true,
                        flags: {
                          'theme_name': answers.theme_name,
                          'author': answers.theme_author,
                          'author_uri': answers.theme_author_uri,
                          'sassify': answers.theme_sassify,
                          'activate': answers.theme_activate,
                          'skip-plugins': true,
                          'skip-themes': true
                        }
                      })
                      callback(null, answers)
                    })
                }
              })
          }
        });
        
      }
    },
    
    /**
     * CUSTOM PLUGIN
     * Ask for a custom plugin creation or usage,
     * add its rule in gitignore file
     * and ask for its activatation
     */
    function (inputs, callback) {
      utils.bot('Custom plugin...')
      var plugin = utils.hasCustomPlugin(env)
      if (plugin) {
        inputs.plugin_slug = plugin
        activatePlugin(inputs)
      } else {
        // Ask for generate plugin
        enquirer.ask([
          {type: 'confirm', name: 'generate_plugin', message: 'Custom plugin'}
        ])
          .then(function (answers) {
            if (answers.generate_plugin) {
              
              // Ask for the plugin slug
              enquirer.ask([{type: 'input', name: 'plugin_slug', message: 'Plugin slug', 'default': inputs.project}])
                .then(function (answers) {
                  activatePlugin(answers)
                })
            } else {
              console.log('')
              callback(null, answers)
            }
          })
      }
      
      function activatePlugin (answers) {
        // Check if the plugin already exists
        fs.exists(`${env.cwd}/wp-content/plugins/${answers.plugin_slug}/`, function(exists) {
          if (exists) {
            console.log('Warning:', `plugin ${answers.plugin_slug} already exists.`)
        
            // Ask for activate the plugin
            enquirer.ask([{type: 'confirm', name: 'activate_plugin', message: 'Activate plugin'}])
              .then(function (answers) {
                if (answers.activate_plugin) {
                  var activate = wp(`plugin activate ${answers.plugin_slug}`, {async: true, verbose: true, flags: {'skip-plugins': true, 'skip-themes': true}})
                  activate.on('close', function (code, signal) {
                
                    // Add custom plugin to wpleasefile
                    utils.addPluginToJson(env, answers.plugin_slug, true)
                      .then(function (res) {
                        // Autoinject ungitignore for plugin
                        utils.ignoreExtension(env, answers.plugin_slug, 'plugin')
                    
                        callback(null, answers)
                      })
                  })
                }
              })
          }
          // If theme not exists, ask for theme info to generate it
          else {
            var name = answers.plugin_slug.charAt(0).toUpperCase() + answers.plugin_slug.slice(1)
            enquirer.ask([
              {type: 'input', name: 'plugin_name', message: 'Plugin name', 'default': name},
              {
                type: 'input',
                name: 'plugin_description',
                message: 'Plugin description',
                'default': `Custom plugin for ${name}`
              },
              {type: 'input', name: 'plugin_author', message: 'Plugin author'},
              {type: 'input', name: 'plugin_author_uri', message: 'Plugin author URI'},
              {type: 'confirm', name: 'plugin_activate', message: 'Activate plugin'}
            ])
              .then(function (answers) {
                if (answers) {
                  console.log('')
              
                  // Add custom plugin to wpleasefile
                  utils.addPluginToJson(env, answers.plugin_slug, true)
                    .then(function (res) {
                  
                      // Autoinject ungitignore for plugin
                      utils.ignoreExtension(env, answers.plugin_slug, 'plugin')
                  
                      // Generate new theme
                      wp(`scaffold plugin ${answers.plugin_slug}`, {
                        verbose: true,
                        flags: {
                          'plugin_name': answers.plugin_name,
                          'plugin_description': answers.plugin_description,
                          'plugin_author': answers.plugin_author,
                          'plugin_author_uri': answers.plugin_author_uri,
                          'activate': answers.plugin_activate,
                          'skip-tests': true,
                          'skip-plugins': true,
                          'skip-themes': true
                        }
                      })
                      callback(null, answers)
                    })
                }
              })
          }
        })
      }
    },
    
    /**
     * THEMES
     * Install themes from the list in local
     * or default wplease.json file
     */
    function (inputs, callback) {
      SyncScript.run(env, 'themes')
        .then(res => {
          callback(null, inputs)
        })
    },
    
    /**
     * CLEAN
     * Clean the default Wordpress install
     * (plugins, themes and posts)
     */
    function (inputs, callback) {
      if (!inputs.keep_db) {
        utils.bot('Cleaning default install...')
        // Remove default posts
        wp('post delete 1', {verbose: true, flags: {force: true}})
        wp('post delete 2', {verbose: true, flags: {force: true}})
      }
      callback(null, inputs)
    },
    
    /**
     * OPTIONS
     * Create a homepage and create options from the list
     * in local or default wplease.json file
     */
    function (inputs, callback) {
      utils.bot('Configure options...')
      wp('post create', {
        flags: {
          post_type: 'page',
          post_title: 'Home',
          post_author: 1,
          post_status: 'publish',
          'skip-plugins': true,
          'skip-themes': true
        }
      })
      if (env.settings.options) {
        Object.entries(env.settings.options).forEach(function (option) {
          wp(`option update ${option[0]} "${option[1]}"`, {verbose: true, flags: {'skip-plugins': true, 'skip-themes': true}})
        })
      }
      callback(null, inputs)
    },
    
    /**
     * REWRITE
     * Activate the Wordpress rewriting
     */
    function (inputs, callback) {
      utils.bot('Activating permalink structure...')
      wp('rewrite structure "/%postname%/"', {verbose: true, flags: {hard: true, 'skip-plugins': true, 'skip-themes': true}})
      callback(null, inputs)
    },
    
    /**
     * SUMMARY
     * Display the install summary with creditentials
     */
    function (inputs, callback) {
      utils.bot('Congratulations!')
      console.log('Your site is ready for development.')
      if (inputs.url) {
        console.log(`Access: http://${inputs.url}`)
        console.log(`Login: ${inputs.admin_user}`)
        console.log(`Password: ${inputs.admin_password}`)
      }
      console.log('')
    }
  
  ])
}

var inst = new InstallCommand()
module.exports = inst
