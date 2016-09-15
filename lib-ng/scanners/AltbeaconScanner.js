import BaseScanner from './BaseScanner';
import mapper from '../mapper/altbeacon';
import sensimityConfig from '../config/config';

export default class AltbeaconScanner extends BaseScanner {
  constructor(runInService, beaconLog, beaconHandler) {
    super(mapper, beaconLog, beaconHandler);
    try {
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
      this.enterRegion = this.enterRegion.bind(this);
      this.addAllEventListeners();
    } catch (e) {
      Ti.API.warn('Could not start BLE-scan, please include the com.drtech.altbeacon module');
    }
  }

  bindService(bindCallback) {
    if (!this.Beacons) {
      return;
    }
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

  startMonitoring(region) {
    if (this.Beacons) {
      this.Beacons.startMonitoringForRegion(region);
    }
  }

  stop() {
    if (this.Beacons && this.Beacons.beaconServiceIsBound()) {
      this.Beacons.stopMonitoringAllRegions();
      this.Beacons.unbindBeaconService();
    }
  }

  enterRegion(param) {
    if (this.Beacons && sensimityConfig.monitoringScope === 'minor') {
      this.beaconHandler.handle(mapper.region(param), 'enterregion');
    }
  }

  addAllEventListeners() {
    if (this.Beacons) {
      this.Beacons.addEventListener('beaconProximity', this.beaconFound);
      this.Beacons.addEventListener('enteredRegion', this.enterRegion);
    }
  }

  removeAllEventListeners() {
    if (this.Beacons) {
      this.Beacons.removeEventListener('beaconProximity', this.beaconFound);
      this.Beacons.removeEventListener('enteredRegion', this.enterRegion);
    }
  }

  setBackgroundMode(value) {
    if (this.Beacons) { this.Beacons.setBackgroundMode(value); }
  }

  setBehavior(period) {
    if (!_.has(this.scanPeriods, period)) {
      Ti.API.warn('behavior cannot be set. Only values \'proactive\' or \'aggressive\' are applicable');
    }
    if (this.Beacons) { this.Beacons.setScanPeriods(this.scanPeriods[period]); }
  }
}
