import beaconHandler from './../handlers/beaconHandler';
import beaconLog from './../service/beaconLog';
import knownBeaconService from './../service/knownBeacons';

/**
 * Abstract BaseScanner. Please use this function as a self object. Add a custom beaconmapper, beaconregionmapper and beaconregionmonitoringmapper.
 * @param beaconMapper Beaconmapper to map a foundbeacon in a beacon who can handled by the beaconhandler
 * @param beaconRegionMapper BeaconRegionMapper to convert a knownbeacon in a beaconregion.
 * @param beaconRegionMonitoringMapper BeaconRegionMonitoringMapper to convert a knownbeacon in a beaconregion which can be monitored.
 * @constructor Use this basescanner as an abstract function. Please set in the child function var self = BaseScanner();
 */
export default class BaseScanner {
  constructor(beaconMapper, beaconRegionMapper, beaconRegionMonitoringMapper) {
    this.beaconMapper = beaconMapper;
    this.beaconRegionMapper = beaconRegionMapper;
    this.beaconRegionMonitoringMapper = beaconRegionMonitoringMapper;
    this.scanning = false;
    this.pathsenseLib = null;
    this.updateRegionsToMonitor = this.updateRegionsToMonitor.bind(this);
  }
  /**
    * Initialise the scanner.
    * @param networkIdentifier the identifier of the Sensimity-network which must be scanned
    */
  init(networkId, hooks = {}) {
    if (_.isUndefined(networkId)) {
      Ti.API.warn('Network identifier is undefined. Scanner not initialized');
      return;
    }

    this.networkId = networkId;
    this.hooks = hooks;
    this.initializeHooks();

    if (Ti.Platform.name !== 'iPhone OS') {
      this.prepareForScanning();
      return;
    }

    this.handleiOSLocationPermissions();
  }

  prepareForScanning() {
    beaconHandler.init();
    beaconLog.init();
    this.setBeaconRegions([]);

    if (Ti.Platform.name === 'iPhone OS' && Ti.App.arguments.launchOptionsLocationKey) {
      // Do not refresh beacons if the app has been started based on an enter/exited region event
      return;
    }
    knownBeaconService.refreshBeacons([this.networkId]);
  }

  isOldTiVersion() {
    const version = Ti.version.split('.');
    if (version[0] < 5) { // Version < 5
      return true;
    }
    return (version[0] === 5 && version[1] === 0); // Version 5.0.*
  }

  handleiOSLocationPermissions() {
      // Handle iOS
    const permissionType = Ti.Geolocation.AUTHORIZATION_ALWAYS;
    if (this.isOldTiVersion()) { // Version 5.0.*
      // BC: request permission the old way for Titanium < 5.0
      Ti.Geolocation.requestAuthorization(permissionType);
      this.prepareForScanning();
      return;
    }

    if (Ti.Geolocation.hasLocationPermissions(permissionType)) {
      this.prepareForScanning();
      return;
    }

      // Request permission and wait for success
    Ti.Geolocation.requestLocationPermissions(permissionType, res => {
      if (res.success) {
        this.prepareForScanning();
      }
    });
  }

  /**
   * Setter for the beaconRegions which will be scanned
   * @param beaconRegions The setting beaconRegions
   */
  setBeaconRegions(beaconRegions) {
    this.beaconRegions = beaconRegions;
  }

  /**
   *  Start scanning of beacons in setting beaconId
   */
  startScanning() {
    // Check the hook is defined. If the 'getRegionsToMonitor' hook is defined, that
    // will be called. If it's not defined the default scan strategy will be used.
    this.bindService(
       _.isFunction(this.hooks.getRegionsToMonitor) ?
       this.updateRegionsToMonitor :
       this.startScanningAfterBinding
    );
  }

  startScanningAfterBinding(knownBeacons = knownBeaconService.getKnownBeacons(this.networkId)) {
    const bleBeacons = knownBeacons.filter(knownBeacon => !knownBeacon.get('is_geofence'));
    const geofenceBeacons = knownBeacons.filter(knownBeacon => knownBeacon.get('is_geofence'));
    this.addAllEventListeners();
    this.startScanningOfKnownBeacons(bleBeacons);
    this.startScanningGeofences(geofenceBeacons);
    this.scanning = true;
  }

  getGeofenceRegions(geofenceBeacons) {
    // Convert beacons into the expected geofence format
    return geofenceBeacons.map(beacon => {
      const identifier = `${beacon.get('beacon_id')}|${beacon.get('UUID')}|${beacon.get('major')}|${beacon.get('minor')}`;
      return {
        identifier,
        latitude: beacon.get('latitude'),
        longitude: beacon.get('longitude'),
        radius: 100,
      };
    });
  }

