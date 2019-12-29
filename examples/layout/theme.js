import init from 'lib/init'
import promobar from 'modules/promobar/promobar'
import header from 'modules/header/header'
import miniCart from 'modules/mini-cart/mini-cart'
import bus from 'lib/bus'

import '../../css/main.css'

BARREL.bus = bus

init({
  'promobar': promobar,
  'header': header,
  'mini-cart': miniCart
})
