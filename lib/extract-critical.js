const penthouse = require('penthouse')
const CleanCSS = require('clean-css')
const maxPenthouseJobs = 5

async function startPenthouseJob (urls, penthouseOptions, output = '') {
  const url = urls.shift()

  if (!url) {
    return Promise.resolve(output)
  }

  const criticalCSS = await penthouse({
    url,
    ...penthouseOptions
  })

  return await startPenthouseJob(urls, penthouseOptions, output + criticalCSS)
}

async function startJobs (urls, penthouseOptions) {
  const parallel = Math.min(urls.length, maxPenthouseJobs)

  const jobs = [...Array(parallel)].map(() => (
    startPenthouseJob(urls, penthouseOptions)
  ))

  return await Promise.all(jobs)
}

async function extractCritical (urls, penthouseOptions) {
  const output = await startJobs(urls, penthouseOptions)

  const criticalCSS = output.reduce((critical, css) => critical + css, '')

  return new CleanCSS({
    level: {
      1: {
        all: true
      },
      2: {
        all: false,
        removeDuplicateFontRules: true,
        removeDuplicateMediaBlocks: true,
        removeDuplicateRules: true,
        removeEmpty: true,
        mergeMedia: true
      }
    }
  }).minify(criticalCSS).styles
}

module.exports = {
  extractCritical,
  startJobs,
  startPenthouseJob
}
