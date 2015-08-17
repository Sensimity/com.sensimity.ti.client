'use strict';
/* Compatibility for Ti standalone (without Alloy) */
if (typeof OS_ANDROID === "undefined") {
    var OS_ANDROID = Ti.Platform.name === "android";
    var OS_IOS = Ti.Platform.name === "iPhone OS";
}

var token,
    expires,
    sensimityUrl = "http://local-api.sensimity.com/",
    api = require('reste'),
    oauth2 = require('./oauth2');

function setApiConfig() {
    api.config({
        debug: false, // allows logging to console of ::REST:: messages
        autoValidateParams: false, // set to true to throw errors if <param> url properties are not passed
        timeout: 10000,
        url: sensimityUrl,
        requestHeaders: {
            "Accept": "application/vnd.sensimity.v1+json",
            "Content-Type": "application/vnd.sensimity.v1+json",
            "Authorization": "Bearer " + Ti.App.Properties.getString('sensimity_accesstoken')
        },
        methods: [
            {
                name: "getBeacons",
                get: "network/<networkId>/beacon"
            },
            {
                name: "getBusinessRules",
                get: "network/<networkId>/business-rule?beacon=<beaconId>"
            },
            {
                name: "getSingleBusinessRule",
                get: "network/<networkId>/business-rule/<businessRuleId>"
            },
            {
                name: "sendScanResults",
                post: "scan-results"
            }
        ],
        onError: function(e) {
            Ti.API.info('There was an error accessing the API > ' + JSON.stringify(e));
        },
        onLoad: function(e, callback) {
            callback(e);
        }
    });
}

function getBeacons(id, callback) {
    oauth2.init(function() {
        setApiConfig();
        api.getBeacons({networkId: id}, function (beacons) {
            callback(beacons);
        });
    });
}

function getBusinessRules(networkId, beaconId, callback) {
    oauth2.init(function() {
        setApiConfig();
        api.getBusinessRules({
            networkId: networkId,
            beaconId: beaconId
        }, function (response) {
            callback(response);
        });
    });
}

function getSingleBusinessRule(networkId, businessRuleId, callback) {
    oauth2.init(function() {
        setApiConfig();
        api.getSingleBusinessRule({
            networkId: networkId,
            businessRuleId: businessRuleId
        }, function (response) {
            callback(response);
        });
    });
}

function sendScanResults(post, callback) {
    oauth2.init(function() {
        setApiConfig();
        api.sendScanResults({
            body: post
        }, callback);
    });
}

module.exports = {
    'getBeacons': getBeacons,
    'sendScanResults': sendScanResults,
    'getSingleBusinessRule': getSingleBusinessRule,
    'getBusinessRules': getBusinessRules
};
