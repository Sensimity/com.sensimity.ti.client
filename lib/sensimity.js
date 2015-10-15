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
 * Initialize the scanner and start scanning on added network identifier
 */
function start(options) {
    if (_.isUndefined(Alloy.Globals.sensimityScanner)) {
        Alloy.Globals.sensimityScanner = createScanner(options);
        initScannerAndStartScanning(options);
    } else {
        Ti.API.warn('Scanner already defined, please destruct first before start scanning');
    }
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

/**
 * Start background intent for Android
 */
function runService() {
    if (OS_ANDROID && !_.isUndefined(Alloy.CFG.sensimity.backgroundService)) {
        var intent = Ti.Android.createServiceIntent({
            url: Alloy.CFG.sensimity.backgroundService,
            startMode: Ti.Android.START_REDELIVER_INTENT
        });
        if (!Ti.Android.isServiceRunning(intent)) {
            Ti.Android.startService(intent);
        }
    }
}

module.exports = {
    'start': start,
    'stop': stop,
    'runService': runService,
    'client': sensimityClient,
    'getKnownBeacons': knownBeaconsService.getKnownBeacons
};

// Create an scanner, specific for the running platform
function createScanner(options) {
    if (OS_ANDROID) {
        var runInService = false;
        if (_.isBoolean(options.runInService)) {
            runInService = options.runInService;
        }
        // Android, use the altbeaconscanner to scan iBeacons
        var altbeaconScanner = require('./scanners/altbeacon');
        return altbeaconScanner(runInService);
    } else if (OS_IOS) {
        // iOS, use the beuckmanscanner to scan iBeacons
        var beuckmanScanner = require('./scanners/beuckman');
        return beuckmanScanner();
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
