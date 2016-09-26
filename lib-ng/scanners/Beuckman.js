import BaseScanner from './Base';
import mapper from '../mapper/beuckman';
import sensimityConfig from '../config/config';

export default class Beuckman extends BaseScanner {
  constructor(beaconLog, beaconHandler) {
    super(mapper, beaconLog, beaconHandler);
    try {
      this.Beuckman = require('org.beuckman.tibeacons');
      this.regionState = this.regionState.bind(this);
      this.rangedBeacons = this.rangedBeacons.bind(this);
      this.addAllEventListeners();
    } catch (e) {
      Ti.API.info('Could not start BLE-scan, please include the org.beuckman.tibeacons module');
    }
  }

  startMonitoring(region) {
    if (this.Beuckman) {
      const notifyEntryStateOnDisplay = sensimityConfig.notifyEntryStateOnDisplay ? 'YES' : 'NO';
      this.Beuckman.startMonitoringForRegion(Object.assign(region, {
        notifyEntryStateOnDisplay,
      }));
    }
  }

  // Start ranging beacons when a beaconregion is detected
  enteredRegion(param) {
    if (this.Beuckman) {
      super.enteredRegion(param);
      this.Beuckman.startRangingForBeacons(param);
    }
  }

  // Stop ranging beacons for a region when a beaconregion is exited
  exitedRegion(param) {
    if (this.Beuckman) {
      super.exitedRegion(param);
      this.Beuckman.stopRangingForBeacons(param);
    }
  }

  // Call beaconfound for every found beacon and handle the found beacons
  rangedBeacons(param) {
    param.beacons.forEach(beacon => this.beaconFound(beacon));
  }

  regionState(e) {
    if (!this.Beuckman) {
      return;
    }

    if (e.regionState === 'inside') {
      this.enteredRegion(e);
    } else if (e.regionState === 'outside') {
      this.exitedRegion(e);
    }
  }

  stop() {
    if (this.Beuckman) {
      this.Beuckman.stopMonitoringAllRegions();
      this.Beuckman.stopRangingForAllBeacons();
    }
  }

  // Add eventlisteners, called by startingscan in Basescanner
  addAllEventListeners() {
    if (this.Beuckman) {
      this.Beuckman.addEventListener('beaconRanges', this.rangedBeacons);
      this.Beuckman.addEventListener('determinedRegionState', this.regionState);
    }
  }

  removeAllEventListeners() {
    if (this.Beuckman) {
      this.Beuckman.removeEventListener('beaconRanges', this.rangedBeacons);
      this.Beuckman.removeEventListener('determinedRegionState', this.regionState);
    }
  }
}
