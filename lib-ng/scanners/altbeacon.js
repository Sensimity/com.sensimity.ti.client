import BaseScanner from './../scanners/base';
import beaconMapper from './../mapper/altbeacon/beacon';
import beaconRegionMapper from './../mapper/altbeacon/beaconRegion';
import beaconRegionMonitoringMapper from './../mapper/altbeacon/beaconRegionMonitoring';

export default class AltbeaconScanner extends BaseScanner {
  /**
   * Altbeacon scanner to scan iBeacons on Android devices
   * @param boolean backgroundMode - Parameter to handle beacons when the application is running in backgroundmode
   * @returns {BaseScanner}
   */
  constructor(runInService) {
    super(beaconMapper, beaconRegionMapper, beaconRegionMonitoringMapper);
    this.Beacons = require('com.drtech.altbeacon');
    this.scanPeriods = {
      proactive: {
        foregroundScanPeriod: 1101,
        foregroundBetweenScanPeriod: 0,
        backgroundScanPeriod: 5001,
        backgroundBetweenScanPeriod: 60001,
      },
      aggressive: {
        foregroundScanPeriod: 1001,
        foregroundBetweenScanPeriod: 0,
        backgroundScanPeriod: 2001,
        backgroundBetweenScanPeriod: 5001,
      },
    };
    this.runInService = runInService;
    this.beaconFound = this.beaconFound.bind(this);
  }

  isBLESupported() {
    return this.Beacons.isBLESupported();
  }

  isBLEEnabled(callback) {
    if (!_.isFunction(callback)) {
      Ti.API.warn('please define a function callback, ble status cannot be retrieved');
      return;
    }
    callback(this.Beacons.checkAvailability());
  }

  bindService(bindCallback) {
    const handleServiceBind = () => {
      this.Beacons.removeEventListener('serviceBound', handleServiceBind);
      bindCallback();
    };
    this.Beacons.setAutoRange(true);
    this.Beacons.setRunInService(this.runInService);
    this.Beacons.addBeaconLayout('m:2-3=0215,i:4-19,i:20-21,i:22-23,p:24-24');
    // Start scanning after binding beaconservice
    this.Beacons.addEventListener('serviceBound', handleServiceBind);
    this.Beacons.bindBeaconService();
  }

  stopScanning() {
    if (this.Beacons.beaconServiceIsBound()) {
      this.Beacons.stopMonitoringAllRegions();
      this.Beacons.unbindBeaconService();
    }
    this.removeAllEventListeners();
    this.destruct();
  }

  addAllEventListeners() {
    this.Beacons.addEventListener('beaconProximity', this.beaconFound);
  }

  removeAllEventListeners() {
    this.Beacons.removeEventListener('beaconProximity', this.beaconFound);
  }

  setBackgroundMode(value) {
    this.Beacons.setBackgroundMode(value);
  }

  setBehavior(period) {
    if (!_.has(this.scanPeriods, period)) {
      Ti.API.warn('behavior cannot be set. Only values \'proactive\' or \'aggressive\' are applicable');
    }
    this.Beacons.setScanPeriods(this.scanPeriods[period]);
  }
}
