const getGeofenceRegions = beacons => _.uniq(
  beacons.map(beacon => ({
    identifier: `${beacon.get('beacon_id')}|${beacon.get('UUID')}|${beacon.get('major')}|${beacon.get('minor')}`,
    latitude: beacon.get('latitude'),
    longitude: beacon.get('longitude'),
    radius: 100,
  }))
, false, beacon => beacon.identifier);

const getBLERegions = beacons => _.uniq(
  beacons.map(beacon => ({
    identifier: beacon.get('UUID'),
    UUID: beacon.get('UUID'),
  }))
, false, beacon => beacon.identifier);

// Use the current position to detect the 20 nearest geofences within 7500 m
const getNearestGeofences = ({ sortRegionsByDistance, regions, callback }) =>
  Ti.Geolocation.getCurrentPosition((e) => {
    let nearestGeofenceRegions;
    if (e.success) {
      // Detect only the nearest geofences within 7.5 km
      nearestGeofenceRegions = sortRegionsByDistance(regions, _.pick(e.coords, 'latitude', 'longitude'), 7500);
    }
    callback(_.first(nearestGeofenceRegions || regions, 5));
  });

const split = beacons => ({
  ble: getBLERegions(
    beacons.filter(beacon => {
      return !beacon.get('is_geofence');
    })
  ),
  geofences: getGeofenceRegions(
    beacons.filter(beacon => beacon.get('is_geofence'))
  ),
});

export { split, getNearestGeofences };
