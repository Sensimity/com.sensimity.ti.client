/* jshint ignore:start */
var Alloy = require('alloy'),
    _ = require('alloy/underscore')._,
    Backbone = require('alloy/backbone');
/* jshint ignore:end */

var BaseScanner = require('./../scanners/base');
var beaconMapper = require('./../mapper/altbeacon/beacon');
var beaconRegionMapper = require('./../mapper/altbeacon/beaconRegion');
var beaconRegionMonitoringMapper = require('./../mapper/altbeacon/beaconRegionMonitoring');

/**
 * Altbeacon scanner to scan iBeacons on Android devices
 * @param boolean backgroundMode - Parameter to handle beacons when the application is running in backgroundmode
 * @returns {BaseScanner}
 */
function altbeaconScanner(runInService) {
    var self = new BaseScanner(beaconMapper, beaconRegionMapper, beaconRegionMonitoringMapper);
    self.Beacons = require('com.drtech.altbeacon');
    self.scanPeriods = {
        'proactive': {
            foregroundScanPeriod: 1101,
            foregroundBetweenScanPeriod: 0,
            backgroundScanPeriod: 5001,
            backgroundBetweenScanPeriod: 60001
        },
        'aggressive': {
            foregroundScanPeriod: 1001,
            foregroundBetweenScanPeriod: 0,
            backgroundScanPeriod: 2001,
            backgroundBetweenScanPeriod: 5001
        }
    };

    self.isBLESupported = function () {
        return self.Beacons.isBLESupported();
    };

    self.isBLEEnabled = function (callback) {
        if (!_.isFunction(callback)) {
            Ti.API.warn('please define a function callback, ble status cannot be retrieved');
            return;
        }
        callback(self.Beacons.checkAvailability());
    };

    // Bind the beaconservice
    self.bindService = function (bindCallback) {
        var handleServiceBind = function () {
            self.Beacons.removeEventListener("serviceBound", handleServiceBind);
            bindCallback();
        };
        self.Beacons.setAutoRange(true);
        self.Beacons.setRunInService(runInService);
        self.Beacons.addBeaconLayout('m:2-3=0215,i:4-19,i:20-21,i:22-23,p:24-24');
        // Start scanning after binding beaconservice
        self.Beacons.addEventListener("serviceBound", handleServiceBind);
        self.Beacons.bindBeaconService();
    };

    // Stop scanning
    self.stopScanning = function () {
        if (self.Beacons.beaconServiceIsBound()) {
            self.Beacons.stopMonitoringAllRegions();
            self.Beacons.unbindBeaconService();
        }
        self.removeAllEventListeners();
        self.destruct();
    };

    // Add eventlisteners for scanning beacons
    self.addAllEventListeners = function () {
        self.Beacons.addEventListener('beaconProximity', self.beaconFound);
    };

    // Remove eventlisteners when the scanning is stopped
    self.removeAllEventListeners = function () {
        self.Beacons.removeEventListener('beaconProximity', self.beaconFound);
    };

    // Set backgroundmode to save power in background
    self.setBackgroundMode = function (value) {
        self.Beacons.setBackgroundMode(value);
    };

    self.setBehavior = function (period) {
        if (!_.has(self.scanPeriods, period)) {
            Ti.API.warn('behavior cannot be set. Only values \'proactive\' or \'aggressive\' are applicable');
        }
        self.Beacons.setScanPeriods(self.scanPeriods[period]);
    };

    return self;
}

module.exports = altbeaconScanner;
