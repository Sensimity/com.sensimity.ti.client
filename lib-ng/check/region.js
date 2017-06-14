const entered = (scanner, geofence) => {
  const regions = Array.isArray(geofence) ? geofence : [geofence];
  regions.forEach((region) => {
    if (region.distanceInMeters < 150) {
      scanner.enteredRegion(region);
    }
  });
};

export { entered };
