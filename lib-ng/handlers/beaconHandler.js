import Alloy from 'alloy';
import { _ } from 'alloy/underscore';
import businessRuleService from './../service/businessRule';
import knownBeaconService from'./../service/knownBeacons';

let foundBeacons; // Found beacons is used to handle the moving towards and moving away from business rules
const typeOfAvailableBusinessRules = { // Types of available Business rules
  far: 'far',
  close: 'close',
  immediate: 'immediate',
  movingTowards: 'moving_towards',
  movingAwayFrom: 'moving_away_from',
};

const proximities = {
  far: 'far',
  close: 'near',
  immediate: 'immediate',
};

/**
 * Private functions
 */

 // Check the proximity of previous beacon has more distance than the new proximity
const checkMovingTowards = (proximity, beaconId) => {
  const lastFoundBeacon = _.findWhere(foundBeacons, {
    beaconId,
    proximity: proximities.close,
  });
  return (!_.isEmpty(lastFoundBeacon) && (_.isEqual(proximity, proximities.close) || _.isEqual(proximity, proximities.immediate)));
};

// Check the proximity of previous beacon has less distance than the new proximity
const checkMovingAwayFrom = (proximity, beaconId) => {
  const lastFoundImmediateBeacon = _.findWhere(foundBeacons, {
    beaconId,
    proximity: proximities.close,
  });
  const lastFoundNearBeacon = _.findWhere(foundBeacons, {
    beaconId,
    proximity: proximities.immediate,
  });
  return ((!_.isEmpty(lastFoundNearBeacon) || !_.isEmpty(lastFoundImmediateBeacon)) && (_.isEqual(proximity, proximities.far)));
};

/**
 * Handle and checks beaconproximity and businessrule are the same. If businessrule is active, trigger the dispatcher to use this businessrule in the app
 * @param businessRule
 * @param beacon found Beacon in basescanner
 * @param knownBeacon knownBeacon from local database
 */
const handleBusinessRule = (businessRule, beacon, knownBeacon) => {
  const businessRuleType = businessRule.get('type');
  const businessRuleTriggerItem = {
    businessRule: businessRule.toJSON(),
    beacon,
    knownBeacon: knownBeacon.toJSON(),
  };

  if (_.isEqual(businessRuleType, typeOfAvailableBusinessRules.far) && _.isEqual(beacon.proximity, proximities.far)) {
    Alloy.Globals.sensimityDispatcher.trigger('sensimity:businessrule', businessRuleTriggerItem);
    Ti.App.fireEvent('sensimity:businessrule', businessRuleTriggerItem);
  }

  if (_.isEqual(businessRuleType, typeOfAvailableBusinessRules.close) && _.isEqual(beacon.proximity, proximities.close)) {
    Alloy.Globals.sensimityDispatcher.trigger('sensimity:businessrule', businessRuleTriggerItem);
    Ti.App.fireEvent('sensimity:businessrule', businessRuleTriggerItem);
  }

  if (_.isEqual(businessRuleType, typeOfAvailableBusinessRules.immediate) && _.isEqual(beacon.proximity, proximities.immediate)) {
    Alloy.Globals.sensimityDispatcher.trigger('sensimity:businessrule', businessRuleTriggerItem);
    Ti.App.fireEvent('sensimity:businessrule', businessRuleTriggerItem);
  }

  if (_.isEqual(businessRuleType, typeOfAvailableBusinessRules.movingTowards) && checkMovingTowards(beacon.proximity, knownBeacon.get('beacon_id'))) {
    Alloy.Globals.sensimityDispatcher.trigger('sensimity:businessrule', businessRuleTriggerItem);
    Ti.App.fireEvent('sensimity:businessrule', businessRuleTriggerItem);
  }

  if (_.isEqual(businessRuleType, typeOfAvailableBusinessRules.movingAwayFrom) && checkMovingAwayFrom(beacon.proximity, knownBeacon.get('beacon_id'))) {
    Alloy.Globals.sensimityDispatcher.trigger('sensimity:businessrule', businessRuleTriggerItem);
    Ti.App.fireEvent('sensimity:businessrule', businessRuleTriggerItem);
  }
};

/**
 * Handle a beacon if no businessrule is set for current
 * @param beacon
 * @param knownBeacon
 */
const handleBeacon = (beacon, knownBeacon) => {
  const eventItem = {
    beacon,
    knownBeacon: knownBeacon.toJSON(),
  };
  Alloy.Globals.sensimityDispatcher.trigger('sensimity:beacon', eventItem);
  Ti.App.fireEvent('sensimity:beacon', eventItem);
};

/**
 * Add a found beacon to check moving towards or moving away from
 * @param proximity proximity value to check compare the distance
 * @param beaconId beacon identifier
 */
const addFoundBeacon = (proximity, beaconId) => {
  foundBeacons = _.without(foundBeacons, _.findWhere(foundBeacons, {
    beaconId,
  }));
  foundBeacons.push({
    beaconId,
    proximity,
  });
};

/**
 * Public functions
 */

/**
 * Initialize the handler and set the notify and knownbeaconservice
 */
const init = () => {
  foundBeacons = [];
};

/**
 * This function must be called when the beaconscanner founds a beacon. It checks beacon exists in the system and search for the appropiate business rule(s).
 * @param mappedBeacon Mapped beacon is a found beacon in the base scanner
 */
const handle = mappedBeacon => {
  const knownBeacon = knownBeaconService.findKnownBeacon(mappedBeacon.UUID, mappedBeacon.major, mappedBeacon.minor);
    // If beacon = unknown, do nothing
  if (!_.isEmpty(knownBeacon)) {
    // Trigger a 'beacon found' event
    handleBeacon(mappedBeacon, knownBeacon);

    // Find appropiate business rules
    const businessRules = businessRuleService.getBusinessRules(knownBeacon);

    // Handle every businessrule
    businessRules.forEach(businessRule =>
      handleBusinessRule(businessRule, mappedBeacon, knownBeacon));

    // add found beacon with proximity and beacon_id
    addFoundBeacon(mappedBeacon.proximity, knownBeacon.get('beacon_id'));
  }
};

export default {
  init,
  handle,
};
