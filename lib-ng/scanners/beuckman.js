import BaseScanner from './../scanners/base';
import beaconMapper from './../mapper/beuckman/beacon';
import beaconRegionMapper from './../mapper/beuckman/beaconRegion';
import beaconRegionMonitoringMapper from './../mapper/beuckman/beaconRegionMonitoring';

export default class BeuckmanScanner extends BaseScanner {
  /**
   * Beuckman scanner to scan iBeacons on iOS
   * @returns {BaseScanner}
   * @constructor
   */
  constructor() {
    super(beaconMapper, beaconRegionMapper, beaconRegionMonitoringMapper);
    this.Beacons = require('org.beuckman.tibeacons');
    this.beaconRangerHandler = this.beaconRangerHandler.bind(this);
    this.regionState = this.regionState.bind(this);
  }

  isBLESupported() {
    return this.Beacons.isBLESupported();
  }

  isBLEEnabled(callback) {
    if (!_.isFunction(callback)) {
      Ti.API.warn('please define a function callback, ble status cannot be retrieved');
      return;
    }
    const handleBleStatus = e => {
      // Useless status See https://github.com/jbeuckm/TiBeacons/issues/24
      if (e.status === 'unknown') {
        return;
      }
      this.Beacons.removeEventListener('bluetoothStatus', handleBleStatus);
      if (e.status === 'on') {
        callback(true);
      } else {
        callback(false);
      }
    };
    this.Beacons.addEventListener('bluetoothStatus', handleBleStatus);

    _.defer(() => this.Beacons.requestBluetoothStatus());
  }

  // Bindservice function is required in from the Basescanner, but Beuckman contains no bindoption
  bindService(bindCallback) {
    bindCallback();
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
    _.each(param.beacons, beacon => this.beaconFound(beacon));
  }

  regionState(e) {
    if (e.regionState === 'inside') {
      this.Beacons.startRangingForBeacons(_.pick(e, 'uuid', 'identifier'));
    } else if (e.regionState === 'outside') {
      this.Beacons.stopRangingForBeacons(_.pick(e, 'uuid', 'identifier'));
    }
  }

  // override stopscanning
  stopScanning() {
    this.removeAllEventListeners();
    this.Beacons.stopMonitoringAllRegions();
    this.Beacons.stopRangingForAllBeacons();
    this.destruct();
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
