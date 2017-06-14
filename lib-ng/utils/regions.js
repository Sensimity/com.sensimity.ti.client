import sensimityConfig from '../config/config';

const getGeofenceRegions = beacons => _.uniq(
  beacons.map(beacon => ({
    identifier: `${beacon.get('UUID')}|${beacon.get('major')}|${beacon.get('minor')}|${beacon.get('beacon_id')}`,
    latitude: beacon.get('latitude'),
    longitude: beacon.get('longitude'),
    radius: 125,
  }))
, false, beacon => beacon.identifier);

const getBLERegions = beacons => _.uniq(
  beacons.map(beacon => {
    switch (sensimityConfig.monitoringScope) {
    case 'minor':
      return {
        identifier: `${beacon.get('UUID')}|${beacon.get('major')}|${beacon.get('minor')}|${beacon.get('beacon_id')}`,
        uuid: beacon.get('UUID'),
        major: beacon.get('major'),
        minor: beacon.get('minor'),
      };
    case 'major':
      return {
        identifier: `${beacon.get('UUID')}|${beacon.get('major')}}`,
        uuid: beacon.get('UUID'),
        major: beacon.get('major'),
      };
    default:
      return {
        identifier: beacon.get('UUID'),
        uuid: beacon.get('UUID'),
      };
    }
  })
, false, beacon => beacon.identifier);

// Use the current position to detect the 20 nearest geofences within 7500 m
const getNearestGeofences = ({ regions, callback, distance = 7500, count = 20 }) =>
  Ti.Geolocation.getCurrentPosition((e) => {
    let nearestGeofenceRegions;
    if (e.success) {
      // Detect only the nearest geofences within 7.5 km
      nearestGeofenceRegions = require('com.sensimity.ti.pathsense').sortRegionsByDistance(regions, _.pick(e.coords, 'latitude', 'longitude'), distance);
    }
    callback(_.first(nearestGeofenceRegions || regions, count ));
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
