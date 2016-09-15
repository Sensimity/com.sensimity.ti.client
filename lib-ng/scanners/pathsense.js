import BaseScanner from './Base';
import mapper from '../mapper/pathsense';

export default class Pathsense extends BaseScanner {
  constructor(beaconHandler) {
    super(mapper, null, beaconHandler);
    try {
      this.Pathsense = require('com.sensimity.ti.pathsense');
      this.Pathsense.addEventListener('enteredRegion', this.enteredRegion);
      this.Pathsense.addEventListener('exitedRegion', this.exitedRegion);
    } catch (e) {
      Ti.API.warn('Could not start geofence-scan, please include the com.sensimity.ti.pathsense module');
    }
  }

  startMonitoring(region) {
    if (this.Pathsense) {
      this.Pathsense.startMonitoringForRegion(region);
    }
  }

  stop() {
    if (this.Pathsense) {
      this.Pathsense.stopMonitoringAllRegions();
    }
  }

  /**
  * Sort geofence-regions by distance inside a defined radius from a predefined location.
  */
  sortRegionsByDistance(regions, location, defaultRadius = 5000) {
    return this.Pathsense.sortRegionsByDistance(regions, location, defaultRadius);
  }

  destruct() {
    if (this.Pathsense) {
      this.Pathsense.removeEventListener('enteredRegion', this.enteredRegion);
      this.Pathsense.removeEventListener('exitedRegion', this.exitedRegion);
    }
  }
}

export default Pathsense;
