const colors = require('colors')
const fs = require('fs');
const path = require('path')
const {spawn} = require('child_process')
const theme = require('@shopify/themekit').command
const shopifyAPI = require('shopify-node-api')
const Moment = require('moment-timezone')
const rimraf = require('rimraf')
const config = require('./configure')
const Err = require('./error')
const Builder = require('./builder')

class Deployer {
  constructor () {
    this.tempDir = `${config.get('cwd')}/__temp__`

    this.Shopify = new shopifyAPI({
      shop: config.get('store'),
      shopify_api_key: config.get('api_key'),
      access_token: config.get('password'),
      verbose: false
    });
  }

  run () {
    console.log(`Compiling assets.. This could take a few moments`.white)
    
    this.getCommitFile().then(data => {
      if (!data) {
        return Promise.resolve(null)
      } else {
        return this.diffCommits(data)
      }
    }).then(files => {
      if (files === null) {
        return Builder(true)
      } else {
        return Builder(true, files)
      }
    }).then(() => {
      return this.saveCommitAndUploadFile()
    }).then(() => {
      this.renameThemeFile()
      this.removeTempDir()
      console.dir('🏆 Deployment completed!')
    })
  }

  getCommitFile () {
    if (!fs.existsSync(this.tempDir)){
      fs.mkdirSync(this.tempDir)
    }
    return new Promise((resolve, reject) => {
      theme({
        args: [
          'download', 
          '--env', process.env.ENV, 
          '--config', config.get('configPath'),
          '--dir', this.tempDir,
          'assets/commit.txt'
        ],
        logLevel: 'silent'
      }, e => {
        if (e) {
          this.makeCommitFile()
        }

        this.readCommitFile(resolve, reject)
      })
    })
  }

  readCommitFile (resolve, reject) {
    fs.readFile(
      `${this.tempDir}/assets/commit.txt`,
      'utf8',
      (err, data) => {
        resolve(data)
      }
    )
  }

  diffCommits (commits) {
    if (typeof commits === 'string') {
      commits = commits.split('\n')
    }
    const last = commits.slice(0).filter(el => el).pop()
    return new Promise((resolve, reject) => {
      let success = ''
      let err = ''
      const diff = spawn('git', [
        'diff',
        '--name-only', 
        'HEAD',
        last
      ])

      diff.stdout.on('data', d => {
        success+=d
      })

      diff.stderr.on('data', d => {
        err+=d
      })

      diff.on('close', code => {
        if (!code) {
          resolve(success.split('\n').filter(f => f))
        } else {
          reject(err)
        }
      })
    })
  }

  makeCommitFile () {
    if (!fs.existsSync(`${this.tempDir}/assets`)){
      fs.mkdirSync(`${this.tempDir}/assets`)
    }

    fs.closeSync(
      fs.openSync(`${this.tempDir}/assets/commit.txt`, 'w')
    )
  }

  getCurrentCommit () {
    return new Promise((resolve, reject) => {
      let success = ''
      let err = ''
      const diff = spawn('git', [
        'rev-parse',
        'HEAD'
      ])

      diff.stdout.on('data', d => {
        success+=d
      })

      diff.stderr.on('data', d => {
        err+=d
      })

      diff.on('close', code => {
        if (!code) {
          resolve(success)
        } else {
          reject(err)
        }
      })
    })
  }

  saveCommitAndUploadFile () {
    return this.getCurrentCommit()
      .then(c => this.saveCommitToFile(c))
      .then(() => this.uploadCommitFile())
  }

  saveCommitToFile (commit) {
    return new Promise((resolve, reject) => {
      fs.appendFile(
        `${this.tempDir}/assets/commit.txt`,
        commit,
        (err) => {
          if (err) reject(err);
          resolve()
      });
    })
  }

  uploadCommitFile () {
    return new Promise((resolve, reject) => {
      theme({
        args: [
          'upload', 
          '--env', process.env.ENV, 
          '--config', config.get('configPath'),
          '--dir', this.tempDir,
          'assets/commit.txt'
        ],
        logLevel: 'silent'
      }, e => {
        if (e) console.dir(`e`.red)
        resolve()
      })
    })
  }

  renameThemeFile () {
    const timestr = Moment().tz('America/New_York').format("D.M.YY, h:mm A")

    const themeNames = {
      'development': 'Dev',
      'staging': 'Stage',
      'production': 'Live'
    }

    this.getCurrentCommit().then(commit => {
      const data = {
        "theme": {
          "id": config.get('theme_id'),
          "name": `${themeNames[config.get('env')]} (${commit.substr(0,10)} @ ${timestr})`
        }
      }

      this.Shopify.put(`/admin/themes/${config.get('theme_id')}.json`, data, (err, d) => {
        if (err) throw new Error(err)
      })
    })
  }

  removeTempDir () {
    rimraf(this.tempDir, err => {
      if (err) throw new Error(err)
    })
  }

}

module.exports = () => {
  let deployer

  try {
    deployer = new Deployer()
    deployer.run()
  } catch (e) {
    new Err(e)
  }

  return deployer
}
