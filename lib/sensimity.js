'use strict';
/* Compatibility for Ti standalone (without Alloy) */
if (typeof OS_ANDROID === "undefined") {
    var OS_ANDROID = Ti.Platform.name === "android";
    var OS_IOS = Ti.Platform.name === "iPhone OS";
}

var dispatcher = require('./dispatcher');

/**
 * Initialize the sensimityscanner and start the scanner if running on foreground
 * @param params The params to set. Add networkId to set which network must be scanned.
 */
function start(params) {
    var options = _.defaults(params || {}, {
        backgroundMode: false
    });

    initAndStart(options);
}

/**
 * Stop scanning
 */
function stop() {
    dispatcher.off('sensimity:beaconsRefreshed', handleBeaconRefresh);
    if (!_.isUndefined(Alloy.Globals.sensimityScanner)) {
        Alloy.Globals.sensimityScanner.stopScanning();
    }
    Alloy.Globals.sensimityScanner = undefined;
}

module.exports = {
    'dispatcher': dispatcher,
    'start': start,
    'stop': stop
};

// initialize the scanner and start scanning on added network identifier
function initAndStart(options) {
    if (_.isUndefined(Alloy.Globals.sensimityScanner) && !_.isNull(Alloy.Globals.sensimityScanner)) {
        createScanner(options);
        initScannerAndStartScanning(options);
    } else {
        Ti.API.warn('Scanner already defined, please destruct first before start scanning');
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
    if (!_.isNull(options.networkId)) {
        Alloy.Globals.sensimityScanner.init(options.networkId);
        Alloy.Globals.sensimityScanner.startScanning();
        dispatcher.on('sensimity:beaconsRefreshed', handleBeaconRefresh);
    } else {
        Ti.API.warn('Please add a networkId, scanner not started');
    }
}

// After refreshing beacons, restart the scanner
function handleBeaconRefresh() {
    if (!_.isUndefined(Alloy.Globals.sensimityScanner)) {
        Alloy.Globals.sensimityScanner.stopScanning();
        Alloy.Globals.sensimityScanner.startScanning();
    }
}
