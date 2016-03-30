/* jshint ignore:start */
var Alloy = require('alloy'),
    _ = require('alloy/underscore')._,
    Backbone = require('alloy/backbone');
/* jshint ignore:end */

var sensimityClient = require('./../client/client'),
    baseSensimityService = require('./../service/base');

/**
 * Public functions
 */

/*******
 * Function to refresh the beacons from Sensimity of a known beacon
 * @param {Object} knownBeacon find the business rules of this beacon
 */
function fetchBusinessRules(knownBeacon) {
    sensimityClient.getBusinessRules(knownBeacon.get('network_id'), knownBeacon.get('beacon_id'), function (data) {
        if (!_.isEmpty(data._embedded.business_rule)) {
            _.each(data._embedded.business_rule, function (businessruleRaw) {
                saveFetchedBusinessRules(businessruleRaw);
            });
        }
    });
}


/****
 * Function to get all the business rules already saved on the phone
 * @param knownBeacon knownBeacon Get the business rules of this beacon
 */
function getBusinessRules(knownBeacon) {
    var library = baseSensimityService.createSensimityCollection('BusinessRule');
    library.fetch();
    var businessRules = library.where({beacon_id: knownBeacon.get('beacon_id')});
    return businessRules;
}

exports.getBusinessRules = getBusinessRules;
exports.fetchBusinessRules = fetchBusinessRules;

/**
 * Private functions
 */

/******
 * Function to save all the business rules fetched at the fetchSingleBusinessRule function
 * @param {Object} data retrieved raw business rule data
 */
function saveFetchedBusinessRules(data) {
    // Check business rule already exists in the system
    var existingBusinessRule = findExistingBusinessRule(data.business_rule_id),
        businessRule;
    if (_.isEmpty(existingBusinessRule)) {
        // CREATE NEW Business rule
        businessRule = createNewBusinessRuleItem(data);
    } else {
        // Override existing business rule
        businessRule = setNewDataInExistingBusinessRule(existingBusinessRule, data);
    }
    businessRule.save();
}

/**
 * Create a new businessrule item from the data received from Sensimity
 * @param data The businessrule received from Sensimitys
 * @returns BusinessRule a created businessrule
 */
function createNewBusinessRuleItem(data) {
    return baseSensimityService.createSensimityModel('BusinessRule', {
        business_rule_id: data.business_rule_id,
        beacon_id: data.beacon_id,
        type: data.business_rule_type,
        interaction_id: data.interaction_id,
        interaction_type: data.interaction_type,
        content: data.content
    });
}

/**
 * Set new information retrieved from Sensimity in de Businessrule
 * @param existingBusinessRule The businessrule earlier retrieved from Sensimity
 * @param data The new data
 */
function setNewDataInExistingBusinessRule(existingBusinessRule, data) {
    // Override existing business rule
    existingBusinessRule.set('beacon_id', data.beacon_id);
    existingBusinessRule.set('type', data.business_rule_type);
    existingBusinessRule.set('interaction_id', data.interaction_id);
    existingBusinessRule.set('interaction_type', data.interaction_type);
    existingBusinessRule.set('content', data.content);
    return existingBusinessRule;

}

/*****
 * Find a business rule based on businessrule Id
 * @param id businessRuleId
 */
function findExistingBusinessRule(businessRuleId) {
    var library = baseSensimityService.createSensimityCollection('BusinessRule');
    library.fetch();
    var businessRule = library.where({business_rule_id: businessRuleId});
    if (_.isEmpty(businessRule)) {
        return businessRule;
    } else {
        return _.first(businessRule);
    }
}
