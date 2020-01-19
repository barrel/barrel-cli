const fs = require('fs')

function loadCSS (criticalCSS, stylesheet) {
  return `
    <style>${criticalCSS}</style>
    <link rel="preload" href="{{ '${stylesheet}' | asset_url }}" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link rel="stylesheet" href="{{ '${stylesheet}' | asset_url }}"></noscript>
    <script>
    /*! loadCSS. [c]2017 Filament Group, Inc. MIT License */
    !function(n){"use strict";n.loadCSS||(n.loadCSS=function(){});var o=loadCSS.relpreload={};if(o.support=function(){var e;try{e=n.document.createElement("link").relList.supports("preload")}catch(t){e=!1}return function(){return e}}(),o.bindMediaToggle=function(t){var e=t.media||"all";function a(){t.addEventListener?t.removeEventListener("load",a):t.attachEvent&&t.detachEvent("onload",a),t.setAttribute("onload",null),t.media=e}t.addEventListener?t.addEventListener("load",a):t.attachEvent&&t.attachEvent("onload",a),setTimeout(function(){t.rel="stylesheet",t.media="only x"}),setTimeout(a,3e3)},o.poly=function(){if(!o.support())for(var t=n.document.getElementsByTagName("link"),e=0;e<t.length;e++){var a=t[e];"preload"!==a.rel||"style"!==a.getAttribute("as")||a.getAttribute("data-loadcss")||(a.setAttribute("data-loadcss",!0),o.bindMediaToggle(a))}},!o.support()){o.poly();var t=n.setInterval(o.poly,500);n.addEventListener?n.addEventListener("load",function(){o.poly(),n.clearInterval(t)}):n.attachEvent&&n.attachEvent("onload",function(){o.poly(),n.clearInterval(t)})}"undefined"!=typeof exports?exports.loadCSS=loadCSS:n.loadCSS=loadCSS}("undefined"!=typeof global?global:this);
    </script>
  `
}

function inlineCritical (target, criticalCSS, stylesheet) {
  const targetHtml = fs.readFileSync(target, 'utf8')

  const linkRegex = new RegExp(String.raw`<[^>]+?\s*href=\"[^>]*${stylesheet}[^>]\"*[^>]*>`)

  const html = targetHtml.replace(linkRegex, loadCSS(criticalCSS, stylesheet))

  fs.writeFileSync(target, html, 'utf8')
}

module.exports = inlineCritical
