import Altbeacon from '../scanners/Altbeacon';
import Beuckman from '../scanners/Beuckman';
import Pathsense from '../scanners/Pathsense';
import beaconHandler from '../handlers/beaconHandler';
import knownBeaconService from './knownBeacons';
import BeaconLog from './BeaconLog';
import { split, getNearestGeofences } from '../utils/regions';

export default class ScanService {
  constructor(args = {}) {
    if (_.isUndefined(args.networkId)) {
      Ti.API.warn('Network identifier is undefined. Can not scan');
      return;
    }

    this.options = Object.assign({
      runInService: false,
      hooks: {},
    }, args);
    beaconHandler.init();
    this.beaconLog = new BeaconLog();
    this.restart = this.restart.bind(this);
    Ti.App.addEventListener('sensimity:hooks:updateRegionsToMonitor', this.restart);

    if (Ti.Platform.osname === 'iphone' && Ti.App.arguments.launchOptionsLocationKey) {
      // Do not refresh beacons if the app has been started based on an enter/exited region event
      return;
    }

    knownBeaconService.refreshBeacons([this.options.networkId]);
  }

  start() {
    const regions = this.getRegions();
    if (this.options.scanBLE && regions.ble.length > 0) {
      this.startBLE(regions.ble);
    }

    if (this.options.scanGeofence && regions.geofences.length > 0) {
      this.startGeofence(regions.geofences);
    }
  }

  startBLE(regions) {
    const scanner = this.getBLEScanner();
    const callback = () => regions.forEach(region => scanner.startMonitoring(region));
    if (_.isFunction(scanner.bindService)) {
      scanner.bindService(callback);
    } else {
      callback();
    }
  }

  startGeofence(regions) {
    const scanner = this.getGeofenceScanner();
    const callback = nearestRegions => nearestRegions.forEach(
      region => scanner.startMonitoring(region)
    );

    // geofence-regions are already filtered by the hook, nearest geofences filter not needed
    if (_.isFunction(this.options.hooks.getRegionsToMonitor)) {
      callback(regions);
      return;
    }

    const sortRegionsByDistance = scanner.sortRegionsByDistance;
    getNearestGeofences({
      sortRegionsByDistance,
      regions,
      callback,
    });
  }

  stop() {
    if (this.BLEScanner) {
      this.getBLEScanner().stop();
    }
    if (this.geofenceScanner) {
      this.getGeofenceScanner().stop();
    }
  }

  setBackgroundMode(bgMode) {
    if (Ti.Platform.osname === 'android' && this.BLEScanner) {
      this.BLEScanner.setBackgroundMode(bgMode);
    }
  }

  restart() {
    this.stop();
    this.start();
  }

  destruct() {
    this.stop();
    if (this.BLEScanner) {
      this.BLEScanner.destruct();
      this.BLEScanner = undefined;
    }
    if (this.geofenceScanner) {
      this.geofenceScanner.destruct();
      this.geofenceScanner = undefined;
    }
    beaconHandler.destruct();
    this.beaconLog.destruct();
    this.beaconLog = undefined;
    Ti.App.removeEventListener('sensimity:hooks:updateRegionsToMonitor', this.restart);
  }

  getRegions() {
    const beacons = knownBeaconService.getKnownBeacons(this.options.networkId);
    if (_.isFunction(this.options.hooks.getRegionsToMonitor)) {
      return split(this.options.hooks.getRegionsToMonitor(beacons));
    }
    return split(beacons);
  }

  getBLEScanner() {
    if (Ti.Platform.osname === 'iphone' && !this.BLEScanner) {
      this.BLEScanner = new Beuckman(this.beaconLog, beaconHandler);
    } else if (!this.BLEScanner) {
      this.BLEScanner = new Altbeacon(this.options.runInService, this.beaconLog, beaconHandler);
      if (_.has(this.options, 'behavior')) {
        this.BLEScanner.setBehavior(this.options.behavior);
      }
    }

    return this.BLEScanner;
  }

  getGeofenceScanner() {
    if (!this.geofenceScanner) {
      this.geofenceScanner = new Pathsense(beaconHandler);
    }
    return this.geofenceScanner;
  }
}
