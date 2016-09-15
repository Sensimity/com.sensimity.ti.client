/**
 * A mapping function make the beaconinfo retrieved with the beuckman beaconscanner, general
 * @param beaconRaw The beacon retrieved from the beuckman
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
    UUID: beaconRaw[1].toUpperCase(),
    major: parseInt(beaconRaw[2], 10),
    minor: parseInt(beaconRaw[3], 10),
    rssi: -1,
    accuracy: -1,
    proximity: -1,
  };
};

export default { beacon, region };
