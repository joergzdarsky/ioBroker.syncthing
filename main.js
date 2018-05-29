/**
 *
 * syncthing adapter
 *
 *
 *  file io-package.json comments:
 *
 *  {
 *      "common": {
 *          "name":         "syncthing",                  // name has to be set and has to be equal to adapters folder name and main file name excluding extension
 *          "version":      "0.0.0",                    // use "Semantic Versioning"! see http://semver.org/
 *          "title":        "Node.js syncthing Adapter",  // Adapter title shown in User Interfaces
 *          "authors":  [                               // Array of authord
 *              "name <mail@syncthing.com>"
 *          ]
 *          "desc":         "syncthing adapter",          // Adapter description shown in User Interfaces. Can be a language object {de:"...",ru:"..."} or a string
 *          "platform":     "Javascript/Node.js",       // possible values "javascript", "javascript/Node.js" - more coming
 *          "mode":         "schedule",                   // possible values "daemon", "schedule", "subscribe"
 *          "schedule":     "/2 * * * *"                 // cron-style schedule. Only needed if mode=schedule
 *          "loglevel":     "info"                      // Adapters Log Level
 *      },
 *      "native": {                                     // the native object is available via adapter.config in your adapters code - use it for configuration
 *          "syncthingurl": "http://127.0.0.1:8080",
 *          "syncthingapikey": "YourApiKey",
 *          "syncthingfolderid": "YourFolderID"
 *      }
 *  }
 *
 */

/* jshint -W097 */// jshint strict:false
/*jslint node: true */
"use strict";

// you have to require the utils module and call adapter function
var utils =    require(__dirname + '/lib/utils'); // Get common adapter utils

// you have to call the adapter function and pass a options object
// name has to be set and has to be equal to adapters folder name and main file name excluding extension
// adapter will be restarted automatically every time as the configuration changed, e.g system.adapter.syncthing.0
var adapter = utils.adapter('syncthing');

/*
* Global Variables to be used across functions
*/
var endpoint_DBStatus = "/rest/db/status";                    // Provides major folder data. See: https://docs.syncthing.net/rest/db-status-get.html
var endpoint_SystemStatus = "/rest/db/completion";            // Provides completion percentage. See: https://docs.syncthing.net/rest/db-completion-get.html
var xmlHttp = null;

// is called when adapter shuts down - callback has to be called under any circumstances!
adapter.on('unload', function (callback) {
    try {
        adapter.log.info('cleaned everything up...');
        callback();
    } catch (e) {
        callback();
    }
});

// is called if a subscribed object changes
adapter.on('objectChange', function (id, obj) {
    // Warning, obj can be null if it was deleted
    adapter.log.info('objectChange ' + id + ' ' + JSON.stringify(obj));
});

// is called if a subscribed state changes
adapter.on('stateChange', function (id, state) {
    // Warning, state can be null if it was deleted
    adapter.log.info('stateChange ' + id + ' ' + JSON.stringify(state));

    // you can use the ack flag to detect if it is status (true) or command (false)
    if (state && !state.ack) {
        adapter.log.info('ack is not set!');
    }
});

// Some message was sent to adapter instance over message box. Used by email, pushover, text2speech, ...
adapter.on('message', function (obj) {
    if (typeof obj == 'object' && obj.message) {
        if (obj.command == 'send') {
            // e.g. send email or pushover or whatever
            console.log('send command');

            // Send response in callback if required
            if (obj.callback) adapter.sendTo(obj.from, obj.command, 'Message received', obj.callback);
        }
    }
});

// is called when databases are connected and adapter received configuration.
// start here!
adapter.on('ready', function () {
    adapter.log.info('adapter.on(ready) function invoked.');
    main();
});

