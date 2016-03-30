/* jshint ignore:start */
var Alloy = require('alloy'),
    _ = require('alloy/underscore')._,
    Backbone = require('alloy/backbone');
/* jshint ignore:end */

var scanModule = require('com.logicallabs.beacons');

/**
 * Create a beaconregion from a knownbeacon used by the logicallabsscanner
 * @param knownBeacon A knownbeacon
 * @returns {{uuid: String, identifier: String}}
 */
function map(knownBeacon) {
    var beaconRegion = scanModule.createBeaconRegion({
        UUID: knownBeacon.get('UUID'),
        identifier: knownBeacon.get('beacon_id')
    });
    return {
        beaconRegion: beaconRegion
    };
}

exports.map = map;
