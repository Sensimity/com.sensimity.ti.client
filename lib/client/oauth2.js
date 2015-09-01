'use strict';

/* jshint ignore:start */
var Alloy = require('alloy'),
    _ = require('alloy/underscore')._,
    Backbone = require('alloy/backbone');
/* jshint ignore:end */

var expires,
    basicAuthHeader = Ti.Utils.base64encode(Alloy.CFG.sensimity.basicHeaderAuthUsername + ':' + Alloy.CFG.sensimity.basicHeaderAuthPassword).toString(),
    url = "https://api.sensimity.com/",
    reste = require("reste"),
    api = new reste();

if (!_.isUndefined(Alloy.CFG.sensimity.url)) {
    url = Alloy.CFG.sensimity.url;
}

api.config({
    debug: false, // allows logging to console of ::REST:: messages
    autoValidateParams: false, // set to true to throw errors if <param> url properties are not passed
    timeout: 10000,
    url: url,
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
exports.getAuth = getAuth;

/**
 * Private functions
 */

// Check the expiredate is undefined or is expired
function isAccessTokenExpired() {
    var auth = getAuth();
    if (_.isEmpty(auth) || _.isUndefined(auth).expires) {
        Ti.API.info("SENSIMITY CLIENT accesstoken expired");
        return true;
    }

    if (getCurrentTimestamp() > auth.expires) {
        Ti.API.info("SENSIMITY CLIENT accesstoken expired");
        return true;
    }

    Ti.API.info("SENSIMITY CLIENT accesstoken valid");
    return false;
}

// Refresh the accesstoken by refreshtoken or password
function refreshAccessToken(successCallback) {
    var requestBody = {};

    if (isRefreshTokenAvailable()) {
        Ti.API.info("SENSIMITY CLIENT refreshtoken available");
        var auth = getAuth();
        requestBody.refresh_token = auth.refreshToken;
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
                        setAuth({});
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
    var auth = getAuth();
    // Save the retrieved accesstoken
    auth.accessToken = response.access_token;
    if (!_.isUndefined(response.refresh_token)) {
        // If also an refreshtoken is retrieved, save the refreshtoken
        auth.refreshToken = response.refresh_token;
    }
    // save the time when the accesstoken expires
    auth.expires = getCurrentTimestamp() + response.expires_in;
    setAuth(auth);
}

// check refreshtoken is earlier retrieved
function isRefreshTokenAvailable() {
    var auth = getAuth();
    return !_.isEmpty(auth) && !_.isUndefined(auth.refreshToken);
}

// Get current typestamp
function getCurrentTimestamp() {
    return Math.floor(new Date().getTime() / 1000);
}

function getAuth() {
    return Ti.App.Properties.getObject('sensimity_oauth', {});
}

function setAuth(object) {
    Ti.App.Properties.setObject('sensimity_oauth', object);
}
