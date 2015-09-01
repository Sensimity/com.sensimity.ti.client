'use strict';

/* jshint ignore:start */
var Alloy = require('alloy'),
    _ = require('alloy/underscore')._,
    Backbone = require('alloy/backbone');
/* jshint ignore:end */

var expires,
    basicAuthHeader = Ti.Utils.base64encode(Alloy.CFG.sensimity.basicHeaderAuthUsername + ':' + Alloy.CFG.sensimity.basicHeaderAuthPassword).toString(),
    sensimityUrl = "https://api.sensimity.com/",
    reste = require("reste"),
    api = new reste();

if (!_.isUndefined(Alloy.CFG.sensimity.local) && Alloy.CFG.sensimity.local) {
    sensimityUrl = "https://local-api.sensimity.com/";
}

api.config({
    debug: false, // allows logging to console of ::REST:: messages
    autoValidateParams: false, // set to true to throw errors if <param> url properties are not passed
    timeout: 10000,
    url: sensimityUrl,
    requestHeaders: {
        "Accept": "application/vnd.sensimity.v1+json",
        "Content-Type": "application/vnd.sensimity.v1+json",
        "Authorization": 'Basic ' + basicAuthHeader
    },
    methods: [{
        name: 'oauth',
        post: 'oauth'
    }],
    onLoad: function(e, callback) {
        callback(e);
    }
});

/**
 * Initialize the oauthClient, first retrieve the oAuth refreshtoken and trigger the callback.
 * @param Callback you can send a POST or GET request after fetching a new oAuth token
 */
function init(clientReady) {
    // Check the refreshtoken is expired, if expired retrieve a new accesstoken
    if (isAccessTokenExpired()) {
        refreshAccessToken(clientReady);
    } else {
        // Set callback
        clientReady();
    }
}

exports.init = init;
exports.getSensimityObject = getSensimityObject;

/**
 * Private functions
 */

// Check the expiredate is undefined or is expired
function isAccessTokenExpired() {
    if (_.isEmpty(getSensimityObject()) || _.isUndefined(getSensimityObject().expires)) {
        Ti.API.info("SENSIMITY CLIENT accesstoken expired");
        return true;
    }

    if (getCurrentTimestamp() > getSensimityObject().expires) {
        Ti.API.info("SENSIMITY CLIENT accesstoken expired");
        return true;
    }

    Ti.API.info("SENSIMITY CLIENT accesstoken valid");
    return false;
}
// Obtain the oauth token by refreshtoken or password
function refreshAccessToken(successCallback) {
    var requestBody = {};

    if (isRefreshTokenAvailable()) {
        Ti.API.info("SENSIMITY CLIENT refreshtoken available");
        var sensimityObject = getSensimityObject();
        requestBody.refresh_token = sensimityObject.refreshToken;
        requestBody.grant_type = 'refresh_token';
    } else {
        requestBody.username = Alloy.CFG.sensimity.username;
        requestBody.password = Alloy.CFG.sensimity.password;
        requestBody.grant_type = 'password';
    }

    api.oauth({
        body: requestBody
    }, function(response) {
        if (!_.isUndefined(response.status)) {
            switch (response.status) {
                case 400:
                    if (!_.isUndefined(response.title) && response.title === 'invalid_grant') {
                        Ti.API.info("SENSIMITY CLIENT refreshtoken expired, retry login");
                        Ti.App.Properties.setObject('sensimity_oauth', {});
                        refreshAccessToken(successCallback);
                    }
                    return;
                    break;
                default:
                    Ti.API.info("Response status is set");
                    break;
            }
        }

        Ti.API.info('SENSIMITY CLIENT response ' + JSON.stringify(response));
        saveTokens(response);
        successCallback();
    });
}

// Save the obtained token
function saveTokens(response) {
    var sensimityObject = getSensimityObject();
    // Save the retrieved accesstoken
    sensimityObject.accessToken = response.access_token;
    if (!_.isUndefined(response.refresh_token)) {
        // If also an refreshtoken is retrieved, save the refreshtoken
        sensimityObject.refreshToken = response.refresh_token;
    }
    // save the time when the accesstoken expires
    sensimityObject.expires = getCurrentTimestamp() + response.expires_in;
    saveSensimityObject(sensimityObject);
}

// check refreshtoken is earlier retrieved
function isRefreshTokenAvailable() {
    var sensimityObject = getSensimityObject();
    return !_.isEmpty(sensimityObject) && !_.isUndefined(sensimityObject.refreshToken);
}

// Get current typestamp
function getCurrentTimestamp() {
    return Math.floor(new Date().getTime() / 1000);
}

function getSensimityObject() {
    return Ti.App.Properties.getObject('sensimity_oauth', {});
}

function saveSensimityObject(sensimityObject) {
    Ti.App.Properties.setObject('sensimity_oauth', sensimityObject);
}
