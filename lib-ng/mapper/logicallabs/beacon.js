/* jshint ignore:start */
var Alloy = require('alloy'),
    _ = require('alloy/underscore')._,
    Backbone = require('alloy/backbone');
/* jshint ignore:end */

var scanModule = require('com.logicallabs.beacons');

/**
 * Public functions
 */

/**
 * A mapping function make the beaconinfo retrieved with the logicallabs beaconscanner, general
 * @param beaconRaw The beacon retrieved from the logicallabs
 * @returns {{UUID: string, major: Number, minor: Number, rssi: Number, accuracy: Number, proximity: String }}
 */
function map(beaconRaw) {
    var proximity;
    switch (beaconRaw.proximity) {
        case scanModule.BEACON_PROXIMITY_UNKNOWN:
            proximity = 'unknown';
            break;
        case scanModule.BEACON_PROXIMITY_IMMEDIATE:
            proximity = 'immediate';
            break;
        case scanModule.BEACON_PROXIMITY_NEAR:
            proximity = 'near';
            break;
        case scanModule.BEACON_PROXIMITY_FAR:
            proximity = 'far';
            break;
    }
    return {
        UUID: beaconRaw.UUID.toUpperCase(),
        major: parseInt(beaconRaw.major),
        minor: parseInt(beaconRaw.minor),
        rssi: parseInt(beaconRaw.RSSI),
        accuracy: beaconRaw.accuracy,
        proximity: proximity
    };
}

exports.map = map;
