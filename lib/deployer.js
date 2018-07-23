const colors = require('colors')
const fs = require('fs');
const path = require('path')
const {exec, spawn} = require('child_process')
const shopifyAPI = require('shopify-node-api')
const Moment = require('moment-timezone')
const readline = require('readline')
const config = require('./configure')
const Err = require('./error')
const Builder = require('./builder')
const locales = require('./locales')

class Deployer {
  constructor () {
    this.Shopify = new shopifyAPI({
      shop: config.get('store'),
      shopify_api_key: config.get('api_key'),
      access_token: config.get('password'),
      verbose: false
    });
    this.files = []
    this.questioner = false
    this.deployAll = false

    this.askQuestion = this.askQuestion.bind(this)
    this.interpretLastDeploymentFlag = this.interpretLastDeploymentFlag.bind(this)
    this.guessLastDeploymentFlag = this.guessLastDeploymentFlag.bind(this)
    this.getLastVersionTag = this.getLastVersionTag.bind(this)
    this.getBranchBaseCommit = this.getBranchBaseCommit.bind(this)
    this.getChangedFiles = this.getChangedFiles.bind(this)
    this.filterFiles = this.filterFiles.bind(this)
    this.confirmFiles = this.confirmFiles.bind(this)
    this.buildAndDeploy = this.buildAndDeploy.bind(this)
    this.finishDeployment = this.finishDeployment.bind(this)
  }

  run () {
    this.questioner = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
    this.askQuestion(locales.deployer.question1)
      .then(this.interpretLastDeploymentFlag)
      .then(this.getChangedFiles)
      .then(this.confirmFiles)
      .then(this.buildAndDeploy)
      .then(this.finishDeployment)
      .catch(err => {
        console.log(`${err}`.red)
        this.questioner.close()
      })
  }

  askQuestion (question) {
    question = this.attachColor(question)
    return new Promise((resolve, reject) => {
      this.questioner.question(question, answer => {
        resolve(answer)
      })
    })
  }

  interpretLastDeploymentFlag (answer) {
    answer = this.trimString(answer)
    if (!answer) {
      return this.guessLastDeploymentFlag()
    }
    if (/^all/.test(answer)) {
      this.deployAll = true
    }
    return Promise.resolve(answer)
  }
  
  guessLastDeploymentFlag () {
    return this.getLastVersionTag()
      .then(t => {
        t = this.trimString(t)
        if (t) {
          return Promise.resolve(t)
        }
        this.talk(locales.deployer.noVersionTagFound)
        return this.getBranchName().then(this.getBranchBaseCommit)
      })
  }

  getChangedFiles (breakpoint) {
    if (this.deployAll) {
      return Promise.resolve(this.files)
    }
    return this.getChangedFilesFromDiff(breakpoint)
      .then(this.filterFiles)
      .then(files => {
        if (!files || !files.length) {
          throw new Error('No files to deploy')
        }
        this.files = files
        return Promise.resolve(this.files)
      })
  }

  getChangedFilesFromDiff (breakpoint) {
    return this.exec(`git diff --name-status ${this.trimString(breakpoint)}..HEAD`)
  }

  filterFiles (files) {
    const cleansed = files.split(/\n/)
      .filter(f => f)
      .map(line => {
        return line.split(/\t/)
      })
      // Forget about files that have been deleted
      // Unless they are a compiled file (config, css, js)
      .filter(line => {
        if (!/D/.test(line[0])) {
          return true
        }
        if (/(?:config|[.]js|[.]s?css)/i.test(line[1])) {
          return true
        }
        return false
      })
      // If a file has been replaced, get the new location
      .map(line => {
        if (/R/.test(line[0])) {
          return line[2]
        } else {
          return line[1]
        }
      })
      .filter(f => /^src/.test(f))

    return Promise.resolve(cleansed)
  }

  confirmFiles () {
    if (this.deployAll) {
      return Promise.resolve(true)
    }
    let question2 = locales.deployer.question2
      .replace('{{files}}', this.files.join('\n'))

    return this.askQuestion(question2)
      .then(answer => {
        if (!answer || /^[Yy]+/.test(answer)) {
          this.talk('Starting deployment..')
          return Promise.resolve(true)
        }
        throw new Error('Files do not look good :(')
      })
  }

  buildAndDeploy () {
    if (this.deployAll) {
      return Builder(true)
    }
    return Builder(true, this.files)
  }

  finishDeployment () {
    this.renameThemeFile()
    this.questioner.close()
    this.talk('🏆 Deployment completed!')
  }

  talk (msg) {
    console.log(this.attachColor(msg))
  }

  attachColor (str) {
    return `${str}`.bgBlack.yellow
  }

  trimString (str) {
    return str.replace(/[\r\n]+/, '')
  }

  exec ( command = "ls" ) {
    return new Promise( (resolve, reject) => {
      exec(command, (err, stdout) => {
        if (err) {
          console.error(err)
          reject(err.message)
          return
        }
        resolve(stdout)
      })
    })
  }

  getBranchBaseCommit (branchName) {
    let cleansed = branchName.replace(/[\r\n]+/, '')
    if (cleansed === 'develop') {
      return this.exec(`git merge-base ${cleansed} master`)
    }
    return this.exec(`git merge-base ${cleansed} develop`)
  }
  
  getBranchName () {
    return this.exec('git rev-parse --abbrev-ref HEAD')
  }

  getCommitAuthor () {
    return this.exec('git log -1 --pretty=format:"%an"')
  }

  getCurrentCommit () {
    return this.exec('git rev-parse HEAD | cut -c1-7')
  }

  getLastVersionTag () {
    return this.exec('git tag --sort v:refname | grep "^v" | tail -1')
  }

  renameThemeFile () {
    // max 13 chars
    let packageFile = path.join( process.cwd(), 'package.json')
    const { version } = require(packageFile)

    // max 15 chars
    const timestr = Moment().tz('America/New_York').format("MM.DD.YY, HH:ss")

    // max 10 chars
    const themeNames = {
      'development': 'DEV',
      'staging': 'STAGING',
      'production': 'LIVE'
    }

    this.getCurrentCommit().then(commit => {
      this.getCommitAuthor().then( a => {

        let arr = a.split(' ')
        let author = arr.length >= 2 ? `${arr[0]} ${arr[arr.length-1].substr(0,1)}` : arr[0]
        let commitHash = commit.substr(0,7).toLowerCase()
        let featureOrVersion = (
          config.get('env') == "production" ? 
          `v${version} (${commitHash})` : 
          `${commitHash} - ${author.substr(0,12)}`
        )
        let themeName = `${themeNames[config.get('env')]} - ${featureOrVersion} - ${timestr}`

        console.log("Renamed theme to: " + themeName .green)

        const data = {
          "theme": {
            "id": config.get('theme_id'),
            "name": themeName
          }
        }
  
        this.Shopify.put(`/admin/themes/${config.get('theme_id')}.json`, data, (err, d) => {
          if (err) throw new Error(err)
        })
      })
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
