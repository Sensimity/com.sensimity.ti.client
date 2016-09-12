const Alloy = require('alloy');
import { _ } from 'alloy/underscore';
import Reste from 'reste';
import oauth2 from './oauth2';

let url = 'https://api.sensimity.com/';
const api = new Reste();

if (!_.isUndefined(Alloy.CFG.sensimity.url)) {
  url = Alloy.CFG.sensimity.url;
}

const setApiConfig = () => {
  api.config({
    debug: true, // allows logging to console of ::REST:: messages
    autoValidateParams: false, // set to true to throw errors if <param> url properties are not passed
    timeout: 10000,
    url: url,
    requestHeaders: {
      'Accept': 'application/vnd.sensimity.v1+json',
      'Content-Type': 'application/vnd.sensimity.v1+json',
      'Authorization': 'Bearer ' + oauth2.getAccess().token,
    },
    methods: [
      {
        name: 'getNetworks',
        get: 'network',
      },
      {
        name: 'getBeacons',
        get: 'network/<networkId>/beacon',
      },
      {
        name: 'getBusinessRules',
        get: 'network/<networkId>/business-rule?beacon=<beaconId>',
      },
      {
        name: 'getSingleBusinessRule',
        get: 'network/<networkId>/business-rule/<businessRuleId>',
      },
      {
        name: 'sendScanResults',
        post: 'scan-results',
      },
    ],
    onError: e =>
      Ti.API.info('There was an error accessing the API > ' + JSON.stringify(e)),
    onLoad: (e, callback) => callback(e),
  });
};

const getNetworks = callback =>
  oauth2.init(() => {
    setApiConfig();
    api.getNetworks(beacons => callback(beacons));
  });

const getBeacons = (id, callback) =>
  oauth2.init(() => {
    setApiConfig();
    api.getBeacons({networkId: id}, beacons => callback(beacons));
  });

const getBusinessRules = (networkId, beaconId, callback) =>
  oauth2.init(() => {
    setApiConfig();
    api.getBusinessRules({
      networkId,
      beaconId,
    }, response => callback(response));
  });

const getSingleBusinessRule = (networkId, businessRuleId, callback) =>
  oauth2.init(() => {
    setApiConfig();
    api.getSingleBusinessRule({
      networkId,
      businessRuleId,
    }, response => callback(response));
  });

const sendScanResults = (body, callback) =>
  oauth2.init(() => {
    setApiConfig();
    api.sendScanResults({
      body,
    }, callback);
  });

export default {
  getNetworks,
  getBeacons,
  sendScanResults,
  getSingleBusinessRule,
  getBusinessRules,
};
