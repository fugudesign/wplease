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

> Update (add/remove) plugins and themes from the lists in wplease.json in one command line

> Add or remove a theme or a plugin from files and from wplease.json in one command line

> Remove all gitignored files from the project in on command line

## Getting Started

To build a Wordpress instance with WPlease, you must have a Wordpress operating environment and some additional libraries.

### Prerequisites

* [Apache](https://httpd.apache.org/download.cgi) web server
* [MySQL](https://dev.mysql.com/downloads/installer/) server (or MariaDB)
* [PHP](http://php.net/manual/en/install.php) 5.6 or higher (7.0 recommended)
* [Node JS](https://nodejs.org/)
* [WP-CLI](https://wp-cli.org/)

### Caution
> For existing repos, please backup your files and database before using WPlease.

### Installing

You should install this module as a global module.

```bash
npm install -g wplease
```

### Usage

Create a basic Wordpress install from scratch.
```bash
mkdir my-project
cd my-project
wplease install
```

## Advanced usage

### Initialize your project

```bash
wplease init
```
This command suggests you to create or override thoses files into your project: 
- The `wplease.json` file to customize your Wordpress installation 
- The `.gitignore` file to ignore the whole wordpress code.
- The `.gitattributes` file.
- The `.editorconfig` file.

> **Warning:**
> Since version 1.0.10, wpleasefile.js and wpleasefile.json files became wplease.json. Please run the init script to generate the new file, then update your config.

### Customize your Wordpress config

Then edit the `wplease.json` to customize your Wordpress install.
For example, your can simply specify a custom [plugins](https://wordpress.org/plugins/) list:
```json
{
  "name": "my-project",
  "config": {
    "locale": "fr_FR",
    "debug": false,
    "post_revisions": 5,
    "disable_cron": false,
    "disallow_file_edit": true
  },
  "themes": [
    "@my-project"
  ],
  "plugins": [
    "wp-edit",
    "maintenance-switch",
    "@my-project"
  ],
  "options": {
    "timezone_string": "Europe/Paris",
    "show_on_front": "page",
    "page_on_front": 3
  }
}
```
> **Note:** 
> Custom themes and plugins need to be prefixed by "@". "Custom" means that the extension does not exist on the Wordpress repository. The `wplease install` command add it on theme or plugin generation but alternatively you can fill it manually in your wplease.json.

### Build Wordpress in your project

Then you can run your custom install.

```bash
wplease install
```

> **Tip:**
> You can directly add your project name to skip prompts. `wplease install my-project`

### Add or remove a Wordpress theme or plugin

You can specify a type of extension and the extension name.

```bash
wplease add plugin user-role-editor
```

```bash
wplease remove theme origin
```

> **Tip:** 
> You simply can call the short command like `wplease add` or `wplease remove` and the script ask your for the extension type and name.

### Sync your Wordpress themes and plugins

```bash
wplease sync
```

This command suggests you to synchronize your plugins and themes from your wplease.json lists.

```bash
 ? What to sync
 ❯◉ all
  ◯ plugins
  ◯ themes
```

> **Tip:**
> You can directly add the sync type to skip prompts. `wplease sync plugins`

## Script prompts

During installing, the script will ask you about several informations like the database and site creditentials. Your Wordpress instance will be quickly ready to use.

```bash
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
