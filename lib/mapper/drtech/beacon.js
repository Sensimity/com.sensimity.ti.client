/**
 * Public functions
 */

/**
 * A mapping function make the beaconinfo retrieved with the drtech beaconscanner, general
 * @param beaconRaw The beacon retrieved from the beuckman
 * @returns {{UUID: string, major: Number, minor: Number, rssi: Number, accuracy: Number, proximity: String }}
 */
function map(beaconRaw) {
    return {
        UUID: beaconRaw.uuid.toUpperCase(),
        major: parseInt(beaconRaw.major),
        minor: parseInt(beaconRaw.minor),
        rssi: beaconRaw.rssi,
        accuracy: beaconRaw.accuracy,
        proximity: beaconRaw.proximity
    };
}

exports.map = map;
