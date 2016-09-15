import BaseScanner from './Base';
import mapper from '../mapper/altbeacon';

export default class Altbeacon extends BaseScanner {
  constructor(runInService, beaconLog, beaconHandler) {
    super(mapper, beaconLog, beaconHandler);
    try {
      this.Altbeacon = require('com.drtech.altbeacon');
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
      this.addAllEventListeners();
    } catch (e) {
      Ti.API.warn('Could not start BLE-scan, please include the com.drtech.altbeacon module');
    }
  }

  bindService(bindCallback) {
    if (!this.Altbeacon) {
      return;
    }
    const handleServiceBind = () => {
      this.Altbeacon.removeEventListener('serviceBound', handleServiceBind);
      bindCallback();
    };
    this.Altbeacon.setAutoRange(true);
    this.Altbeacon.setRunInService(this.runInService);
    this.Altbeacon.addBeaconLayout('m:2-3=0215,i:4-19,i:20-21,i:22-23,p:24-24');
    // Start scanning after binding beaconservice
    this.Altbeacon.addEventListener('serviceBound', handleServiceBind);
    this.Altbeacon.bindBeaconService();
  }

  startMonitoring(region) {
    if (this.Altbeacon) {
      this.Altbeacon.startMonitoringForRegion(region);
    }
  }

  stop() {
    if (this.Altbeacon && this.Altbeacon.beaconServiceIsBound()) {
      this.Altbeacon.stopMonitoringAllRegions();
      this.Altbeacon.unbindBeaconService();
    }
  }

  addAllEventListeners() {
    if (this.Altbeacon) {
      this.Altbeacon.addEventListener('beaconProximity', this.beaconFound);
      this.Altbeacon.addEventListener('enteredRegion', this.enteredRegion);
      this.Altbeacon.addEventListener('exitedRegion', this.exitedRegion);
    }
  }

  removeAllEventListeners() {
    if (this.Altbeacon) {
      this.Altbeacon.removeEventListener('beaconProximity', this.beaconFound);
      this.Altbeacon.removeEventListener('enteredRegion', this.enteredRegion);
      this.Altbeacon.removeEventListener('exitedRegion', this.exitedRegion);
    }
  }

  setBackgroundMode(value) {
    if (this.Altbeacon) { this.Altbeacon.setBackgroundMode(value); }
  }

  setBehavior(period) {
    if (!_.has(this.scanPeriods, period)) {
      Ti.API.warn('behavior cannot be set. Only values \'proactive\' or \'aggressive\' are applicable');
    }
    if (this.Altbeacon) { this.Altbeacon.setScanPeriods(this.scanPeriods[period]); }
  }
}
