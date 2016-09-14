import beaconMapper from '../mapper/pathsense/beacon';

class Pathsense {
  constructor(beaconHandler) {
    this.PSModule = require('com.sensimity.ti.pathsense');
    this.beaconHandler = beaconHandler;
    this.enteredRegion = this.enteredRegion.bind(this);
    this.PSModule.addEventListener('enteredRegion', this.enteredRegion);
  }

  enteredRegion(geofenceRegion) {
    const beacon = beaconMapper.map(geofenceRegion);
    this.beaconHandler.handle(beacon);
  }

  startMonitoring(region) {
    this.PSModule.startMonitoringForRegion(region);
  }

  /**
  * Sort geofence-regions by distance inside a defined radius from a predefined location.
  */
  sortRegionsByDistance(regions, location, defaultRadius = 5000) {
    return this.PSModule.sortRegionsByDistance(regions, location, defaultRadius);
  }

  stop() {
    this.PSModule.stopMonitoringAllRegions();
  }

  destruct() {
    this.PSModule.removeEventListener('enteredRegion', this.enteredRegion);
  }
}

export default Pathsense;
