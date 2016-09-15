const region = geofenceRegion => {
  const beaconRaw = geofenceRegion.identifier.split('|');

  return {
    UUID: beaconRaw[0].toUpperCase(),
    major: _.isUndefined(beaconRaw[1]) ? null : parseInt(beaconRaw[1], 10),
    minor: _.isUndefined(beaconRaw[2]) ? null : parseInt(beaconRaw[2], 10),
    rssi: -1,
    accuracy: -1,
    proximity: -1,
  };
};

export default { region };
