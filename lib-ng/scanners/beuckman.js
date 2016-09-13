import BaseScanner from './../scanners/base';
import beaconMapper from './../mapper/beuckman/beacon';

export default class BeuckmanScanner extends BaseScanner {
  constructor(beaconLog, beaconHandler) {
    super(beaconMapper, beaconLog, beaconHandler);
    this.Beacons = require('org.beuckman.tibeacons');
    this.beaconRangerHandler = this.beaconRangerHandler.bind(this);
    this.regionState = this.regionState.bind(this);
    this.addAllEventListeners();
  }

  startMonitoring(region) {
    this.Beacons.startMonitoringForRegion({
      uuid: region.UUID,
      identifier: region.identifier,
    });
  }

  // Start ranging beacons when a beaconregion is detected
  enterRegion(param) {
    this.Beacons.startRangingForBeacons(param);
  }

  // Stop ranging beacons for a region when a beaconregion is exited
  exitRegion(param) {
    this.Beacons.stopRangingForBeacons(param);
  }

  // Call beaconfound for every found beacon and handle the found beacons
  beaconRangerHandler(param) {
    param.beacons.forEach(beacon => this.beaconFound(beacon));
  }

  regionState(e) {
    if (e.regionState === 'inside') {
      this.Beacons.startRangingForBeacons(_.pick(e, 'uuid', 'identifier'));
    } else if (e.regionState === 'outside') {
      this.Beacons.stopRangingForBeacons(_.pick(e, 'uuid', 'identifier'));
    }
  }

  stop() {
    this.Beacons.stopMonitoringAllRegions();
    this.Beacons.stopRangingForAllBeacons();
  }

  // Add eventlisteners, called by startingscan in Basescanner
  addAllEventListeners() {
    this.Beacons.addEventListener('beaconRanges', this.beaconRangerHandler);
    this.Beacons.addEventListener('determinedRegionState', this.regionState);
  }

  removeAllEventListeners() {
    this.Beacons.removeEventListener('beaconRanges', this.beaconRangerHandler);
    this.Beacons.removeEventListener('determinedRegionState', this.regionState);
  }
}
