'use strict';

import editors from './editors';
import remoteView from './remote-view';

export default function(client, options) {
    var handlers = [
        editors(client, options),
        remoteView(client, options)
    ];
    return () => {
        // unsubscribe all listeners
        handlers.forEach(h => h());
        handlers = null;
    };
};
