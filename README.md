# Base app for building LiveStyle extensions

A [Redux](http://redux.js.org)-based app that connects to LiveStyle server via given client and produces store that holds up-to-date data with all available LiveStyle sessions and user preferences.

This app designed to be a core for LiveStyle browser extensions: they should listen to store updates and draw UI accordingly.

## Prerequisites

Assuming this app should run in browser environment:

* Browser extension should send payload with all opened `tabs`. Each tab *must* contain `id`, `url` and `origin` — URL’s host with schema (e.g. `http://localhost:8000`) or common part for all in-page resources if this is a local file (e.g. `file:///Users/foo/project/bar`). This payload must be updated each time a tab is created, updated or removed.
* Browser should have a persistent storage for `sessions` app store key and update its content when extension starts. The `sessions` key holds data about all LiveStyle sessions and user preferences.
* Base app will automatically rebuild its state based on given `tabs` and `sessions` data and will keep it up-to-date.

## Store example

```js
{
    // Contains data about all LiveStyle-supported editors
    // currently opened by user
    editors: {
        // List of currently opened editors with LiveStyle plugin
        list: new Map().set('editor-id', {
            name: 'Sublime Text',
            files: new Set(['path/to/style.css'])
        }),

        // Unique list of LiveStyle-supported files in all opened editors
        files: new Set([
            'path/to/style.css',
            'path/to/module.less'
        ])
    },

    // Map of tabs currently opened in browser.
    // Each tab must be identified by unique `tabId` and contain
    // `url` and `origin` properties
    tabs: new Map('tabId', {
        url: 'http://localhost:8000/test/index.html',
        origin: 'http://localhost:8000',

        // Stylesheets for current tab. Can be array of URLs or object.
        // If object, app assumes that stylesheets are divided on
        // different “zones”. Each zone may contain stylesheets
        // that require different API for manipulating. This app will
        // aggregate final stylesheets list from each zone value or
        // value keys (array or objects/maps respectively)
        stylesheets: {
            cssom: ['http://localhost:8000/test/index.html'],
            devtools: new Map()
            .set('http://localhost:8000/test/index.html', 'body {...}')
        },

        // Points to Remote View session, available for current tab
        remoteView: 'http://localhost:8080',

        // If there’s matching LiveStyle session, the `session` key
        // will hold ID reference to persistent LiveStyle session and
        // local user data
        session: {
            // points to `sessions` entry
            id: 'http://localhost:8000/test/index.html',

            // array of stylesheets available for current page,
            // calculated from parent `stylesheets` key
            stylesheets: new Set(),

            // Browser-to-editor file mapping, automatically calculated
            // from `editors.files`, `sessions.userMapping` and
            // `tabs.[id].session.stylesheets`
            mapping: new Map(),

            // List of resource patches applied to given session.
            // Mostly used by DevTools: session accumulates all
            // incoming patches in this map
            // (key is resource URI, values are patches) and DevTools,
            // when connected or synchronized, will use these patches
            // to update resources accordingly and then remove applied
            // patches
            patches: new Map(),

            // List of editor files that were requested for
            // unsaved changes for current session. Useful for keeping
            // track which files were requested for unsaved changes
            // when user creates new tab with same session URL
            requestedUnsavedFiles: new Set()
        }
    }),

    // LiveStyle sessions. Each session is identified by ID (mostly
    // page URL) this ID is then mapped to opened tab
    sessions: new Map().set('http://localhost:8000/test/index.html', {
        // LiveStyle is enabled/disabled by user for this session
        enabled: true,

        // Update direction, see `PAGE.DIRECTION_*` in action names
        direction: 'both',

        // When this session was used last time,
        // used to auto-remove old sessions
        lastUsed: 1456088041245,

        // Browser-to-editor file mapping, hand-picked by user
        userMapping: new Map(),

        // Persistent IDs of user-generated stylesheets.
        // In most cases, browsers may require a runtime-generated
        // unique URLs for user stylesheets, obtained by
        // `URL.createObjectURL()`. This set is used to sync user
        // stylesheets changes across tabs that matched current session
        userStylesheets: new Set()
    }),

    // Remote View state and sessions
    remoteView: {
        // Wether current browser client is connected to LiveStyle App
        connected: true,

        // Currently active Remote View sessions,
        // key is a session origin
        sessions: new Map().set('http://localhost:8080', {
            // current session connection state,
            // see REMOTE_VIEW.STATE_* action name
            state: 'connected',
            publicId: 'rv.livestyle.io',
            localSite: 'http://localhost:8080',
            connectUrl: 'http://livestyle.io:9001',
            expiresAt: Date.now()
        })
    }
}
```
