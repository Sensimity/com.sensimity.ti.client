import { _ } from 'alloy/underscore';
import client from '../client/client';
import { createSensimityCollection, createSensimityModel } from '../utils/backbone';
import businessRuleService from '../service/businessRule';

// Get the beacons earlier retrieved from Sensimity
const getEarlierSavedKnownBeacons = () => {
  const library = createSensimityCollection('KnownBeacon');
  library.fetch();
  return library;
};

const saveBeacon = beacon => {
  beacon.UUID = beacon.uuid_beacon.toUpperCase();
  if (!_.isUndefined(beacon.is_geofence)) {
    beacon.is_geofence = (beacon.is_geofence ? 1 : 0);
  } else {
    beacon.is_geofence = 0;
  }
  const sensimityKnownBeacon = createSensimityModel('KnownBeacon', beacon);
  sensimityKnownBeacon.save();
  // Geofences don't contain business rules, so don't fetch them
  if (sensimityKnownBeacon.get('is_geofence')) {
    return;
  }
  // Also refetch all existing business rules
  businessRuleService.fetchBusinessRules(sensimityKnownBeacon);
};

// Save all new beacons
const saveNewBeacons = beaconArray => {
  const library = getEarlierSavedKnownBeacons();
  beaconArray.forEach(beacon => {
    // Save only when it is not saved already
    if (library.where(_.pick(beacon, 'beacon_id')).length === 0) {
      saveBeacon(beacon);
    }
  });
};

// When the beacons successfull received from Sensimity, save local and trigger the whole system to let the system know the beacons refreshed
const handleSuccessfullFetchingBeacons = data => {
    // Handle only fetching if data contains beacons.
  if (!_.isUndefined(data._embedded) && !_.isEmpty(data._embedded)) {
    saveNewBeacons(data._embedded.beacon);
    // Let the whole applicatie know that the beacons are refreshed
    Alloy.Globals.sensimityDispatcher.trigger('sensimity:beaconsRefreshed');
  }
};

/**
 * Function to refresh the beacons from Sensimity
 * @param networkIds The network identifiers which must be refreshed
 * @param ownBeacons your own non Sensimity beacons.
 */
const refreshBeacons = (networkIds, ownBeacons = null) => {
  if (ownBeacons !== null) {
    createSensimityCollection('KnownBeacon').erase();
    handleSuccessfullFetchingBeacons({
      _embedded: {
        beacon: ownBeacons,
      },
    });
    return;
  }

  if (Ti.Network.getOnline()) {
    _.uniq(networkIds).forEach(id => {
      createSensimityCollection('KnownBeacon').erase();
      client.getBeacons(id, handleSuccessfullFetchingBeacons);
    });
  }
};

/**
 * Find a beacon based on UUID, major and minor identifier
 * @param String UUID Beacon UUID
 * @param int major Beacon major id
 * @param int minor Beacon minor id
 */
const findKnownBeacon = (UUID, major, minor) =>
  _.first(getEarlierSavedKnownBeacons().where({
    UUID,
    major,
    minor,
  })) || [];

/**
 * Retrieve knownbeacons of a network
 * @param networkId The network identifier of the beacons who searching for
 */
const getKnownBeacons = networkId => getEarlierSavedKnownBeacons().where({ network_id: networkId });

export default {
  refreshBeacons,
  findKnownBeacon,
  getKnownBeacons,
};
