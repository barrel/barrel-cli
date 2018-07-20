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

class Deployer {
  constructor () {
    this.Shopify = new shopifyAPI({
      shop: config.get('store'),
      shopify_api_key: config.get('api_key'),
      access_token: config.get('password'),
      verbose: false
    });
  }

  run () {
    console.log(`\n\nCompiling assets.. This could take a few moments`.bgBlack.white)
    
    const questioner = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
    let question1 = '\n\nWhat\'s your deployment breakpoint (commit, tag or branch)? \n\n'.bgBlack.yellow
    question1 += 'eg. commithash, v1.0.1, develop or.. "all" \n'.bgBlack.yellow
    question1 += 'Default: Last version tag \n\n'.bgBlack.yellow
    question1 += '[write your answer now..] \n'.bgBlack.yellow
    
    this.askQuestion(questioner, question1)
      .then(answer => {
        let bp;
        if (!answer) {
          bp = this.getLastVersionTag()
                .then(t => Promise.resolve(t.replace(/[\r\n]+/, '')))
                .then(t => {
                  if (!t) {
                    let comment = 'No version tag found\n'.underline.bgWhite.black
                    comment += 'Getting branch merge-base..\n'.underline.bgWhite.black 
                    console.log(comment)
                    
                    return this.getBranchName()
                      .then(b => this.getBranchBaseCommit(b))
                  } else {
                    return Promise.resolve(t)
                  }
                })
        } else if (/^all/.test(answer)){
          bp = Promise.resolve(null)
        } else {
          bp = Promise.resolve(answer.replace(/ /, ''))
        }
        return bp.then(str => {
          if (str) {
            return this.getChangedFiles(str)
          } else {
            // Deploy all files
            return Promise.resolve(null)
          }
        }).then(str => {
          if (str === null) {
            // Deploy all files
            return Promise.resolve(str)
          }

          if (!str) {
            return Promise.reject('No files to upload :('.red)
          }
          
          const files = str.split(/\n/)
            .filter(f => f)
            .filter(f => /^src/.test(f))
          return Promise.resolve(files)
        })
      }).then(files => {
        if (!files) {
          // Deploy all files
          return Promise.resolve({answer: 'Y'})
        }

        let question2 = '\n\nDo these files look correct? \n'.underline.bgWhite.black
        question2 += '* JS and CSS will always be uploaded *\n\n'.underline.bgWhite.black
        question2 += files.join('\n').bgBlack.white
        question2 += '\n\n[Y|n]\n'.bgBlack.white
        
        return this.askQuestion(questioner, question2)
          .then(answer => {
            return Promise.resolve({answer, files})
          })

      }).then(({answer, files = null}) => {
        if (!answer || /^[Yy]+/.test(answer)) {
          console.log('Starting deployment..'.green)
          return Promise.resolve(files)
        }
        return Promise.reject('Files do not look good :('.red)
      }).then(files => {
        if (files === null) {
          return Builder(true)
        } else {
          return Builder(true, files)
        }
      }).then(() => {
        this.renameThemeFile()
        questioner.close()
        console.log('🏆 Deployment completed!'.green)
      }).catch(err => {
        console.log(`${err}`.red)
        questioner.close()
      })
  }

  askQuestion (process, question) {
    return new Promise((resolve, reject) => {
      process.question(question, answer => {
        resolve(answer)
      })
    })
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

  getChangedFiles (breakpoint) {
    return this.exec(`git diff --name-only HEAD..${breakpoint}`)
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
