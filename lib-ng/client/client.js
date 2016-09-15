import Reste from 'reste';
import oauth2 from './oauth2';
import sensimityConfig from '../config/config';

const api = new Reste();

const setApiConfig = () => {
  const url = sensimityConfig.url || 'https://api.sensimity.com/';
  api.config({
    debug: false, // allows logging to console of ::REST:: messages
    autoValidateParams: false, // set to true to throw errors if <param> url properties are not passed
    timeout: 10000,
    url,
    requestHeaders: {
      Accept: 'application/vnd.sensimity.v1+json',
      'Content-Type': 'application/vnd.sensimity.v1+json',
      Authorization: 'Bearer ' + oauth2.getAccess().token,
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
    onLoad: (e, callback) => callback(e),
    onError: e => Ti.API.info('There was an error accessing the API > ' + JSON.stringify(e)),
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
