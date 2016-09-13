import { _ } from 'alloy/underscore';
import client from './../client/client';
import { createSensimityCollection, createSensimityModel } from './../service/base';

/**
 * Create a new businessrule item from the data received from Sensimity
 * @param data The businessrule received from Sensimitys
 * @returns BusinessRule a created businessrule
 */
const createNewBusinessRuleItem = data =>
  createSensimityModel('BusinessRule', {
    business_rule_id: data.business_rule_id,
    beacon_id: data.beacon_id,
    type: data.business_rule_type,
    interaction_id: data.interaction_id,
    interaction_type: data.interaction_type,
    content: data.content,
  });

/**
 * Set new information retrieved from Sensimity in de Businessrule
 * @param existingBusinessRule The businessrule earlier retrieved from Sensimity
 * @param data The new data
 */
const setNewDataInExistingBusinessRule = (existingBusinessRule, data) => {
    // Override existing business rule
  existingBusinessRule.set('beacon_id', data.beacon_id);
  existingBusinessRule.set('type', data.business_rule_type);
  existingBusinessRule.set('interaction_id', data.interaction_id);
  existingBusinessRule.set('interaction_type', data.interaction_type);
  existingBusinessRule.set('content', data.content);
  return existingBusinessRule;
};

/**
 * Find a business rule based on businessrule Id
 * @param id businessRuleId
 */
const findExistingBusinessRule = businessRuleId => {
  const library = createSensimityCollection('BusinessRule');
  library.fetch();
  const businessRule = library.where({business_rule_id: businessRuleId});
  if (_.isEmpty(businessRule)) {
    return businessRule;
  }
  return _.first(businessRule);
};

/**
 * Function to save all the business rules fetched at the fetchSingleBusinessRule function
 * @param {Object} data retrieved raw business rule data
 */
const saveFetchedBusinessRules = data => {
  // Check business rule already exists in the system
  const existingBusinessRule = findExistingBusinessRule(data.business_rule_id);
  let businessRule;
  if (_.isEmpty(existingBusinessRule)) {
    // CREATE NEW Business rule
    businessRule = createNewBusinessRuleItem(data);
  } else {
    // Override existing business rule
    businessRule = setNewDataInExistingBusinessRule(existingBusinessRule, data);
  }
  businessRule.save();
};


/**
 * Function to refresh the beacons from Sensimity of a known beacon
 * @param {Object} knownBeacon find the business rules of this beacon
 */
const fetchBusinessRules = knownBeacon =>
  client.getBusinessRules(knownBeacon.get('network_id'), knownBeacon.get('beacon_id'), data => {
    if (!_.isEmpty(data._embedded.business_rule)) {
      data._embedded.business_rule.forEach(businessruleRaw => saveFetchedBusinessRules(businessruleRaw));
    }
  });

/**
 * Function to get all the business rules already saved on the phone
 * @param knownBeacon knownBeacon Get the business rules of this beacon
 */
const getBusinessRules = knownBeacon => {
  const library = createSensimityCollection('BusinessRule');
  library.fetch();
  return library.where({beacon_id: knownBeacon.get('beacon_id')});
};

export default {
  getBusinessRules,
  fetchBusinessRules,
};
