# @barrelny/cli

This CLI provides development, build and deployment tasks for Shopify projects. The tool is designed to work with Wordpress projects too but currently it has not been tested properly with Wordpress. The tool enforces a Webpack-based development environment for bundling of styles and scripts.

> ### If migrating from a 0.0.* version of this package to a ^1.0.0 version of this package
> After you install the new version run through the following steps:
> 1. Remove the package-lock.json
> 2. Add the following line to package.json under scripts: `"dependencies": "brrl-install"`
> 3. run `npm run dependencies`
> 
> This will add dependencies that were originally managed in this package to your project's `package.json`.

### Table of Contents
1. Install
1. Dependencies
1. API
1. Configuration Specifics

### Install
```bash
npm i @barrelny/cli -D
```
> If you're using any plugins or transforms in your ```postcss.config``` or ```.babelrc```, please install these too. The CLI has an installations script accessible through `brrl-install` that will, when executed, install the following packages for you:
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
    "dependencies": "brrl-install",
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
    "build": "brrl -b",
    "dependencies": "brrl-install"
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
__webpack_public_path__ = BRRL_PATH(BRRL_PUBLIC_PATH, BRRL_PROXY) // eslint-disable-line camelcase
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
There are 4 commands currently provided by this tool:
- ```brrl-install```
- ```brrl -w or -watch```
- ```brrl -b or -build```
- ```brrl -d or -deploy```

##### ```brrl-install```
This is an installation script that will add common packages that we develop with at Barrel into the project's package.json. You should run this command only once, when you are scaffolding out a project.

**For each of the commands below, a ```-e <development|staging|production>``` variable can be flagged**

##### ```brrl -w or -watch```
This command creates a proxy environment for a Shopify or Wordpress site that uses [Browsersync](https://www.browsersync.io/) to provide hot module reloading. When CSS and JS assets are updated in your text editor, your browser will automatically reflect the changes. If you update a liquid file (or in Wordpress, a PHP file), the browser will automatically reload after the file as been copied to the ```/dist``` directory and uploaded to the Shopify theme outlined in the ```config.yml``` file. Note that JS and CSS files are compiled into memory and not written to the file system.

##### ```brrl -b or -build```
This command simply compiles your JS and CSS assets and, if it is a Shopify project, copies your theme assets in a ```/dist``` directory. The task will create separate minified JS and CSS assets.

##### ```brrl -d or -deploy```
> This file is only suitable for Shopify projects. This task will not do anything if the project is not a Shopify project. 

This command will build your project and deploy *Only the necessary files* to your Shopify theme. The deployment is based on a ```git diff``` workflow. 

The person deploying can select at what point in the git repository they want to check for files that have changed. They can specify a tag, branch or commit hash, or “all” to deploy all files. This is done in the terminal window, in response to a prompt that is surfaced by the tool. If no answer is provided to the prompt, then the deployment script will check for files from the latest version tag (e.g. v1.0.1). If no version tag is found in the repo then it’ll check for files changed since the current branch was branched off of develop (or if the current branch is develop, branched off of master).

## Common usecases encountered when using  ```brrl -deploy```

##### Deploying file changes made on a feature branch.

In this case, the deploying user should write "develop" in response to the console prompt. By putting in "develop", all files that have changed since the feature branch diverged from the `develop` branch will be deployed. This works when the targetted Shopify theme is up to date with the files on `develop`. If not, "all" can be written after the prompt instead to deploy all theme files.

##### Updating a theme to the latest version.

In this case, the deploying user should write the last tag name, e.g. "v1.0.2" in response to the console prompt. This is effective if the deploying user is deploying version `v1.0.3` to a theme that is already up to date with `v1.0.2`. By putting in "v1.0.3", the deployment task finds all files that have changed between versions and deploys only those files.

## Configuration Specifics
```yaml
production:
  theme_id: # This is the Shopify Theme ID
  api_key: # This is the Shopify API Key for your Private App
  password: # This is the Shopify API password for your Private App
  store: # This is the *.myshopify.com URL (e.g barrel.myshopify.com)
staging:
  theme_id: # This is the Shopify Theme ID
  api_key: # This is the Shopify API Key for your Private App
  password: # This is the Shopify API password for your Private App
  store: # This is the *.myshopify.com URL (e.g barrel.myshopify.com)
development:
  theme_id: # This is the Shopify Theme ID
  api_key: # This is the Shopify API Key for your Private App
  password: # This is the Shopify API password for your Private App
  store: # This is the *.myshopify.com URL (e.g barrel.myshopify.com)
  domain: # If Shopify has redirects to the primary domain enabled, put the domain here (e.g. barrelny.com)
  local: # If you would like to use a local URL other than localhost, put it here (e.g. 10.0.1.8)
  hmr: # If you would like to turn off hot module reloading, do so here (e.g. true or false)**

** I have found this useful when debugging on mobile devices. Sometimes HMR causes the device to reload unnecessarily.
MIT
