import BaseScanner from './BaseScanner';
import beaconMapper from '../mapper/beuckman/beacon';

export default class BeuckmanScanner extends BaseScanner {
  constructor(beaconLog, beaconHandler) {
    super(beaconMapper, beaconLog, beaconHandler);
    try {
      this.Beacons = require('org.beuckman.tibeacons');
      this.beaconRangerHandler = this.beaconRangerHandler.bind(this);
      this.regionState = this.regionState.bind(this);
      this.addAllEventListeners();
    } catch (e) {
      Ti.API.warn('Could not start BLE-scan, please include the org.beuckman.tibeacons module');
    }
  }

  startMonitoring(region) {
    if (this.Beacons) {
      this.Beacons.startMonitoringForRegion({
        uuid: region.UUID,
        identifier: region.identifier,
      });
    }
  }

  // Start ranging beacons when a beaconregion is detected
  enterRegion(param) {
    if (this.Beacons) {
      this.Beacons.startRangingForBeacons(param);
    }
  }

  // Stop ranging beacons for a region when a beaconregion is exited
  exitRegion(param) {
    if (this.Beacons) {
      this.Beacons.stopRangingForBeacons(param);
    }
  }

  // Call beaconfound for every found beacon and handle the found beacons
  beaconRangerHandler(param) {
    param.beacons.forEach(beacon => this.beaconFound(beacon));
  }

  regionState(e) {
    if (!this.Beacons) {
      return;
    }

    if (e.regionState === 'inside') {
      this.Beacons.startRangingForBeacons(_.pick(e, 'uuid', 'identifier'));
    } else if (e.regionState === 'outside') {
      this.Beacons.stopRangingForBeacons(_.pick(e, 'uuid', 'identifier'));
    }
  }

  stop() {
    if (this.Beacons) {
      this.Beacons.stopMonitoringAllRegions();
      this.Beacons.stopRangingForAllBeacons();
    }
  }

  // Add eventlisteners, called by startingscan in Basescanner
  addAllEventListeners() {
    if (this.Beacons) {
      this.Beacons.addEventListener('beaconRanges', this.beaconRangerHandler);
      this.Beacons.addEventListener('determinedRegionState', this.regionState);
    }
  }

  removeAllEventListeners() {
    if (this.Beacons) {
      this.Beacons.removeEventListener('beaconRanges', this.beaconRangerHandler);
      this.Beacons.removeEventListener('determinedRegionState', this.regionState);
    }
  }
}
