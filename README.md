# WPlease

![GitHub package version](https://img.shields.io/github/package-json/v/badges/shields.svg?style=flat-square)
![npm](https://img.shields.io/npm/v/npm.svg?style=flat-square)
![node](https://img.shields.io/node/v/passport.svg?style=flat-square)
[![GitHub license](https://img.shields.io/github/license/fugudesign/wplease.svg?style=flat-square)](https://github.com/fugudesign/wplease/blob/master/LICENSE)


## Features

WPlease is a toolkit for Wordpress development that allow you to:

> Build a Wordpress working instance from scratch in on command line

> Build a preconfigured Wordpress working instance from your github repo that contains only your pecific code

> Generate a custom theme and plugin on install and auto gitignore it

> Remove all gitignored files from the project in on command line

## Getting Started

To build a Wordpress instance with WPlease, you must have a Wordpress operating environment and some additional libraries.

### Prerequisites

* Apache web server (2 recommended)
* PHP 5.6 or higher (7.0 recommended)
* MySQL server 5.x with a database user (or MariaDB)
* [Node JS](https://nodejs.org/)
* [WP-CLI](https://wp-cli.org/)

### Caution
> For existing repos, please backup your files and database before using WPlease.

### Installing

You should install this module as a global module.

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
This command suggests you to create or override thoses files into your project: 
- The `wpleasefile.json` file to customize your Wordpress installation 
- The `.gitignore` file to ignore the whole wordpress code.
- The `.gitattributes` file.
- The `.editorconfig` file.

> **Warning:**
> Since version 1.0.10, the wpleasefile.js became wpleasefile.json. Please run the init script to generate the new file, then update your config.

### Customize your Wordpress config

Then edit the `wpleasefile.json` to customize your Wordpress install.
For example, your can simply specify a custom [plugins](https://wordpress.org/plugins/) list:
```json
{
  "themes": [
    "@my-project"
  ],
  "plugins": [
    "wp-edit",
    "maintenance-switch",
    "@my-project"
  ]
}
```
> **Note:** 
> Custom themes and plugins need to be prefixed by "@". ("custom" means that the extension does not exist on the Wordpress repository)

### Build Wordpress in your project

Then you can run your custom install.

```
wplease install
```

## Script prompts

During installing, the script will ask you about several informations like the database and site creditentials. Your Wordpress instance will be quickly ready to use.

```
...

Defining site and admin settings...

? Site url            my-website.loc
? Site title          My Website
? Admin login         admin
? Admin email         admin@my-website.com
? Admin password      [hidden]

...
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details
