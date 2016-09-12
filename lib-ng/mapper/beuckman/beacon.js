/**
 * A mapping function make the beaconinfo retrieved with the beuckman beaconscanner, general
 * @param beaconRaw The beacon retrieved from the beuckman
 * @returns {{UUID: string, major: Number, minor: Number, rssi: Number, accuracy: Number, proximity: String }}
 */
const map = beaconRaw => ({
  UUID: beaconRaw.uuid.toUpperCase(),
  major: parseInt(beaconRaw.major, 10),
  minor: parseInt(beaconRaw.minor, 10),
  rssi: parseInt(beaconRaw.rssi, 10),
  accuracy: beaconRaw.accuracy,
  proximity: beaconRaw.proximity,
});

export default { map };
