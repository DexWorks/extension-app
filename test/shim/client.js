/**
 * A LiveStyle client shim
 */
'use strict';
const EventEmitter = require('events');

module.exports = function() {
    var client = new EventEmitter();
    var on = client.on;
    client.on = function(name, callback) {
        name.split(/\s+/).filter(Boolean)
        .forEach(event => on.call(client, event, callback));
        return this;
    };
    client.off = client.removeListener;
    client.send = function(name, data) {
        client.emit(name, data);
    };
    return client;
};
