var BaseScanner = require('./../scanners/base');
var beaconMapper = require('./../mapper/beuckman/beacon');
var beaconRegionMapper = require('./../mapper/beuckman/beaconRegion');
var beaconRegionMonitoringMapper = require('./../mapper/beuckman/beaconRegionMonitoring');

/**
 * Drtech scanner to scan iBeacons on Android devices
 * @param backgroundMode Parameter to handle beacons when the application is running in backgroundmode
 * @returns {BaseScanner}
 */
function drtechScanner(backgroundMode) {
    var self = new BaseScanner(beaconMapper, beaconRegionMapper, beaconRegionMonitoringMapper);
    self.Beacons = require('com.drtech.altbeacon');

    // Bind the beaconservice
    self.bindService = function() {
        self.Beacons.setAutoRange(true);
        self.Beacons.setBackgroundMode(backgroundMode);
        self.Beacons.setScanPeriods({
            foregroundScanPeriod: Number.MAX_VALUE, // Ensure beacons not scanned on foreground-mode
            foregroundBetweenScanPeriod: Number.MAX_VALUE, // Ensure beacons not scanned on foreground-mode
            backgroundScanPeriod: 1200,
            backgroundBetweenScanPeriod: 2300
        });
        self.Beacons.addBeaconLayout('m:2-3=0215,i:4-19,i:20-21,i:22-23,p:24-24');
        self.Beacons.bindBeaconService();
    };

    // Stop scanning
    self.stopScanning = function() {
        if (self.Beacons.beaconServiceIsBound()) {
            self.Beacons.stopMonitoringAllRegions();
        }
        self.removeAllEventListeners();
        self.destruct();
    };

    // Add eventlisteners for scanning beacons
    self.addAllEventListeners = function() {
        self.Beacons.addEventListener('beaconProximity', self.beaconFound);
    };

    // Remove eventlisteners when the scanning is stopped
    self.removeAllEventListeners = function() {
        self.Beacons.removeEventListener('beaconProximity', self.beaconFound);
    };

    return self;
}

module.exports = drtechScanner;
