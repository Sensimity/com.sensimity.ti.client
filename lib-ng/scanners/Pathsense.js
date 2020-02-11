import BaseScanner from './Base';
import mapper from '../mapper/pathsense';

const proxy = global.require('com.sensimity.ti.pathsense');

export default class Pathsense extends BaseScanner {
  constructor(beaconHandler) {
    super(mapper, null, beaconHandler);
    try {
      proxy.addEventListener('enteredRegion', this.enteredRegion);
      proxy.addEventListener('exitedRegion', this.exitedRegion);
    } catch (e) {
      Ti.API.info('Could not start geofence-scan, please include the com.sensimity.ti.pathsense module');
    }
  }

  startMonitoring(region) {
    proxy.startMonitoringForRegion(region);
  }

  stop() {
    proxy.stopMonitoringAllRegions();
  }

  /**
  * Sort geofence-regions by distance inside a defined radius from a predefined location.
  */
  sortRegionsByDistance(regions, location, defaultRadius = 5000) {
    return proxy.sortRegionsByDistance(regions, location, defaultRadius);
  }

  destruct() {
    if (Ti.Platform.osname === 'android') {
      proxy.destroy();
    }
    proxy.removeEventListener('enteredRegion', this.enteredRegion);
    proxy.removeEventListener('exitedRegion', this.exitedRegion);
  }
}
