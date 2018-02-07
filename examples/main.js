import init from './lib/init-modules'

document.addEventListener('DOMContentLoaded', () => {
  init({
    module: 'modules'
  }).mount()
})
