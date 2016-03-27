/**
 * A LiveStyle client shim
 */
'use strict';
const EventEmitter = require('events');

module.exports = function() {
    var client = new EventEmitter();
    client.off = client.removeListener;
    return client;
};
