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
    onError: function(e) {
        Ti.API.info('There was an error accessing the API > ' + JSON.stringify(e));
    },
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
    if (checkRefreshTokenExpired()) {
        obtainOAuthToken(clientReady);
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
function checkRefreshTokenExpired() {
    if (_.isEmpty(getSensimityObject()) || _.isUndefined(getSensimityObject().expires)) {
        return true;
    }

    return (getCurrentTimestamp() > getSensimityObject().expires)
}
// Obtain the oauth token by refreshtoken or password
function obtainOAuthToken(successCallback) {
    if (checkRefreshTokenAvailable()) {
        var sensimityObject = getSensimityObject();
        api.oauth({
            body: {
                username: Alloy.CFG.sensimity.username,
                refresh_token: sensimityObject.refreshToken,
                grant_type: 'refresh_token'
            }
        }, function(response) {
            saveObtainOAuthTokensData(response);
            successCallback();
        });
    } else {
        api.oauth({
            body: {
                username: Alloy.CFG.sensimity.username,
                password: Alloy.CFG.sensimity.password,
                grant_type: 'password'
            }
        }, function(response) {
            saveObtainOAuthTokensData(response);
            successCallback();
        });
    }
}

// Save the obtained token
function saveObtainOAuthTokensData(response) {
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
function checkRefreshTokenAvailable() {
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
