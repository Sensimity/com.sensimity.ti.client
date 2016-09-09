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
        knownBeaconService = require('./../service/knownBeacons'),
        pathsenseLib = null,
        scanning = false;

    /**
     * Public functions
     */

    /**
     * Initialise the scanner.
     * @param networkIdentifier the identifier of the Sensimity-network which must be scanned
     */
    this.init = function (networkIdentifier, hooks = {}) {
        if (_.isUndefined(networkIdentifier)) {
            Ti.API.warn('Network identifier is undefined. Scanner not initialized');
            return;
        }

        self.networkId = networkIdentifier;
        self.hooks = hooks;
        initializeHooks();

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
        // Check the hook is defined. If the 'getRegionsToMonitor' hook is defined, that
        // will be called. If it's not defined the default scan strategy will be used.
        self.bindService(
            _.isFunction(self.hooks.getRegionsToMonitor) ?
            updateRegionsToMonitor :
            this.startScanningAfterBinding
        );
    };

    this.startScanningAfterBinding = (knownBeacons = knownBeaconService.getKnownBeacons(self.networkId)) => {
        const bleBeacons = knownBeacons.filter(knownBeacon => !knownBeacon.get('is_geofence'));
        const geofenceBeacons = knownBeacons.filter(knownBeacon => knownBeacon.get('is_geofence'));
        self.addAllEventListeners();
        startScanningOfKnownBeacons(bleBeacons);
        startScanningGeofences(geofenceBeacons);
        scanning = true;
    };

    function getGeofenceRegions(geofenceBeacons) {
        // Convert beacons into the expected geofence format
        return geofenceBeacons.map((beacon) => {
            const identifier = `${beacon.get('beacon_id')}|${beacon.get('UUID')}|${beacon.get('major')}|${beacon.get('minor')}`;
            return {
                identifier,
                latitude: beacon.get('latitude'),
                longitude: beacon.get('longitude'),
                radius: 100,
            };
        });
    }

    /**
     * When the hook 'getRegionsToMonitor' isn't defined, use the default scanning of geofences
     */
    function defaultScanGeofences(pathsense, geofenceBeacons) {
        let nearestGeofenceRegions = getGeofenceRegions(geofenceBeacons);
        // Use the current position to detect the 20 nearest geofences within 7500 m
        Ti.Geolocation.getCurrentPosition((e) => {
            if (e.success) {
                nearestGeofenceRegions = pathsense.sortRegionsByDistance(nearestGeofenceRegions, {
                    latitude: e.coords.latitude,
                    longitude: e.coords.longitude,
                }, 7500); // Detect only the nearest geofences within 7.5 km
            }

            // Geofence only the first 20 regions
            _.first(nearestGeofenceRegions, 20).forEach((region) => {
                pathsense.startMonitoring(region);
            });
        });
    }

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

    function initializeHooks(hooks)  {
        // Make sure no duplicate eventlisteners are defined
        Ti.App.removeEventListener('sensimity:hooks:updateRegionsToMonitor', updateRegionsToMonitor);
        Ti.App.addEventListener('sensimity:hooks:updateRegionsToMonitor', updateRegionsToMonitor);
    }

    function updateRegionsToMonitor() {
        if (!_.isFunction(self.hooks.getRegionsToMonitor)) {
            return;
        }
        const knownBeacons = knownBeaconService.getKnownBeacons(self.networkId);
        const beaconsToMonitor = self.hooks.getRegionsToMonitor(knownBeacons);
        self.Beacons.stopMonitoringAllRegions();
        self.beaconRegions = [];
        //FIXME: aren't we duplicating the beacon event listeners here in the end?
        self.startScanningAfterBinding(beaconsToMonitor);
    }

    this.isScanning = function() {
        return scanning;
    };

    /**
     * Destruct the scanner
     */
    this.destruct = function () {
        scanning = false;
        Ti.App.removeEventListener('sensimity:hooks:updateRegionsToMonitor', updateRegionsToMonitor);
        stopScanningGeofences();
        if (pathsenseLib !== null) {
            pathsenseLib.destruct();
        }
        self.beaconRegions = [];
    };

    /**
     * Private functions
     */

    // Start the scanning of found beacons
    function startScanningOfKnownBeacons(knownBeacons) {
        _.each(knownBeacons, function (knownBeacon) {
            if (!_.isEqual(knownBeacon.get('UUID'), null)) {
                startScanningOfBLEBeacon(knownBeacon);
            }
        });
    }

    /**
     * Start scanning geofences
     * @param geofenceBeacons
     */
    function startScanningGeofences(geofenceBeacons) {
        // fallback for locations who don't have physical-BLE-Beacons
        if (geofenceBeacons.length === 0) {
            return;
        }
        pathsenseLib = require('./../scanners/pathsense');
        pathsenseLib.init();
        stopScanningGeofences();
        // The regions are already filtered by using the hook, so start monitoring directly
        if (_.isFunction(self.hooks.getRegionsToMonitor)) {
            scanGeofencesWithoutLocationDetection(pathsenseLib, geofenceBeacons);
            return;
        }

        defaultScanGeofences(pathsenseLib, geofenceBeacons);
    }

    // Stop scanning geofences
    function stopScanningGeofences() {
        if (pathsenseLib === null) {
            return;
        }
        pathsenseLib.stopMonitoring();
    }

    function scanGeofencesWithoutLocationDetection(pathsense, geofenceBeacons) {
        const geofenceRegions = getGeofenceRegions(geofenceBeacons);
        geofenceRegions.forEach((region) => {
            pathsense.startMonitoring(region);
        });
    }

    /**
     * Start scanning of a BLE-beacon
     * @param knownBeacon The BLE-beacon which will be scanning
     */
    function startScanningOfBLEBeacon(knownBeacon) {
        // Reduce scanned beaconregions
        if (isBLEBeaconRegionScanning(knownBeacon)) {
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
    function isBLEBeaconRegionScanning(knownBeacon) {
        // Check beaconregion already scanning
        return _.some(self.beaconRegions, function (region) {
            return region.uuid.toUpperCase() === knownBeacon.get('UUID').toUpperCase();
        });
    }
};

module.exports = BaseScanner;
