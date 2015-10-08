/* jshint ignore:start */
var Alloy = require('alloy'),
    _ = require('alloy/underscore')._,
    Backbone = require('alloy/backbone');
/* jshint ignore:end */

'use strict';
/* Compatibility for Ti standalone (without Alloy) */
if (typeof OS_ANDROID === "undefined") {
    var OS_ANDROID = Ti.Platform.name === "android";
    var OS_IOS = Ti.Platform.name === "iPhone OS";
}

var sensimityClient = require('./client/client');
var knownBeaconsService = require('./service/knownBeacons');

if (_.isUndefined(Alloy.Globals.sensimityEvent)) {
    Alloy.Globals.sensimityEvent = require('./dispatcher');
}

/**
 * Initialize the sensimityscanner and start the scanner if running on foreground
 * @param params The params to set. Add networkId to set which network must be scanned.
 */
function start(params) {
    var options = _.defaults(params || {}, {
        backgroundMode: false
    });

    // On android, please start always the backgroundmode
    if (!options.backgroundMode && OS_ANDROID && !_.isUndefined(Alloy.CFG.sensimity.backgroundService)) {
        startBackgroundIntent();
    } else {
        initAndStart(options);
    }
}

/**
 * Start the backgroundscanner
 */
function startBackgroundScanner(networkIdentifier) {
    if (OS_IOS) {
        // Remove the eventlisteners if the service is stopped
        Ti.App.currentService.addEventListener('stop', function() {
            stop();
        });
    }

    start({
        backgroundMode: true,
        networkId: networkIdentifier
    });
}

/**
 * Stop scanning
 */
function stop() {
    Alloy.Globals.sensimityEvent.off('sensimity:beaconsRefreshed', restartScanner);
    if (!_.isUndefined(Alloy.Globals.sensimityScanner)) {
        Alloy.Globals.sensimityScanner.stopScanning();
    }
    Alloy.Globals.sensimityScanner = undefined;
}

module.exports = {
    'start': start,
    'stop': stop,
    'startBackgroundScan': startBackgroundScanner,
    'client': sensimityClient,
    'getKnownBeacons': knownBeaconsService.getKnownBeacons
};

// Start background intent for Android
function startBackgroundIntent() {
    if (OS_ANDROID) {
        Alloy.Globals.scanIntent = Ti.Android.createServiceIntent({
            url: Alloy.CFG.sensimity.backgroundService
        });
        if (Ti.Android.isServiceRunning(Alloy.Globals.scanIntent)) {
            Ti.Android.stopService(Alloy.Globals.scanIntent);
        }
        var service = Ti.Android.createService(Alloy.Globals.scanIntent);
        service.start();
    }
}

// initialize the scanner and start scanning on added network identifier
function initAndStart(options) {
    init();
    if (_.isUndefined(Alloy.Globals.sensimityScanner) && !_.isNull(Alloy.Globals.sensimityScanner)) {
        createScanner(options);
        initScannerAndStartScanning(options);
    } else {
        Ti.API.warn('Scanner already defined, please destruct first before start scanning');
    }
}

function init() {
    // Initialize the backgroundservice for iOS
    if (OS_IOS && !_.isUndefined(Alloy.CFG.sensimity.backgroundService)) {
        Ti.App.iOS.registerBackgroundService({
            url: Alloy.CFG.sensimity.backgroundService
        });
    }
}

// Create an scanner, specific for the running platform
function createScanner(options) {
    if (OS_ANDROID) {
        // Android, use the Drtechscanner to scan iBeacons
        var drtechScanner = require('./scanners/drtech');
        Alloy.Globals.sensimityScanner = drtechScanner(options.backgroundMode);
    } else if (OS_IOS) {
        // iOS, use the beuckmanscanner to scan iBeacons
        var beuckmanScanner = require('./scanners/beuckman');
        Alloy.Globals.sensimityScanner = beuckmanScanner();
    }
}

// Initialize the sensimityscanner and start scanning on added networkID
function initScannerAndStartScanning(options) {
    if (!_.isUndefined(options.networkId) && !_.isNull(options.networkId)) {
        Alloy.Globals.sensimityScanner.init(options.networkId);
        Alloy.Globals.sensimityScanner.startScanning();
        Alloy.Globals.sensimityEvent.on('sensimity:beaconsRefreshed', restartScanner);
    } else {
        Ti.API.warn('Please add a networkId, scanner not started');
    }
}

// After refreshing beacons, restart the scanner
function restartScanner() {
    if (!_.isUndefined(Alloy.Globals.sensimityScanner)) {
        Alloy.Globals.sensimityScanner.stopScanning();
        Alloy.Globals.sensimityScanner.startScanning();
    }
}