function main() {
    // The adapters config (in the instance object everything under the attribute "native") is accessible via
    // adapter.config:
    adapter.log.info('main() function invoked.');
    adapter.log.info('config syncthingurl: ' + adapter.config.syncthingurl);
    adapter.log.info('config syncthingapikey: ' + adapter.config.syncthingapikey);
    adapter.log.info('config syncthingfolderid: ' + adapter.config.syncthingfolderid);

    /**
    *      For every state in the system there has to be also an object of type state
    *      Here a simple syncthing for a boolean variable named "testVariable"
    *      Because every adapter instance uses its own unique namespace variable names can't collide with other adapters variables
    */
    adapter.setObject('folderState', {
        type: 'state',
        common: {
            name: 'folderState',
            type: 'string',
            role: 'indicator'
        },
        native: {}
    });
    adapter.setObject('folderStateChange', {
        type: 'state',
        common: {
            name: 'folderStateChange',
            type: 'string',
            role: 'indicator'
        },
        native: {}
    });
    adapter.setObject('folderLocalBytes', {
        type: 'state',
        common: {
            name: 'folderLocalBytes',
            type: 'string',
            role: 'indicator'
        },
        native: {}
    });
    adapter.setObject('folderLocalBytesFormated', {
        type: 'state',
        common: {
            name: 'folderLocalBytesFormated',
            type: 'string',
            role: 'indicator'
        },
        native: {}
    });
    adapter.setObject('folderGlobalBytes', {
        type: 'state',
        common: {
            name: 'folderGlobalBytes',
            type: 'string',
            role: 'indicator'
        },
        native: {}
    });
    adapter.setObject('folderGlobalBytesFormated', {
        type: 'state',
        common: {
            name: 'folderGlobalBytesFormated',
            type: 'string',
            role: 'indicator'
        },
        native: {}
    });

    // in this syncthing all states changes inside the adapters namespace are subscribed
    adapter.subscribeStates('*');

    // Initialize external variables
    adapter.setState('folderState', { val: "initialized", ack: true });
    adapter.setState('folderStateChange', { val: "initialized", ack: true });
    adapter.setState('folderLocalBytes', { val: "initialized", ack: true });
    adapter.setState('folderLocalBytesFormated', { val: "initialized", ack: true });
    adapter.setState('folderGlobalBytes', { val: "initialized", ack: true });
    adapter.setState('folderGlobalBytesFormated', { val: "initialized", ack: true });

    /**
    * START OF SYNCTHING SCRIPTING
    */

    // Fire REST API Call
    adapter.log.info('Calling invokeSyncthingUpdate() function.');
    invokeSyncthingUpdate();
      
    // Stop Adapter (immediately)
    // adapter.log.info('Stopping adapter for next cycle.');
    // adapter.stop();
    
    // Stop Adapter (after 30 seconds)
    // don't know why it does not terminate by itself...
    adapter.log.info('Stopping adapter for next cycle...');
    setTimeout(function () {
        adapter.log.info('force terminate');
        process.exit(0);}, 30000);
}

/*
* SYNCTHING SPECIFIC FUNCTIONS
*/

function invokeSyncthingUpdate() {
    // Initialize external variables
    adapter.setState('folderState', { val: "requesting", ack: true });
    adapter.setState('folderStateChange', { val: "requesting", ack: true });
    adapter.setState('folderLocalBytes', { val: "requesting", ack: true });
    adapter.setState('folderLocalBytesFormated', { val: "requesting", ack: true });
    adapter.setState('folderGlobalBytes', { val: "requesting", ack: true });
    adapter.setState('folderGlobalBytesFormated', { val: "requesting", ack: true });

    // Fire REST API Call
    httpGetSyncthing();
}

// Invokes HTTP Request
function httpGetSyncthing() {
    // Full URL
    var syncthingURL = adapter.config.syncthingurl + endpoint_DBStatus + "?folder=" + adapter.config.syncthingfolderid;
    // Prepare new Request
    const request = require('request-promise')
    const options = {
        method: 'GET',
        uri: syncthingURL,
        json: true,
        headers: {
            'User-Agent': 'ioBroker Request-Promise',
            'Accept': "text/plain",
            'Content-Type': "text/plain",
            'X-API-Key': adapter.config.syncthingapikey
        }
    }
    // Fire Request
    request(options)
        .then(function (response) {
            // Request was successful, use the response object at will
            adapter.log.info("Request to " + syncthingURL + " was SUCCESSFULL");
            adapter.log.info("state=" + response.state);
            adapter.log.info("stateChanged=" + response.stateChanged);
            adapter.log.info("localBytes=" + response.localBytes);
            adapter.log.info("globalBytes=" + response.globalBytes);
            // Set the adapter output values
            adapter.setState('folderState', { val: response.state, ack: true });
            adapter.setState('folderStateChange', { val: response.stateChanged, ack: true });
            adapter.setState('folderLocalBytes', { val: response.localBytes, ack: true });
            adapter.setState('folderLocalBytesFormated', { val: formatBytes(response.localBytes), ack: true });
            adapter.setState('folderGlobalBytes', { val: response.globalBytes, ack: true });
            adapter.setState('folderGlobalBytesFormated', { val: formatBytes(response.globalBytes), ack: true });
        })
        .catch(function (err) {
            // Something bad happened, handle the error
            adapter.log.info("Request to " + syncthingURL + " FAILED");
            // Set the adapter output values
            adapter.setState('folderState', { val: 'error', ack: true });
            adapter.setState('folderStateChange', { val: 'error', ack: true });
            adapter.setState('folderLocalBytes', { val: 'error', ack: true });
            adapter.setState('folderLocalBytesFormated', { val: 'error', ack: true });
            adapter.setState('folderGlobalBytes', { val: 'error', ack: true });
            adapter.setState('folderGlobalBytesFormated', { val: 'error', ack: true });
        }
    )
}

// Converts byte size unit into proper larger size unit
function formatBytes(bytes) {
    if (bytes < 1024) return bytes + " Bytes";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(3) + " KB";
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(3) + " MB";
    else return (bytes / 1073741824).toFixed(3) + " GB";
};
