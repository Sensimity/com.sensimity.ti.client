/* Compatibility for Ti standalone (without Alloy) */
if (typeof OS_ANDROID === "undefined") {
    var OS_ANDROID = Ti.Platform.name === "android";
    var OS_IOS = Ti.Platform.name === "iPhone OS";
}

/* jshint ignore:start */
var Alloy = require('alloy'),
    _ = require('alloy/underscore')._,
    Backbone = require('alloy/backbone');
/* jshint ignore:end */

/**
 * Abstract BaseScanner. Please use this function as a self object. Add a custom beaconmapper, beaconregionmapper and beaconregionmonitoringmapper.
 * @param beaconMapper Beaconmapper to map a foundbeacon in a beacon who can handled by the beaconhandler
 * @param beaconRegionMapper BeaconRegionMapper to convert a knownbeacon in a beaconregion.
 * @param beaconRegionMonitoringMapper BeaconRegionMonitoringMapper to convert a knownbeacon in a beaconregion which can be monitored.
 * @constructor Use this basescanner as an abstract function. Please set in the child function var self = BaseScanner();
 */
var BaseScanner = function (beaconMapper, beaconRegionMapper, beaconRegionMonitoringMapper) {
    var self = this,
        beaconHandler = require('./../handlers/beaconHandler'),
        beaconLog = require('./../service/beaconLog'),
        knownBeaconService = require('./../service/knownBeacons');

    /**
     * Public functions
     */

    /**
     * Initialise the scanner.
     * @param networkIdentifier the identifier of the Sensimity-network which must be scanned
     */
    this.init = function (networkIdentifier) {
        if (!_.isUndefined(networkIdentifier)) {
            self.checkBluetooth();
            self.networkId = networkIdentifier;
            // Request authorization is required on IOS devices
            if (OS_IOS) {
                Ti.Geolocation.requestAuthorization(Ti.Geolocation.AUTHORIZATION_ALWAYS);
            }

            beaconHandler.init();
            beaconLog.init();
            self.setBeaconRegions([]);
            if (OS_ANDROID || (OS_IOS && Ti.App.arguments.launchOptionsLocationKey === false)) {
                knownBeaconService.refreshBeacons([self.networkId]);
            }
        } else {
            Ti.API.warn('Network identifier is undefined. Scanner not initialized');
        }
    };

    /**
     * Setter for the beaconRegions which will be scanned
     * @param beaconRegions The setting beaconRegions
     */
    this.setBeaconRegions = function (beaconRegions) {
        self.beaconRegions = beaconRegions;
    };

    /**
     * Start scanning of beacons in setting beaconId
     */
    this.startScanning = function () {
        self.bindService(this.startScanningAfterBinding);
    };

    this.startScanningAfterBinding = function () {
        var knownBeacons = knownBeaconService.getKnownBeacons(self.networkId);
        if (!_.isEmpty(knownBeacons)) {
            startScanningOfKnownBeacons(knownBeacons);
        }
        self.addAllEventListeners();
    };

    /**
     * Map a found beacon and start the beaconHandler
     * @param beaconRaw A raw beacon found by the beaconscanner
     */
    this.beaconFound = function (beaconRaw) {
        if (_.isUndefined(beaconRaw.rssi)) {
            return;
        }
        var rssi = parseInt(beaconRaw.rssi);
        if (_.isEqual(rssi, 0)) {
            return;
        }
        var beacon = beaconMapper.map(beaconRaw);
        beaconLog.insertBeaconLog(beacon);
        beaconHandler.handle(beacon);
    };

    /**
     * Destruct the scanner
     */
    this.destruct = function () {
        self.beaconRegions = [];
    };

    /**
     * Private functions
     */

    // Start the scanning of found beacons
    function startScanningOfKnownBeacons(knownBeacons) {
        _.each(knownBeacons, function (knownBeacon) {
            if (!_.isEqual(knownBeacon.get('UUID'), null)) {
                startScanningOfBeacon(knownBeacon);
            }
        });
    }

    /**
     * Start scanning of a beacon
     * @param knownBeacon The beacon which will be scanning
     */
    function startScanningOfBeacon(knownBeacon) {
        // Reduce scanned beaconregions
        if (isBeaconRegionScanning(knownBeacon)) {
            return;
        }

        var beaconRegionMonitoring = beaconRegionMonitoringMapper.map(knownBeacon);
        var beaconRegion = beaconRegionMapper.map(knownBeacon);
        self.Beacons.startMonitoringForRegion(beaconRegionMonitoring);
        self.beaconRegions.push(beaconRegion);
    }

    /**
     * If check beaconregion is already scanning
     * @param knownBeacon Check this beacon scanned now
     * @returns false if beaconRegion is scanning, true if not scanning
     */
    function isBeaconRegionScanning(knownBeacon) {
        // Check beaconregion already scanning
        return _.some(self.beaconRegions, function (region) {
            return _.isEqual(region.uuid.toUpperCase(), knownBeacon.get('UUID').toUpperCase());
        });
    }
};

module.exports = BaseScanner;
