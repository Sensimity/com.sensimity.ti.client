/**
 * A mapping function make the beaconinfo retrieved with the drtech beaconscanner, general
 * @param beaconRaw The beacon retrieved from the altbeacon
 * @returns {{UUID: string, major: Number, minor: Number, rssi: Number, accuracy: Number, proximity: String }}
 */
const beacon = beaconRaw => ({
  UUID: beaconRaw.uuid.toUpperCase(),
  major: parseInt(beaconRaw.major, 10),
  minor: parseInt(beaconRaw.minor, 10),
  rssi: parseInt(beaconRaw.rssi, 10),
  accuracy: beaconRaw.accuracy,
  proximity: beaconRaw.proximity,
});

const region = bleRegion => {
  const beaconRaw = bleRegion.identifier.split('|');

  return {
    UUID: beaconRaw[0].toUpperCase(),
    major: _.isUndefined(beaconRaw[1]) ? null : parseInt(beaconRaw[1], 10),
    minor: _.isUndefined(beaconRaw[2]) ? null : parseInt(beaconRaw[2], 10),
    rssi: -1,
    accuracy: -1,
    proximity: -1,
  };
};

export default { beacon, region };
