#!/usr/bin/env node

'use strict';
var utils = require('../lib/utils');
var wp = require('wp-astro');
var Enquirer = require('enquirer');
var async = require('async');

// create a new prompt instance
var enquirer = new Enquirer();
enquirer.register('password', require('prompt-password'));
enquirer.register('confirm', require('prompt-confirm'));

// Command
function installCommand() {}

installCommand.prototype.run = function(env) {
  var settings = utils.getSettings(env.configPath);

  async.waterfall([

    function (callback) {
      utils.bot('Getting Wordpress...');
      wp('core download', { verbose: true,
        flags: {
          locale: settings.config.locale, 
          force: true
        }
      });
      callback(null);
    },

    function (callback) {
      utils.bot('Defining Wordpress settings...');
      enquirer.ask({type: 'input', name: 'project', message: 'Project name', 'default': 'my-website'})
      .then(function(answers) {
        var project = answers ? answers.project : 'wp' + Math.random().toString(36).substr(2, 8);
        var uniqPass = Math.random().toString(36).substr(2, 8);
        var prefix = project.substr(0, 4);
        var title = project.charAt(0).toUpperCase() + project.slice(1);
        var questions = [
          {type: 'input', name: 'dbname', message: 'Database name', 'default': project},
          {type: 'input', name: 'dbprefix', message: 'Database prefix', 'default': `${prefix}_`},
          {type: 'input', name: 'dbuser', message: 'Database user', 'default': 'root'},
          {type: 'password', name: 'dbpass', message: 'Database password?'},
          {type: 'input', name: 'url', message: 'Site url', 'default': `${project}.loc`},
          {type: 'input', name: 'title', message: 'Site title', 'default': title},
          {type: 'input', name: 'admin_user', message: 'Admin login', 'default': 'admin'},
          {type: 'input', name: 'admin_email', message: 'Admin email', 'default': `admin@${project}.com`},
          {type: 'password', name: 'admin_password', message: 'Admin password', 'default': uniqPass},
        ];
        enquirer.ask(questions)
        .then(function(answers) {
          console.log('');
          
          if (answers) {
            callback(null, answers);
          }
        });
      });
    },

    function(inputs, callback) {
      utils.bot('Creating config file...');
      wp('config create', {verbose: true,
        input: `
          define('WP_DEBUG', false);
          define('WP_POST_REVISIONS', ${settings.config.revisions});
          define('DISABLE_WP_CRON', false);
          define('DISALLOW_FILE_EDIT', true);
        `,
        flags: {
          'dbname': inputs.dbname,
          'dbprefix': inputs.dbprefix,
          'dbuser': inputs.dbuser,
          'dbpass': inputs.dbpass,
          'skip-check': true,
          'extra-php': true
        }
      });
      callback(null, inputs);
    },

    function (inputs, callback) {
      utils.bot('Creating database...');
      var dbCheck = wp('db check', {async: true});
      dbCheck.on('close', function(code, signal) {
        // If the database already exists
        if (code === 0) {
          enquirer.ask([
            {type: 'confirm', name: 'override_db', message: 'Replace existant database', 'default': false}
          ])
          .then(function(answers) {
            // Override the database if user ask yes
            if (answers.override_db) {
              wp('db drop', {flags: {'yes': true}});
              createDB();
            } else {
              console.log('');
              callback(null, inputs);
            }
          });
        }
        // If the data base doen't exist 
        else {
          createDB();
        }

        function createDB() {
          var db = wp('db create', {async: true, verbose: true});
          db.on('close', function(code, signal){
            if (code === 0) {
              callback(null, inputs);
            }
          });
        }
      });
    },

    function (inputs, callback) {
      utils.bot('Installing Wordpress...');
      wp('core install', {verbose: true,
        flags: {
          'url': inputs.url,
          'title': inputs.title,
          'admin_user': inputs.admin_user,
          'admin_password': inputs.admin_password,
          'admin_email': inputs.admin_email
        }
      });
      callback(null, inputs);
    },

    function (inputs, callback) {
      utils.bot('Installing plugins...');
      settings.plugins.forEach(function (plugin) {
        wp(`plugin install ${plugin}`, {verbose: true, flags: {activate: true}});
      });
      callback(null, inputs);
    },

    function (inputs, callback) {
      utils.bot('Custom theme...');
      enquirer.ask([
        {type: 'confirm', name: 'generate_theme', message: 'Generate a custom theme'}
      ])
      .then(function(answers) {
        if (answers.generate_theme) {
          enquirer.ask([
            {type: 'input', name: 'slug', message: 'Theme slug', 'default': inputs.project},
            {type: 'input', name: 'name', message: 'Theme name', 'default': inputs.title},
            {type: 'input', name: 'author', message: 'Theme author'},
            {type: 'input', name: 'author_uri', message: 'Theme author URI'},
            {type: 'confirm', name: 'sassify', message: 'Sassify theme'},
            {type: 'confirm', name: 'activate', message: 'Activate theme'}
          ])
          .then(function(answers) {
            if (answers) {
              console.log('');
              
              // Autoinject ungitignore for theme and plugin
              utils.addThemeToGitignore(env.cwd, answers.slug);

              wp(`scaffold _s ${answers.slug}`, {verbose: true,
                flags: {
                  'theme_name': answers.name,
                  'author': answers.author,
                  'author_uri': answers.author_uri,
                  'sassify': answers.sassify,
                  'activate': answers.activate
                }
              });
              callback(null, answers);
            }
          });
        } else {
          callback(null, answers);
        }
      });
    },

    function (inputs, callback) {
      if (settings.themes.length) {
        utils.bot('Installing themes...');
        settings.themes.forEach(function(theme){
          wp(`theme install ${theme}`, {verbose: true});
        });
      }
      callback(null, inputs);
    },

    function (inputs, callback) {
      utils.bot('Cleaning default install...');
      // Remove default plugins
      wp('plugin uninstall hello.php', {verbose: true});
      wp('plugin uninstall akismet', {verbose: true});
      // Remove default themes
      if (inputs.generate_theme) {
        wp('theme delete twentyfifteen', {verbose: true});
        wp('theme delete twentysixteen', {verbose: true});
        wp('theme delete twentyseventeen', {verbose: true});
      }
      // Remove default posts
      wp('post delete 1', {verbose: true, flags: { force: true }})
      wp('post delete 2', {verbose: true, flags: { force: true }})
      callback(null, inputs);
    },

    function (inputs, callback) {
      utils.bot('Configure options...');
      wp('post create', {
        flags: {
          post_type: 'page',
          post_title: 'Home',
          post_author: 1
        }
      });
      if (settings.options) {
        Object.entries(settings.options).forEach(function(option){
          wp(`option update ${option[0]} "${option[1]}"`, {verbose: true});
        });
      }
      callback(null, inputs);
    },

    function (inputs, callback) {
      utils.bot('Activating premalink structure...');
      wp('rewrite structure "/%postname%/"', {verbose: true, flags: {hard: true}});
      callback(null, inputs);
    },

    function (inputs, callback) {
      utils.bot('Congratulations!');
      console.log(`Access: http://${inputs.url}`);
      console.log(`Login: ${inputs.admin_user}`);
      console.log(`Password: ${inputs.admin_password}`);
      console.log('');
    }

  ]);
}

var inst = new installCommand();
module.exports = inst;
