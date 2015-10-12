/* jshint ignore:start */
var Alloy = require('alloy'),
    _ = require('alloy/underscore')._,
    Backbone = require('alloy/backbone');
/* jshint ignore:end */

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
        rssi: parseInt(beaconRaw.rssi, 10),
        accuracy: beaconRaw.accuracy,
        proximity: beaconRaw.proximity
    };
}

exports.map = map;
