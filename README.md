# @barrelny/cli

```bash
npm i barrel-cli -g
```

## Usage
A slater theme needs two things:
1. standard `config.yml`
2. a `webpack.config.js` in your root

Then just run the commands:

```bash
# watch theme files and
# hot reload javascript
brrl -w # or --watch

# build javascript and upload entire theme
brrl -b # or --build

# specify an environment, default: development
brrl -e production # or --env
```

MIT
