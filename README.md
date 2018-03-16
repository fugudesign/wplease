# WPlease

![GitHub package version](https://img.shields.io/github/package-json/v/badges/shields.svg?style=flat-square)
![npm](https://img.shields.io/npm/v/npm.svg?style=flat-square)
![node](https://img.shields.io/node/v/passport.svg?style=flat-square)
[![GitHub license](https://img.shields.io/github/license/fugudesign/wplease.svg?style=flat-square)](https://github.com/fugudesign/wplease/blob/master/LICENSE)


## Features

WPlease is a toolkit for Wordpress development that allow you to:

> Build a Wordpress working instance from scratch in on command line

> Build a preconfigured Wordpress working instance from your github repo and only keep your pecific code

> Remove all Wordpress files except your specific code

> Generate a custom theme and plugin on install and autoignore it

## Getting Started

To build a Wordpress instance with WPlease, you must have a Wordpress operating environment and some additional libraries.

### Prerequisites

* Apache web server (2 recommended)
* PHP 5.6 or higher (7.0 recommended)
* MySQL server 5.x with a database user (or MariaDB)
* [Node JS](https://nodejs.org/)
* [WP-CLI](https://wp-cli.org/)

### Caution
> For existant repo please backup your files and database before using WPlease.

### Installing

You need to install this module as a global module.

```
npm install -g wplease
```

### Usage

Create a basic Wordpress install from scratch.
```
mkdir my-project
cd my-project
wplease install
```

## Advanced usage

### Initialize your project

```
wplease init
```
This command create into your project: 
- The `wpleasefile.js` to customize your Wordpress installation 
- The `.gitignore` to ignore the whole wordpress code.

### Customize your Wordpress config

Then edit the `wpleasefile.js` to customize your Wordpress install.
For example, your can simply specify a custom [plugins](https://wordpress.org/plugins/) list:
```javascript
module.exports = {
  'plugins': [
    'wp-edit',
    'maintenance-switch'
  ]
};
```

### Build Wordpress in your project

Then you can run your custom install.

```
wplease install
```

## Script prompts

During installing, the script will ask you about the database and site creditentials. Your Wordpress instance will be quickly ready to use.

```
...

Defining Wordpress settings...

? Project name        my-website
? Database name       mywebsite
? Database prefix     wp_
? Database user       root
? Database password   [hidden]
? Site url            my-website.loc
? Site title          My Website
? Admin login         admin
? Admin email         admin@my-website.com
? Admin password      [hidden]

...
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details