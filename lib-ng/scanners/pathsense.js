import PathSenseLib from 'com.sensimity.ti.pathsense';
import beaconMapper from './../mapper/pathsense/beacon';
import beaconHandler from './../handlers/beaconHandler';

class Pathsense {
  constructor() {
    PathSenseLib.addEventListener('enteredRegion', this.enteredRegion);
  }

  enteredRegion(geofenceRegion) {
    const beacon = beaconMapper.map(geofenceRegion);
    beaconHandler.handle(beacon);
  }

  startMonitoring(region) {
    PathSenseLib.startMonitoringForRegion(region);
  }

  stopMonitoring() {
    PathSenseLib.stopMonitoringAllRegions();
  }

  /**
  * Sort geofence-regions by distance inside a defined radius from a predefined location.
  */
  sortRegionsByDistance(regions, location, defaultRadius = 5000) {
    return PathSenseLib.sortRegionsByDistance(regions, location, defaultRadius);
  }

  destruct() {
    PathSenseLib.removeEventListener('enteredRegion', this.enteredRegion);
  }
}

export default Pathsense;
