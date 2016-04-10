'use strict';

import editors from './editors';
import remoteView from './remote-view';

export default function(client, store, options) {
    var handlers = [
        editors(client, store, options),
        remoteView(client, store, options)
    ];
    return () => {
        // unsubscribe all listeners
        handlers.forEach(h => h());
        handlers = null;
    };
};
