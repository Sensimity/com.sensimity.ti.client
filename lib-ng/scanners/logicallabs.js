/* jshint ignore:start */
var Alloy = require('alloy'),
    _ = require('alloy/underscore')._,
    Backbone = require('alloy/backbone');
/* jshint ignore:end */

var BaseScanner = require('./../scanners/base');
var beaconMapper = require('./../mapper/logicallabs/beacon');
var beaconRegionMapper = require('./../mapper/logicallabs/beaconRegion');
var beaconRegionMonitoringMapper = require('./../mapper/logicallabs/beaconRegionMonitoring');

/**
 * Logicallabs scanner to scan iBeacons on iOS devices
 * @param boolean backgroundMode - Parameter to handle beacons when the application is running in backgroundmode
 * @returns {BaseScanner}
 */
function logicallabsScanner() {
    var self = new BaseScanner(beaconMapper, beaconRegionMapper, beaconRegionMonitoringMapper);
    self.Beacons = require('com.logicallabs.beacons');

    self.checkBluetooth = function () {};

    // Bind the beaconservice
    self.bindService = function () {
        // Check if the device is running iOS 8 or later, before registering for local notifications
        if (parseInt(Ti.Platform.version.split(".")[0], 10) >= 8) {
            self.Beacons.requestAlwaysAuthorization();
        }
    };

    self.regionStateUpdated = function (e) {
        switch(e.state) {
            case self.Beacons.REGION_STATE_INSIDE:
                self.Beacons.startRangingBeacons({
                    beaconRegion: e.region
                });
                break;
            case self.Beacons.REGION_STATE_OUTSIDE:
                self.Beacons.stopRangingBeacons({
                    beaconRegion: e.region
                });
                break;
        }
    };

    self.beaconsFound = function (beacons) {
        _.each(beacons.beacons, function (beacon) {
            if (_.isUndefined(beacon) || _.isUndefined(beacon.RSSI)) {
                return;
            }
            beacon.rssi = beacon.RSSI;
            self.beaconFound(beacon);
        });
    };

    // Stop scanning
    self.stopScanning = function () {
        self.Beacons.stopRegionMonitoring();
        self.removeAllEventListeners();
        self.destruct();
    };

    // Add eventlisteners for scanning beacons
    self.addAllEventListeners = function () {
        self.Beacons.addEventListener('regionStateUpdated', self.regionStateUpdated);
        self.Beacons.addEventListener('rangedBeacons', self.beaconsFound);
    };

    // Remove eventlisteners when the scanning is stopped
    self.removeAllEventListeners = function () {
        self.Beacons.removeEventListener('regionStateUpdated', self.regionStateUpdated);
        self.Beacons.removeEventListener('rangedBeacons', self.beaconsFound);
    };

    return self;
}

module.exports = logicallabsScanner;
