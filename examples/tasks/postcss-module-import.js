const path = require('path')
const fs = require('fs')
const postcss = require('postcss')
const postcssImport = require('postcss-import')
const globby = require('globby')
const postcssImportResolve = require('postcss-import/lib/resolve-id')

const getAllModules = () => {
  const modules = process.cwd() + '/modules/**/**.scss'

  return globby(modules)
    .then(files => {
      const res = files.map(f => path.normalize(f))
      return res
    })
}


const findFile = (id, base) => {
  const parsed = path.parse(id);
  const formats = [
    "%", // full file path
    "%.scss", // SCSS
    "_%.scss", // SCSS partial
    "%.css", // CSS
    "%.json", // JSON data (Sass variables)
    "%/style.scss" // Folder containing SCSS
	];

  let out = []
  let file = ''
  formats.forEach(format => {
    let unresolved = path.join(parsed.dir, format.replace("%", parsed.base));
    out.push(path.join(base, unresolved));
    file = out.reduce((a, b) => {
      if (fs.existsSync(a)) {
        return a
      }
      return b
    })
  })

  return Promise.resolve(file)
}

const resolve = (id, base, options) => {
  if ( /<\D[^>]*>/.test(id) ){
    return getAllModules()
  } else {
    return findFile(id, base)
  }
}

const init = (opts = {}) => {
  opts.resolve = resolve;
  return postcss([postcssImport(opts)]);
}

module.exports = postcss.plugin('postcss-module-import', init)
