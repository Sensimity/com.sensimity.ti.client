export default class BaseScanner {
  constructor(beaconMapper, beaconLog = null, beaconHandler = null) {
    this.beaconMapper = beaconMapper;
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

    const beacon = this.beaconMapper.map(beaconRaw);
    this.beaconLog.insertBeaconLog(beacon);
    this.beaconHandler.handle(beacon);
  }
}
