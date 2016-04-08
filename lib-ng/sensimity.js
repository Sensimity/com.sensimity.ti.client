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
 * @param options {network_id: <network identifier to scan beacons>}
 * @param callback Callback to inform about the start of sensimity {success: <bool>, message: <string>}
 */
function start(options, callback) {
    // Only start Sensimity when bluetooth is enabled
    isBLEEnabled(function (value) {
        if (!value) {
            var message = 'Sensimity scan not started because BLE not enabled';
            Ti.API.warn(message);
            if (_.isFunction(callback)) {
                callback({
                    success: false,
                    message: message
                });
            }
            return;
        }

        if (_.isUndefined(Alloy.Globals.sensimityScanner) === false) {
            Ti.API.warn('Scanner already defined, please destruct first before start scanning');
        } else {
            Alloy.Globals.sensimityScanner = createScanner(options);
            initScannerAndStartScanning(options);
        }
        if (_.isFunction(callback)) {
            callback({
                success: true,
                message: 'Sensimity successfully started'
            });
        }
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

function pause() {
    if (!OS_ANDROID) {
        Ti.API.warn('sensimity pause not needed on other platforms than Android');
        return;
    }

    if (_.isUndefined(Alloy.Globals.sensimityScanner)) {
        Ti.API.warn('Scanner not initialized, please first initialize the sensimity library');
        return;
    }

    Alloy.Globals.sensimityScanner.setBackgroundMode(true);
}

function resume() {
    if (!OS_ANDROID) {
        Ti.API.warn('sensimity resume not needed on other platforms than Android');
        return;
    }

    if (_.isUndefined(Alloy.Globals.sensimityScanner)) {
        Ti.API.warn('Scanner not initialized, please first initialize the sensimity library');
        return;
    }

    Alloy.Globals.sensimityScanner.setBackgroundMode(false);
}

/**
 * Start background intent for Android
 * @param callback Callback to inform about the start of sensimity {success: <bool>, message: <string>}
 */
function runService(options, callback) {
    // Only start Sensimity when bluetooth is enabled
    isBLEEnabled(function (value) {
        if (!value) {
            var message = 'Sensimity scan not started because BLE not enabled';
            Ti.API.warn(message);
            if (_.isFunction(callback)) {
                callback({
                    success: false,
                    message: message
                });
            }
            return;
        }

        if (!OS_ANDROID || _.isUndefined(Alloy.CFG.sensimity.backgroundService)) {
            return;
        }

        var intent = Ti.Android.createServiceIntent({
            url: Alloy.CFG.sensimity.backgroundService,
            startMode: Ti.Android.START_REDELIVER_INTENT
        });
        if (_.isNumber(options.networkId)) {
            intent.putExtra('networkId', options.networkId);
        }
        if (Ti.Android.isServiceRunning(intent)) {
            Ti.Android.stopService(intent);
        }
        Ti.Android.startService(intent);
        if (_.isFunction(callback)) {
            callback({
                success: true,
                message: 'Sensimity successfully started in a Android service'
            });
        }
    });
}

function isBLESupported() {
    var scanner;
    if (OS_ANDROID) {
        scanner = require('./scanners/altbeacon')();
    } else if (OS_IOS) {
        scanner = require('./scanners/beuckman')();
    }
    return scanner.isBLESupported();
}

function isBLEEnabled(callback) {
    var scanner;
    if (OS_ANDROID) {
        scanner = require('./scanners/altbeacon')();
    } else if (OS_IOS) {
        scanner = require('./scanners/beuckman')();
    }
    scanner.isBLEEnabled(callback);
}

module.exports = {
    'start': start,
    'stop': stop,
    'pause': pause,
    'resume': resume,
    'runService': runService,
    'client': sensimityClient,
    'isBLESupported': isBLESupported,
    'isBLEEnabled': isBLEEnabled,
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
    if (_.has(options, 'networkId') && null !== options.networkId) {
        Alloy.Globals.sensimityScanner.init(options.networkId, getHooks(options));
        if (OS_ANDROID && _.has(options, 'behavior')) {
            Alloy.Globals.sensimityScanner.setBehavior(options.behavior);
        }
        Alloy.Globals.sensimityEvent.on('sensimity:beaconsRefreshed', restartScanner);
        Alloy.Globals.sensimityScanner.startScanning();
    } else {
        Ti.API.warn('Please add a networkId, scanner not started');
    }
}

function getHooks(options) {
    if (_.isObject(options.hooks)) {
        return options.hooks;
    }
    return {};
}

// After refreshing beacons, restart the scanner
function restartScanner() {
    if (!_.isUndefined(Alloy.Globals.sensimityScanner)) {
        Alloy.Globals.sensimityScanner.stopScanning();
        Alloy.Globals.sensimityScanner.startScanning();
    }
}
