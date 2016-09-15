import sensimityConfig from '../config/config';

export default class BaseScanner {
  constructor(mapper, beaconLog = null, beaconHandler = null) {
    this.mapper = mapper;
    this.setBeaconLog(beaconLog);
    this.setBeaconHandler(beaconHandler);
  }

  destruct() {
    this.removeAllEventListeners();
  }

  setBeaconLog(beaconLog) {
    this.beaconLog = beaconLog;
  }

  setBeaconHandler(beaconHandler) {
    this.beaconHandler = beaconHandler;
  }

  /**
    * Map a found beacon and start the beaconHandler
    * @param beaconRaw A raw beacon found by the beaconscanner
    */
  beaconFound(beaconRaw) {
    if (_.isUndefined(beaconRaw.rssi) || parseInt(beaconRaw.rssi, 10) === 0) { return; }

    const beacon = this.mapper.beacon(beaconRaw);
    this.beaconLog.insertBeaconLog(beacon);
    if (sensimityConfig.ranging) {
      this.beaconHandler.handle(beacon);
    }
  }
}
