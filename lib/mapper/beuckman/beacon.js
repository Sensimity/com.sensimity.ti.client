/**
 * Public functions
 */

/**
 * A mapping function make the beaconinfo retrieved with the beuckman beaconscanner, general
 * @param beaconRaw The beacon retrieved from the beuckman
 * @returns {{UUID: string, major: Number, minor: Number, rssi: Number, accuracy: Number, proximity: String }}
 */
function map(beaconRaw) {
    return {
        UUID: beaconRaw.uuid.toUpperCase(),
        major: parseInt(beaconRaw.major),
        minor: parseInt(beaconRaw.minor),
        rssi: parseInt(beaconRaw.rssi),
        accuracy: beaconRaw.accuracy,
        proximity: beaconRaw.proximity
    };
}

exports.map = map;
