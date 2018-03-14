# WPlease

Automate Wordpress generation and development from your dev repository.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

* [Node JS](https://nodejs.org/)
* [WP-CLI](https://wp-cli.org/)

### Installing

You need to install this module as a global module.

```
npm install -g wplease
```

## Usage

Create your project directory.
```
mkdir my-project
cd my-project
```

### Basic install

```
wplease install
```

### Advanced install


```
wplease init
```
This command create into your project: 
- The `wpleasefile.js` to customize your Wordpress installation 
- The `.gitignore` to ignore the whole wordpress code.

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

Then you can run your custom install.

```
wplease install
```

The script will ask you about the database and site creditentials, and your Wordpress will be quickly ready to use.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details