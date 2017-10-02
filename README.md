# @slater/cli

```bash
npm i barrel-cli -g
```

## Usage
A slater theme needs two things:
1. standard `config.yml`
2. a `webpack.config.js` in your root

Files should follow the default directory structure of [Slate](https://github.com/Shopify/slate). We recommend [@slater/theme](https://github.com/the-couch/slater-theme).

During development, replace your Shopify CDN url with a path to your local bundle to enable HMR. This is not currently configurable.

```html
<body>
  ...
  {% comment %} <script src="{{ 'index.js' | asset_url }}" defer="defer"></script> {% endcomment %}
  <script src="https://unpkg.com/@slater/reload"></script>
  <script src="https://localhost:3000/index.js"></script>
</body>
```

Then just run the commands:

```bash
# watch theme files and
# hot reload javascript
slater -w # or --watch

# build javascript and upload entire theme
slater -d # or --deploy

# specify an environment, default: development
slater -e production # or --env
```

You'll also want the [@slater/reload](https://github.com/the-couch/slater-reload) package to listen for file changes and live-reload the remote page. That will look like this:

```html
<body>
  ...
  {% comment %} <script src="{{ 'index.js' | asset_url }}" defer="defer"></script> {% endcomment %}
  <script src="https://unpkg.com/@slater/reload"></script>
  <script src="https://localhost:3000/index.js"></script>
</body>
```

MIT
