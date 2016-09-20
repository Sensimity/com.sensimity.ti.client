import { Model as BeaconLogModel, Collection as BeaconLogCollection } from '../models/BeaconLog';
import { Model as BusinessRuleModel, Collection as BusinessRuleCollection } from '../models/BusinessRule';
import { Model as KnownBeaconModel, Collection as KnownBeaconCollection } from '../models/KnownBeacon';

/**
 * Use an Model defined in the sensimity library
 * @param name The name of the model
 * @param args Arguments for creating a Backbone model
 */
const createSensimityModel = (name, args) => {
  switch (name) {
  case 'BeaconLog':
    return new BeaconLogModel(args);
  case 'BusinessRule':
    return new BusinessRuleModel(args);
  default:
    return new KnownBeaconModel(args);
  }
};

/**
 * Use an Collection defined in the sensimity library
 * @param name The name of the model-collection
 * @param args Arguments for creating a Backbone collection
 */
const createSensimityCollection = (name, args) => {
  switch (name) {
  case 'BeaconLog':
    return new BeaconLogCollection(args);
  case 'BusinessRule':
    return new BusinessRuleCollection(args);
  default:
    return new KnownBeaconCollection(args);
  }
};

export {
  createSensimityModel,
  createSensimityCollection,
};
