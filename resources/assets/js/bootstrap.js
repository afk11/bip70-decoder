
//window._ = require('lodash');

/**
 * We'll load jQuery and the Bootstrap jQuery plugin which provides support
 * for JavaScript based Bootstrap features such as modals and tabs. This
 * code may be modified to fit the specific needs of your application.
 */

try {
    window.$ = window.jQuery = require('jquery');

    require('bootstrap-sass');
} catch (e) {}

window.QRious = require('qrious');
window.bitcoinjs = require('bitcoinjs-lib');
window.bitcoinOps = require('bitcoin-ops');
window.bip70 = require('bip70-js');
window.jsrsasign = require('jsrsasign');