  updateRegionsToMonitor() {
    if (!_.isFunction(this.hooks.getRegionsToMonitor)) {
      return;
    }
    const knownBeacons = knownBeaconService.getKnownBeacons(this.networkId);
    const beaconsToMonitor = this.hooks.getRegionsToMonitor(knownBeacons);
    this.Beacons.stopMonitoringAllRegions();
    this.beaconRegions = [];
    // FIXME: aren't we duplicating the beacon event listeners here in the end?
    this.startScanningAfterBinding(beaconsToMonitor);
  }

  /**
    * When the hook 'getRegionsToMonitor' isn't defined, use the default scanning of geofences
    */
  defaultScanGeofences(pathsense, geofenceBeacons) {
    let nearestGeofenceRegions = this.getGeofenceRegions(geofenceBeacons);
      // Use the current position to detect the 20 nearest geofences within 7500 m
    Ti.Geolocation.getCurrentPosition((e) => {
      if (e.success) {
        nearestGeofenceRegions = pathsense.sortRegionsByDistance(nearestGeofenceRegions, {
          latitude: e.coords.latitude,
          longitude: e.coords.longitude,
        }, 7500); // Detect only the nearest geofences within 7.5 km
      }

      // Geofence only the first 20 regions
      _.each(_.first(nearestGeofenceRegions, 20), region => pathsense.startMonitoring(region));
    });
  }

  /**
    * Map a found beacon and start the beaconHandler
    * @param beaconRaw A raw beacon found by the beaconscanner
    */
  beaconFound(beaconRaw) {
    if (_.isUndefined(beaconRaw.rssi)) { return; }

    const rssi = parseInt(beaconRaw.rssi, 10);
    if (_.isEqual(rssi, 0)) { return; }

    const beacon = this.beaconMapper.map(beaconRaw);
    beaconLog.insertBeaconLog(beacon);
    beaconHandler.handle(beacon);
  }

  initializeHooks() {
    // Make sure no duplicate eventlisteners are defined
    Ti.App.removeEventListener('sensimity:hooks:updateRegionsToMonitor', this.updateRegionsToMonitor);
    Ti.App.addEventListener('sensimity:hooks:updateRegionsToMonitor', this.updateRegionsToMonitor);
  }

  isScanning() {
    return this.scanning;
  }

  /**
   * Destruct the scanner
   */
  destruct() {
    this.scanning = false;
    Ti.App.removeEventListener('sensimity:hooks:updateRegionsToMonitor', this.updateRegionsToMonitor);
    this.stopScanningGeofences();
    if (this.pathsenseLib !== null) {
      this.pathsenseLib.destruct();
    }
    this.beaconRegions = [];
  }

  /**
   * Private functions
   */

  // Start the scanning of found beacons
  startScanningOfKnownBeacons(knownBeacons) {
    _.each(knownBeacons, knownBeacon => {
      if (!_.isEqual(knownBeacon.get('UUID'), null)) {
        this.startScanningOfBLEBeacon(knownBeacon);
      }
    });
  }

  /**
   * Start scanning geofences
   * @param geofenceBeacons
   */
  startScanningGeofences(geofenceBeacons) {
      // fallback for locations who don't have physical-BLE-Beacons
    if (geofenceBeacons.length === 0) {
      return;
    }
    this.pathsenseLib = require('./../scanners/pathsense')();
    this.stopScanningGeofences();
    // The regions are already filtered by using the hook, so start monitoring directly
    if (_.isFunction(this.hooks.getRegionsToMonitor)) {
      this.scanGeofencesWithoutLocationDetection(this.pathsenseLib, geofenceBeacons);
      return;
    }

    this.defaultScanGeofences(this.pathsenseLib, geofenceBeacons);
  }

  // Stop scanning geofences
  stopScanningGeofences() {
    if (this.pathsenseLib === null) {
      return;
    }
    this.pathsenseLib.stopMonitoring();
  }

  scanGeofencesWithoutLocationDetection(pathsense, geofenceBeacons) {
    const geofenceRegions = this.getGeofenceRegions(geofenceBeacons);
    _.each(geofenceRegions, region => pathsense.startMonitoring(region));
  }

  /**
   * Start scanning of a BLE-beacon
   * @param knownBeacon The BLE-beacon which will be scanning
   */
  startScanningOfBLEBeacon(knownBeacon) {
      // Reduce scanned beaconregions
    if (this.isBLEBeaconRegionScanning(knownBeacon)) {
      return;
    }

    const beaconRegionMonitoring = this.beaconRegionMonitoringMapper.map(knownBeacon);
    const beaconRegion = this.beaconRegionMapper.map(knownBeacon);
    this.Beacons.startMonitoringForRegion(beaconRegionMonitoring);
    this.beaconRegions.push(beaconRegion);
  }

  /**
   * If check beaconregion is already scanning
   * @param knownBeacon Check this beacon scanned now
   * @returns false if beaconRegion is scanning, true if not scanning
   */
  isBLEBeaconRegionScanning(knownBeacon) {
      // Check beaconregion already scanning
    return _.some(this.beaconRegions, region =>
     region.uuid.toUpperCase() === knownBeacon.get('UUID').toUpperCase()
    );
  }
}
