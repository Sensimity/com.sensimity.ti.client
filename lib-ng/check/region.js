import sensimityConfig from '../config/config';

const entered = (scanner, geofence) => {
  const regions = Array.isArray(geofence) ? geofence : [geofence];
  regions.forEach((region) => {
    if (region.distanceInMeters <= sensimityConfig.geofenceRadius) {
      scanner.enteredRegion(region);
    }
  });
};

export { entered };
