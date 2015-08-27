/* jshint ignore:start */
var Alloy = require('alloy'),
    _ = require('alloy/underscore')._,
    Backbone = require('alloy/backbone');
/* jshint ignore:end */

var businessRuleService = require('./../service/businessRule'),
    knownBeaconService = require('./../service/knownBeacons'),
    foundBeacons, // Found beacons is used to handle the moving towards and moving away from business rules
    typeOfAvailableBusinessRules = { // Types of available Business rules
        far: 'far',
        close: 'close',
        immediate: 'immediate',
        movingTowards: 'moving_towards',
        movingAwayFrom: 'moving_away_from'
    },
    proximities = {
        far: 'far',
        close: 'near',
        immediate: 'immediate'
    };

/**
 * Public functions
 */

/*****
 * Initialize the handler and set the notify and knownbeaconservice
 */
function init() {
    foundBeacons = [];
}

/****
 * This function must be called when the beaconscanner founds a beacon. It checks beacon exists in the system and search for the appropiate business rule(s).
 * @param mappedBeacon Mapped beacon is a found beacon in the base scanner
 */
function handle(mappedBeacon) {
    var knownBeacon = knownBeaconService.findKnownBeacon(mappedBeacon.UUID, mappedBeacon.major, mappedBeacon.minor);
    // If beacon = unknown, do nothing
    if (!_.isEmpty(knownBeacon)) {
        // Trigger a 'beacon found' event
        handleBeacon(mappedBeacon, knownBeacon);

        // Find appropiate business rules
        var businessRules = businessRuleService.getBusinessRules(knownBeacon);

        // Handle every businessrule
        _.each(businessRules, function(businessRule) {
            handleBusinessRule(businessRule, mappedBeacon, knownBeacon);
        });

        // add found beacon with proximity and beacon_id
        addFoundBeacon(mappedBeacon.proximity, knownBeacon.get('beacon_id'));
    }
}

exports.init = init;
exports.handle = handle;


/**
 * Private functions
 */

/****
 * Handle and checks beaconproximity and businessrule are the same. If businessrule is active, trigger the dispatcher to use this businessrule in the app
 * @param businessRule
 * @param beacon found Beacon in basescanner
 * @param knownBeacon knownBeacon from local database
 */
function handleBusinessRule(businessRule, beacon, knownBeacon) {
    var businessRuleType = businessRule.get('type');
    var businessRuleTriggerItem = {
        businessRule: businessRule.toJSON(),
        beacon: beacon,
        knownBeacon: knownBeacon.toJSON()
    };

    if (_.isEqual(businessRuleType, typeOfAvailableBusinessRules.far) && _.isEqual(beacon.proximity, proximities.far)) {
        Alloy.Globals.sensimityEvent.trigger('sensimity:businessrule', businessRuleTriggerItem);
        Ti.App.fireEvent('sensimity:businessrule', businessRuleTriggerItem);
    }

    if (_.isEqual(businessRuleType, typeOfAvailableBusinessRules.close) && _.isEqual(beacon.proximity, proximities.close)) {
        Alloy.Globals.sensimityEvent.trigger('sensimity:businessrule', businessRuleTriggerItem);
        Ti.App.fireEvent('sensimity:businessrule', businessRuleTriggerItem);
    }

    if (_.isEqual(businessRuleType, typeOfAvailableBusinessRules.immediate) && _.isEqual(beacon.proximity, proximities.immediate)) {
        Aulloy.Globals.sensimityEvent.trigger('sensimity:businessrule', businessRuleTriggerItem);
        Ti.App.fireEvent('sensimity:businessrule', businessRuleTriggerItem);
    }

    if (_.isEqual(businessRuleType, typeOfAvailableBusinessRules.movingTowards) && checkMovingTowards(beacon.proximity, knownBeacon.get('beacon_id'))) {
        Alloy.Globals.sensimityEvent.trigger('sensimity:businessrule', businessRuleTriggerItem);
        Ti.App.fireEvent('sensimity:businessrule', businessRuleTriggerItem);
    }

    if (_.isEqual(businessRuleType, typeOfAvailableBusinessRules.movingAwayFrom) && checkMovingAwayFrom(beacon.proximity, knownBeacon.get('beacon_id'))) {
        Alloy.Globals.sensimityEvent.trigger('sensimity:businessrule', businessRuleTriggerItem);
        Ti.App.fireEvent('sensimity:businessrule', businessRuleTriggerItem);
    }
}

/**
 * Handle a beacon if no businessrule is set for current
 * @param beacon
 * @param knownBeacon
 */
function handleBeacon(beacon, knownBeacon) {
    var eventItem = {
        beacon: beacon,
        knownBeacon: knownBeacon.toJSON()
    };
    Alloy.Globals.sensimityEvent.trigger('sensimity:beacon', eventItem);
    Ti.App.fireEvent('sensimity:beacon', eventItem);
}

/**
 * Add a found beacon to check moving towards or moving away from
 * @param proximity proximity value to check compare the distance
 * @param beaconId beacon identifier
 */
function addFoundBeacon(proximity, beaconId) {
    foundBeacons = _.without(foundBeacons, _.findWhere(foundBeacons, {
        beaconId: beaconId
    }));
    foundBeacons.push({
        beaconId: beaconId,
        proximity: proximity
    });
}

// Check the proximity of previous beacon has more distance than the new proximity
function checkMovingTowards(proximity, beaconId) {
    var lastFoundBeacon = _.findWhere(foundBeacons, {
        beaconId: beaconId,
        proximity: proximities.close
    });
    return (!_.isEmpty(lastFoundBeacon) && (_.isEqual(proximity, proximities.close) || _.isEqual(proximity, proximities.immediate)));
}

// Check the proximity of previous beacon has less distance than the new proximity
function checkMovingAwayFrom(proximity, beaconId) {
    var lastFoundImmediateBeacon = _.findWhere(foundBeacons, {
        beaconId: beaconId,
        proximity: proximities.close
    });
    var lastFoundNearBeacon = _.findWhere(foundBeacons, {
        beaconId: beaconId,
        proximity: proximities.immediate
    });
    return ((!_.isEmpty(lastFoundNearBeacon) || !_.isEmpty(lastFoundImmediateBeacon)) && (_.isEqual(proximity, proximities.far)));
}
