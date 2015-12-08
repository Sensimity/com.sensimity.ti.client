/* jshint ignore:start */
var Alloy = require('alloy'),
    _ = require('alloy/underscore')._,
    Backbone = require('alloy/backbone');
/* jshint ignore:end */

var BaseScanner = require('./../scanners/base');
var beaconMapper = require('./../mapper/beuckman/beacon');
var beaconRegionMapper = require('./../mapper/beuckman/beaconRegion');
var beaconRegionMonitoringMapper = require('./../mapper/beuckman/beaconRegionMonitoring');

/**
 * Beuckman scanner to scan iBeacons on iOS
 * @returns {BaseScanner}
 * @constructor
 */
function Beuckman() {
    // set self = basescanner to use this function as an abstract function for the beuckmanfunction
    var self = new BaseScanner(beaconMapper, beaconRegionMapper, beaconRegionMonitoringMapper);
    self.Beacons = require('org.beuckman.tibeacons');

    self.isBLESupported = function () {
        return self.Beacons.isBLESupported();
    };

    self.isBLEEnabled = function (callback) {
        if (!_.isFunction(callback)) {
            Ti.API.warn('please define a function callback, ble status cannot be retrieved');
            return;
        }
        var handleBleStatus = function (e) {
            // Useless status See https://github.com/jbeuckm/TiBeacons/issues/24
            if (e.status === 'unknown') {
                return;
            }
            self.Beacons.removeEventListener('bluetoothStatus', handleBleStatus);
            if (e.status === 'on') {
                callback(true);
            } else {
                callback(false);
            }
        };
        self.Beacons.addEventListener('bluetoothStatus', handleBleStatus);

        self.Beacons.requestBluetoothStatus();
    };

    // Bindservice function is required in from the Basescanner, but Beuckman contains no bindoption
    self.bindService = function (bindCallback) {
        bindCallback();
    };

    // Start ranging beacons when a beaconregion is detected
    self.enterRegion = function (param) {
        self.Beacons.startRangingForBeacons(param);
    };

    // Stop ranging beacons for a region when a beaconregion is exited
    self.exitRegion = function (param) {
        self.Beacons.stopRangingForBeacons(param);
    };

    // Call beaconfound for every found beacon and handle the found beacons
    self.beaconRangerHandler = function (param) {
        param.beacons.forEach(function (beacon) {
            self.beaconFound(beacon);
        });
    };

    self.regionState = function (e) {
        if (e.regionState === 'inside') {
            self.Beacons.startRangingForBeacons({
                uuid: e.uuid,
                identifier: e.identifier
            });
        } else if (e.regionState === 'outside') {
            self.Beacons.stopRangingForBeacons({
                uuid: e.uuid,
                identifier: e.identifier
            });
        }
    };

    // override stopscanning
    self.stopScanning = function () {
        self.removeAllEventListeners();
        self.Beacons.stopMonitoringAllRegions();
        self.Beacons.stopRangingForAllBeacons();
        self.destruct();
    };

    // Add eventlisteners, called by startingscan in Basescanner
    self.addAllEventListeners = function () {
        self.Beacons.addEventListener('beaconRanges', self.beaconRangerHandler);
        self.Beacons.addEventListener('determinedRegionState', self.regionState);
    };

    // Remove eventlisteners on stop scanning
    self.removeAllEventListeners = function () {
        self.Beacons.removeEventListener('beaconRanges', self.beaconRangerHandler);
        self.Beacons.removeEventListener('determinedRegionState', self.regionState);
    };

    return self;
}

module.exports = Beuckman;
