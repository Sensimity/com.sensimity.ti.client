import BaseScanner from './BaseScanner';
import beaconMapper from '../mapper/altbeacon/beacon';

export default class AltbeaconScanner extends BaseScanner {
  constructor(runInService, beaconLog, beaconHandler) {
    super(beaconMapper, beaconLog, beaconHandler);
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
    this.addAllEventListeners();
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

  startMonitoring(region) {
    this.Beacons.startMonitoringForRegion({
      uuid: region.UUID,
      identifier: region.identifier,
    });
  }

  stop() {
    if (this.Beacons.beaconServiceIsBound()) {
      this.Beacons.stopMonitoringAllRegions();
      this.Beacons.unbindBeaconService();
    }
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
