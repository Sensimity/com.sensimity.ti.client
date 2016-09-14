import PSModule from 'com.sensimity.ti.pathsense';
import beaconMapper from '../mapper/pathsense/beacon';

class Pathsense {
  constructor(beaconHandler) {
    this.beaconHandler = beaconHandler;
    this.enteredRegion = this.enteredRegion.bind(this);
    PSModule.addEventListener('enteredRegion', this.enteredRegion);
  }

  enteredRegion(geofenceRegion) {
    const beacon = beaconMapper.map(geofenceRegion);
    this.beaconHandler.handle(beacon);
  }

  startMonitoring(region) {
    PSModule.startMonitoringForRegion(region);
  }

  /**
  * Sort geofence-regions by distance inside a defined radius from a predefined location.
  */
  sortRegionsByDistance(regions, location, defaultRadius = 5000) {
    return PSModule.sortRegionsByDistance(regions, location, defaultRadius);
  }

  stop() {
    PSModule.stopMonitoringAllRegions();
  }

  destruct() {
    PSModule.removeEventListener('enteredRegion', this.enteredRegion);
  }
}

export default Pathsense;
