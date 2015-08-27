/* jshint ignore:start */
var Alloy = require('alloy'),
    _ = require('alloy/underscore')._,
    Backbone = require('alloy/backbone');
/* jshint ignore:end */

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
