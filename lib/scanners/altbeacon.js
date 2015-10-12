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
function altbeaconScanner(backgroundMode) {
    var self = new BaseScanner(beaconMapper, beaconRegionMapper, beaconRegionMonitoringMapper);
    self.Beacons = require('com.drtech.altbeacon');

    self.checkBluetooth = function () {
        if (!self.Beacons.checkAvailability()) {
            alert('Voor een optimale gebruikerservaring is het vereist om de bluetooth te hebben ingeschakeld');
        }
    };

    // Bind the beaconservice
    self.bindService = function (bindCallback) {
        var handleServiceBind = function () {
            self.Beacons.removeEventListener("serviceBound", handleServiceBind);
            bindCallback();
        };
        self.Beacons.setAutoRange(true);
        self.Beacons.setBackgroundMode(backgroundMode);
        self.Beacons.setScanPeriods({
            foregroundScanPeriod: 1200,
            foregroundBetweenScanPeriod: 1200,
            backgroundScanPeriod: 1200,
            backgroundBetweenScanPeriod: 1200
        });
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

    return self;
}

module.exports = altbeaconScanner;
