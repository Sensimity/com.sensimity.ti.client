/**
 * Create a beaconregion from a knownbeacon used by the altbeaconscanner
 * @param knownBeacon A knownbeacon
 * @returns {{uuid: String, identifier: String}}
 */
const map = knownBeacon => ({
  uuid: knownBeacon.get('UUID'),
  identifier: knownBeacon.get('beacon_id'),
});

export default { map };
