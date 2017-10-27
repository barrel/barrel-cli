# @barrelny/cli

This CLI provides development, build and deployment tasks for Shopify projects. The tool is designed to work with Wordpress projects too but currently it has not been tested properly with Wordpress. The tool enforces a Webpack-based development environment for bundling of styles and scripts.

### Table of Contents
1. Install
1. Dependencies
2. API

### Install
```bash
npm i barrel-cli -D
```
> If you're using any plugins or transforms in your ```postcss.config``` or ```.babelrc```, please install these too. The CLI installs the following packages for you:
- transform-object-rest-spread (babelrc)
- transform-object-assign (babelrc)
- postcss-import (postcss)
- postcss-inline-svg (postcss)
- postcss-color-function (postcss)
- autoprefixer (postcss)
- postcss-extend (postcss)
- precss (postcss)

## Dependencies
This CLI tool requires the following components:

1. A Shopify `config.yml` (in the root directory or the ```<root>/dist``` directory). This yml file needs to be formatted as per [Shopify Theme Kit](https://shopify.github.io/themekit/configuration/) standards. Only include the following properties for each environment:
  - theme_id
  - store
  - password
  - api_key (needed for deployment)
  
2. A `webpack.config.js` in your root directory. This file should at least export an object with the following properties:
```javascript
module.exports = {
  devtool: '',
  entry: { ... },
  output: { ... },
  module: { rules: [ ... ] }
}
```

3. For Shopify, a ```<root>/src``` directory with the following subdirectories:
```
src
|- assets
|- config
   |-- lib
|- layout
|- locales
|- sections
|- templates
   |-- customers
```

4. A ```package.json``` file. Here is an example of how to write your scripts for a Shopify project:
```javascript
{
  "scripts": {
    "start": "brrl -w",
    "build": "brrl -b",
    "dev": "brrl -d -e development",
    "staging": "brrl -d -e staging",
    "production": "brrl -d -e production"
  },
  ...
}
```

4. ```.babelrc```, ```.eslintrc``` and ```postcoss.config.js``` files

## API
There are 3 commands currently provided by this tool:
- ```brrl -w or -watch```
- ```brrl -b or -build```
- ```brrl -d or -deploy```

For each of these commands, a ```-e <development|staging|production>``` variable can be flagged

MIT
