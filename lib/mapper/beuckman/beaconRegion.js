/**
 * Create a beaconregion from a knownbeacon used by the beuckmanscanner
 * @param knownBeacon A knownbeacon
 * @returns {{uuid: String, identifier: String}}
 */
function map(knownBeacon) {
    return {
        uuid: knownBeacon.get('UUID'),
        identifier: knownBeacon.get('beacon_id')
    };
}

exports.map = map;
