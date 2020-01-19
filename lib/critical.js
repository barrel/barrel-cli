const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')
const { extractCritical } = require('./extract-critical')
const inlineCritical = require('./inline-critical')
const replaceAsset = require('./replace-asset')
const { sendToShopify } = require('./util')

async function critical () {
  const configFile = fs.readFileSync('critical.yml', 'utf8')
  const config = yaml.safeLoad(configFile)
  const cssPath = path.join(config.base, config.css)
  const targetPath = path.join(config.base, config.target)
  const stylesheet = path.basename(config.css)

  const options = {
    css: cssPath,
    width: config.width,
    height: config.height
  }

  console.log(`Extracting critical styles.`.cyan)

  const criticalCSS = await extractCritical(config.urls, options)

  console.log(`Inlining critical styles.`.cyan)

  inlineCritical(targetPath, criticalCSS, stylesheet)

  console.log(`Removing inlined styles from stylesheet.`.cyan)

  replaceAsset(cssPath, criticalCSS, config.minify)

  console.log(`Uploading files.`.cyan)

  const deployFiles = [cssPath, targetPath].map(file => (
    new Promise((resolve, reject) => {
      sendToShopify('upload', file, error => {
        if (error) {
          reject()
          return
        }

        resolve()
      })
    })
  ))

  await Promise.all(deployFiles)

  console.log(`💅 CSS Delivery Optimized!`.bgBlack.yellow)
}

module.exports = critical
