const deployer = {
  "question1": "\n\nWhen was the last deployment (commit, tag or branch)?\n\neg. commithash, v1.0.1, develop or.. 'all'\n\nDefault: Last version tag \n\n",
  "question2": "\n\nDo these files look correct? \n* JS and CSS will always be uploaded *\n\n{{files}}\n\n[Y|n]\n",
  "noVersionTagFound": "No version tag found\nGetting branch merge-base..\n"
}

module.exports = {
  deployer
}