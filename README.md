# @barrelny/cli

This CLI provides development, build and deployment tasks for Shopify projects. The tool is designed to work with Wordpress projects too but currently it has not been tested properly with Wordpress. The tool enforces a Webpack-based development environment for bundling of styles and scripts.

### Table of Contents
1. Install
1. Dependencies
2. API

### Install
```bash
npm i @barrelny/cli -D
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
  entry: { main: ['main.css','main.js'] },
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

4. A ```package.json``` file. 

Here is an example of how to write your scripts for a *Shopify* project:
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

Here is an example of how to write your scripts for a *Wordpress* project:

```javascript
{
  "scripts": {
    "start": "brrl -w",
    "build": "brrl -b"
  },
  ...
}
```

5. .babelrc, .eslintrc and postcss.config.js files

EsLint should only use standard js rules except when incompatible with the project framework:
```javascript
// .eslintrc
module.exports = {
  "extends": ["standard"]
}
```

6. The following line in the entry JS file (e.g. main.js file):

```javascript
__webpack_public_path__ = BRRL_PATH(BRRL_PUBLIC_PATH) // eslint-disable-line camelcase
```

7. A conditional in the main layout file to pull in the development assets if the watch task is active and the project is currently getting proxied by ```localhost```. For example, in a Shopify project, you can setup a pattern as follows:
```liquid
In the head:
{% if settings.is_dev_mode %}
  {{ '/dev/main.js' | script_tag }}
{% else %}
  {{ 'main.css' | asset_url | stylesheet_tag }}
{% endif %}

In the foot:
{% unless settings.is_dev_mode %}
  {{ 'main.js' | asset_url | script_tag }}
{% endunless %}
```

## API
There are 3 commands currently provided by this tool:
- ```brrl -w or -watch```
- ```brrl -b or -build```
- ```brrl -d or -deploy```

For each of these commands, a ```-e <development|staging|production>``` variable can be flagged

##### ```brrl -w or -watch```
This command creates a proxy environment for a Shopify or Wordpress site that uses [Browsersync](https://www.browsersync.io/) to provide hot module reloading. When CSS and JS assets are updated in your text editor, your browser will automatically reflect the changes. If you update a liquid file (or in Wordpress, a PHP file), the browser will automatically reload after the file as been copied to the ```/dist``` directory and uploaded to the Shopify theme outlined in the ```config.yml``` file. Note that JS and CSS files are compiled into memory and not written to the file system.

##### ```brrl -b or -build```
This command simply compiles your JS and CSS assets and, if it is a Shopify project, copies your theme assets in a ```/dist``` directory. The task will create separate minified JS and CSS assets.

##### ```brrl -d or -deploy```
> This file is only suitable for Shopify projects. This task will not do anything if the project is not a Shopify project. 

This command will build your project and deploy *Only the necessary files* to your Shopify theme. The deployment is based on a ```git diff``` workflow. The CLI tracks the git commit hashes associated with your deployments so that it can figure out which files have changed since the last deployment and only upload these changed files. It does this by creating and storing a ```commit.txt``` file in the theme's ```assets``` folder. This file tracks the commit hashes associated with each deployment. Note: All changed files need to be committed into the git repo before they can be uploaded to Shopify. If no ```commit.txt``` file can be found, the task will deploy all theme files.

MIT
