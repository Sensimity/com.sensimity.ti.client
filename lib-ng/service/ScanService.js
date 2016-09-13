import Altbeacon from '../scanners/altbeacon';
import Beuckman from '../scanners/beuckman';
import Pathsense from '../scanners/pathsense';
import beaconHandler from '../handlers/beaconHandler';
import knownBeaconService from './knownBeacons';
import beaconLog from './beaconLog';
import { split, getNearestGeofences } from '../utils/regions';

export default class ScanService {
  constructor(options = {
    runInService: false,
    hooks: {},
  }) {
    if (_.isUndefined(options.networkId)) {
      Ti.API.warn('Network identifier is undefined. Can not scan');
      return;
    }

    this.options = options;
    beaconHandler.init();
    beaconLog.init();
    this.restart = this.restart.bind(this);
    Ti.App.addEventListener('sensimity:hooks:updateRegionsToMonitor', this.restart);

    if (Ti.Platform.name === 'iPhone OS' && Ti.App.arguments.launchOptionsLocationKey) {
      // Do not refresh beacons if the app has been started based on an enter/exited region event
      return;
    }

    knownBeaconService.refreshBeacons([options.networkId]);
  }

  start() {
    const regions = this.getRegions();
    if (this.options.startBLE && regions.ble.length > 0) {
      const callback = () => regions.ble.forEach(region => this.getBLEScanner().startMonitoring(region));
      if (_.isFunction(this.getBLEScanner().bindService)) {
        this.getBLEScanner().bindService(callback);
      } else {
        callback();
      }
    }

    if (this.options.startGeofence && regions.geofences.length > 0) {
      const callback = nearestRegions => nearestRegions.forEach(
        region => this.getGeofenceScanner().startMonitoring(region)
      );

      // geofence-regions are already filtered by the hook, nearest geofences filter not needed
      if (_.isFunction(this.options.hooks.getRegionsToMonitor)) {
        callback(regions.geofences);
        return;
      }

      getNearestGeofences({
        pathsenseScanner: this.getGeofenceScanner(),
        regions: regions.geofences,
        callback,
      });
    }
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
    if (Ti.Platform.name === 'android' && this.BLEScanner) {
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
    beaconLog.destruct();
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
    if (Ti.Platform.name === 'iPhone OS') {
      if (!this.BLEScanner) {
        this.BLEScanner = new Beuckman(beaconLog, beaconHandler);
      }
    } else if (!this.BLEScanner) {
      this.BLEScanner = new Altbeacon(this.options.runInService, beaconLog, beaconHandler);
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
