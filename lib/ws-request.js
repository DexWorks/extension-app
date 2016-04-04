/**
 * Sends message to given LiveStyle Websocket client and optionally waits for
 * expected response. If expected response is given, waits for response
 * with given event for some period of time and either resolves of rejects
 * returned Promise
 */
'use strict';

export default function request(client, name, data) {
    // use microtask to send message after adding expected response
    var p = Promise.resolve().then(() => client.send(name, data));

    p.expect = function(expectedName, validator, timeout=1000) {
        return new Promise((resolve, reject) => {
            var cancelId = setTimeout(function() {
                client.off('message-receive', callback);
                var err = new Error(`Expected message "${expectedName}" timed out`);
                err.code = 'EEXPECTTIMEOUT';
                err.messageName = expectedName;
                reject(err);
            }, timeout);

            var callback = function(name, data) {
                if (name === expectedName) {
                    var isValid = true;
                    if (typeof validator === 'function') {
                        try {
                            isValid = validator(data);
                        } catch (e) {
                            isValid = false;
                        }
                    }

                    if (isValid) {
                        client.off('message-receive', callback);
                        clearTimeout(cancelId);
                        resolve(data);
                    }
                }
            };

            client.on('message-receive', callback);
        });
    };

    return p;
}
