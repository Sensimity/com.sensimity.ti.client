/* jshint ignore:start */
var Alloy = require('alloy'),
    _ = require('alloy/underscore')._,
    Backbone = require('alloy/backbone');
/* jshint ignore:end */

var sensimityClient = require('./../client/client'),
    baseSensimityService = require('./../service/base'),
    businessRuleService = require('./../service/businessRule');

/**
 * Function to refresh the beacons from Sensimity
 * @param networkIds The network identifiers which must be refreshed
 */
function refreshBeacons(networkIds) {
    if (Ti.Network.getOnline()) {
        _.each(_.uniq(networkIds), function (id) {
            var library = baseSensimityService.createSensimityCollection('KnownBeacon');
            library.erase();
            sensimityClient.getBeacons(id, handleSuccessfullFetchingBeacons);
        });
    }
}

/*****
 * Find a beacon based on UUID, major and minor identifier
 * @param String UUID Beacon UUID
 * @param int major Beacon major id
 * @param int minor Beacon minor id
 */
function findKnownBeacon(UUID, major, minor) {
    var library = baseSensimityService.createSensimityCollection('KnownBeacon');
    library.fetch();
    var knownBeacons = library.where({
        UUID: UUID,
        major: major,
        minor: minor
    });
    if (_.isEmpty(knownBeacons)) {
        return knownBeacons;
    } else {
        return _.first(knownBeacons);
    }
}

/*****
 * Retrieve knownbeacons of a network
 * @param networkId The network identifier of the beacons who searching for
 */
function getKnownBeacons(networkId) {
    var library = baseSensimityService.createSensimityCollection('KnownBeacon');
    library.reset();
    library.fetch();
    var knownBeaconsOfNetworkId = library.where({ network_id : networkId });
    return knownBeaconsOfNetworkId;
}

exports.refreshBeacons = refreshBeacons;
exports.findKnownBeacon = findKnownBeacon;
exports.getKnownBeacons = getKnownBeacons;

// When the beacons successfull received from Sensimity, save local and trigger the whole system to let the system know the beacons refreshed
function handleSuccessfullFetchingBeacons(data) {
    // Handle only fetching if data contains beacons.
    if (!_.isUndefined(data._embedded) && !_.isEmpty(data._embedded)) {
        var rawData = data._embedded.beacon;
        saveNewBeacons(rawData);

        // Let the whole applicatie know that the beacons are refreshed
        Alloy.Globals.sensimityEvent.trigger('sensimity:beaconsRefreshed');
    }
}

// Save all new beacons
function saveNewBeacons(beaconArray) {
    var library = getEarlierSavedKnownBeacons();
    _.each(beaconArray, function (beacon) {
        var checkBeaconAlreadySaved = library.where({
            beacon_id: beacon.beacon_id,
        });
        if (_.isEmpty(checkBeaconAlreadySaved)) {
            beacon.UUID = beacon.uuid_beacon.toUpperCase();
            beacon.is_geofence = !_.isUndefined(beacon.is_geofence) ? beacon.is_geofence : false;
            var sensimityKnownBeacon = baseSensimityService.createSensimityModel('KnownBeacon', beacon);
            sensimityKnownBeacon.save();

            if (!sensimityKnownBeacon.get('is_geofence')) {
                return;
            }
            // Also refetch all existing business rules
            businessRuleService.fetchBusinessRules(sensimityKnownBeacon);
        }
    });
}

// Get the beacons earlier retrieved from Sensimity
function getEarlierSavedKnownBeacons() {
    var library = baseSensimityService.createSensimityCollection('KnownBeacon');
    library.reset();
    library.fetch();
    return library;
}
