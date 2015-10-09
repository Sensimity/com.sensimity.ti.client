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

    self.checkBluetooth = function () {
        self.Beacons.addEventListener('bluetoothStatus', self.bluetoothStatusHandler);
    };

    self.bluetoothStatusHandler = function (e) {
        if (e.status !== "on") {
            alert('Voor een optimale gebruikerservaring is het vereist om de bluetooth te hebben ingeschakeld');
        }
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
        self.destruct();
    };

    // Add eventlisteners, called by startingscan in Basescanner
    self.addAllEventListeners = function () {
        self.Beacons.addEventListener('enteredRegion', self.enterRegion);
        self.Beacons.addEventListener('exitedRegion', self.exitRegion);
        self.Beacons.addEventListener('beaconRanges', self.beaconRangerHandler);
        self.Beacons.addEventListener('beaconProximity', self.beaconFound);
        self.Beacons.addEventListener('determinedRegionState', self.regionState);
    };

    // Remove eventlisteners on stop scanning
    self.removeAllEventListeners = function () {
        self.Beacons.removeEventListener('enteredRegion', self.enterRegion);
        self.Beacons.removeEventListener('exitedRegion', self.exitRegion);
        self.Beacons.removeEventListener('beaconRanges', self.beaconRangerHandler);
        self.Beacons.removeEventListener('beaconProximity', self.beaconFound);
        self.Beacons.removeEventListener('determinedRegionState', self.regionState);
        self.Beacons.removeEventListener('bluetoothStatus', self.bluetoothStatusHandler);
    };

    return self;
}

module.exports = Beuckman;
