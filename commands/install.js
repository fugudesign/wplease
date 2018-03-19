#!/usr/bin/env node

'use strict'
var utils = require('../lib/utils')
var wp = require('wp-astro')
var Enquirer = require('enquirer')
var async = require('async')

var InitScript = require('./init')

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
        try {
          wp('core is-installed')
          callback(null, inputs)
        } catch (err) {
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
     * or default wpleasefile.json file
     */
    function (inputs, callback) {
      utils.bot('Installing plugins...')
      env.settings.plugins.forEach(function (plugin) {
        wp(`plugin install ${plugin}`, {verbose: true, flags: {activate: true}})
      })
      callback(null, inputs)
    },
    
    /**
     * CUSTOM THEME
     * Ask for a custom theme creation or usage,
     * add its rule in gitignore file
     * and ask for its activatation
     */
    function (inputs, callback) {
      utils.bot('Custom theme...')
      
      // Ask for generate theme
      enquirer.ask([
        {type: 'confirm', name: 'generate_plugin', message: 'Custom theme'}
      ])
        .then(function (answers) {
          if (answers.generate_plugin) {
            
            // Ask for the theme slug
            enquirer.ask([{type: 'input', name: 'slug', message: 'Theme slug', 'default': inputs.project}])
              .then(function (answers) {
                
                // Check if the theme already exists
                var exists = wp(`theme is-installed ${answers.slug}`, {async: true})
                exists.on('close', function (code, signal) {
                  if (code === 0) {
                    console.log('Warning:', `theme ${answers.slug} already exists.`)
                    
                    // Ask for activate the theme
                    enquirer.ask([{type: 'confirm', name: 'activate_theme', message: 'Activate theme'}])
                      .then(function (answers) {
                        if (answers.activate_theme) {
                          var activate = wp(`theme activate ${answers.slug}`, {async: true, verbose: true})
                          activate.on('close', function (code, signal) {
                            
                            // Autoinject ungitignore for theme
                            utils.ignoreExtension(env.cwd, answers.slug, 'theme')
                            
                            callback(null, answers)
                          })
                        }
                      })
                  }
                  // If theme not exists, ask for theme info to generate it
                  else {
                    var name = answers.slug.charAt(0).toUpperCase() + answers.slug.slice(1)
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
                          
                          // Autoinject ungitignore for theme
                          utils.ignoreExtension(env.cwd, answers.slug, 'theme')
                          
                          // Generate new theme
                          wp(`scaffold _s ${answers.slug}`, {
                            verbose: true,
                            flags: {
                              'theme_name': answers.theme_name,
                              'author': answers.theme_author,
                              'author_uri': answers.theme_author_uri,
                              'sassify': answers.theme_sassify,
                              'activate': answers.theme_activate
                            }
                          })
                          callback(null, answers)
                        }
                      })
                  }
                })
              })
          } else {
            console.log('')
            callback(null, answers)
          }
        })
    },
    
    /**
     * CUSTOM PLUGIN
     * Ask for a custom plugin creation or usage,
     * add its rule in gitignore file
     * and ask for its activatation
     */
    function (inputs, callback) {
      utils.bot('Custom plugin...')
      
      // Ask for generate plugin
      enquirer.ask([
        {type: 'confirm', name: 'generate_plugin', message: 'Custom plugin'}
      ])
        .then(function (answers) {
          if (answers.generate_plugin) {
            
            // Ask for the plugin slug
            enquirer.ask([{type: 'input', name: 'slug', message: 'Plugin slug', 'default': inputs.project}])
              .then(function (answers) {
                
                // Check if the plugin already exists
                var exists = wp(`plugin is-installed ${answers.slug}`, {async: true})
                exists.on('close', function (code, signal) {
                  if (code === 0) {
                    console.log('Warning:', `plugin ${answers.slug} already exists.`)
                    
                    // Ask for activate the plugin
                    enquirer.ask([{type: 'confirm', name: 'activate_plugin', message: 'Activate plugin'}])
                      .then(function (answers) {
                        if (answers.activate_plugin) {
                          var activate = wp(`plugin activate ${answers.slug}`, {async: true, verbose: true})
                          activate.on('close', function (code, signal) {
                            
                            // Autoinject ungitignore for plugin
                            utils.ignoreExtension(env.cwd, answers.slug, 'plugin')
                            
                            callback(null, answers)
                          })
                        }
                      })
                  }
                  // If theme not exists, ask for theme info to generate it
                  else {
                    var name = answers.slug.charAt(0).toUpperCase() + answers.slug.slice(1)
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
                      {type: 'confirm', name: 'plugin_activate', message: 'Activate theme'}
                    ])
                      .then(function (answers) {
                        if (answers) {
                          console.log('')
                          
                          // Autoinject ungitignore for plugin
                          utils.ignoreExtension(env.cwd, answers.slug, 'plugin')
                          
                          // Generate new theme
                          wp(`scaffold plugin ${answers.slug}`, {
                            verbose: true,
                            flags: {
                              'plugin_name': answers.plugin_name,
                              'plugin_description': answers.plugin_description,
                              'plugin_author': answers.plugin_author,
                              'plugin_author_uri': answers.plugin_author_uri,
                              'activate': answers.plugin_activate,
                              'skip-tests': true
                            }
                          })
                          callback(null, answers)
                        }
                      })
                  }
                })
              })
          } else {
            console.log('')
            callback(null, answers)
          }
        })
    },
    
    /**
     * THEMES
     * Install themes from the list in local
     * or default wpleasefile.json file
     */
    function (inputs, callback) {
      if (env.settings.themes.length) {
        utils.bot('Installing themes...')
        env.settings.themes.forEach(function (theme) {
          wp(`theme install ${theme}`, {verbose: true})
        })
      }
      callback(null, inputs)
    },
    
    /**
     * CLEAN
     * Clean the default Wordpress install
     * (plugins, themes and posts)
     */
    function (inputs, callback) {
      if (!inputs.keep_db) {
        utils.bot('Cleaning default install...')
        // Remove default plugins
        wp('plugin uninstall hello.php', {verbose: true})
        wp('plugin uninstall akismet', {verbose: true})
        // Remove default themes
        if (inputs.generate_theme) {
          var themes = wp('theme list', {
            flags: {
              'status': 'inactive',
              'format': 'json'
            }
          })
          console.log(themes)
        }
        // Remove default posts
        wp('post delete 1', {verbose: true, flags: {force: true}})
        wp('post delete 2', {verbose: true, flags: {force: true}})
      }
      callback(null, inputs)
    },
    
    /**
     * OPTIONS
     * Create a homepage and create options from the list
     * in local or default wpleasefile.json file
     */
    function (inputs, callback) {
      utils.bot('Configure options...')
      wp('post create', {
        flags: {
          post_type: 'page',
          post_title: 'Home',
          post_author: 1,
          post_status: 'publish'
        }
      })
      if (env.settings.options) {
        Object.entries(env.settings.options).forEach(function (option) {
          wp(`option update ${option[0]} "${option[1]}"`, {verbose: true})
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
      wp('rewrite structure "/%postname%/"', {verbose: true, flags: {hard: true}})
      callback(null, inputs)
    },
    
    /**
     * SUMMARY
     * Display the install summary with creditentials
     */
    function (inputs, callback) {
      utils.bot('Congratulations!')
      console.log(`Access: http://${inputs.url}`)
      console.log(`Login: ${inputs.admin_user}`)
      console.log(`Password: ${inputs.admin_password}`)
      console.log('')
    }
  
  ])
}

var inst = new InstallCommand()
module.exports = inst
