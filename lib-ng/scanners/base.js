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
        if (_.isUndefined(networkIdentifier)) {
            Ti.API.warn('Network identifier is undefined. Scanner not initialized');
            return;
        }

        self.networkId = networkIdentifier;

        if (!OS_IOS) {
            self.prepareForScanning();
            return;
        }

        self.handleiOSLocationPermissions();
    };

    this.prepareForScanning = function () {
        beaconHandler.init();
        beaconLog.init();
        self.setBeaconRegions([]);
        if (OS_IOS && Ti.App.arguments.launchOptionsLocationKey) {
            // Do not refresh beacons if the app has been started based on an enter/exited region event
            return;
        }
        knownBeaconService.refreshBeacons([self.networkId]);
    };

    this.isOldTiVersion = function () {
        var version = Ti.version.split(".");
        if (version[0] < 5) { // Version < 5
            return true;
        }
        return (version[0] === 5 && version[1] === 0); // Version 5.0.*
    };

    this.handleiOSLocationPermissions = function () {
        // Handle iOS
        var permissionType = Ti.Geolocation.AUTHORIZATION_ALWAYS;
        if (self.isOldTiVersion()) { // Version 5.0.*
            // BC: request permission the old way for Titanium < 5.0
            Ti.Geolocation.requestAuthorization(permissionType);
            self.prepareForScanning();
            return;
        }

        if (Ti.Geolocation.hasLocationPermissions(permissionType)) {
            self.prepareForScanning();
            return;
        }

        // Request permission and wait for success
        Ti.Geolocation.requestLocationPermissions(permissionType, function(res) {
            if (res.success) {
                self.prepareForScanning();
            }
        });
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
        var realBeacons = knownBeacons.filter(knownBeacon => !knownBeacon.get('is_geofence'));
        var geofenceBeacons = knownBeacons.filter(knownBeacon => knownBeacon.get('is_geofence'));
        startScanningOfKnownBeacons(realBeacons);
        self.addAllEventListeners();
        self.startScanningGeofences(geofenceBeacons);
    };

    this.startScanningGeofences = function(geofenceBeacons) {
        // fallback for locations who doesn't have physical-BLE-Beacons
        if (geofenceBeacons.length === 0) {
            return;
        }
        const geofenceLib = require('./../scanners/geofence');
        geofenceLib.init();
        geofenceLib.stopMonitoring();
        geofenceBeacons.forEach((beacon) => {
            const identifier = `${beacon.get('beacon_id')}|${beacon.get('UUID')}|${beacon.get('major')}|${beacon.get('minor')}`;
            geofenceLib.startMonitoring({
                identifier,
                latitude: beacon.get('latitude'),
                longitude: beacon.get('longitude'),
                radius: 100,
            });
        });
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
