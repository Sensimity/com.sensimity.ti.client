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
    api = new reste(),
    access = {};

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
exports.getAccess = getAccess;

/**
 * Private functions
 */

// Check the expiredate is undefined or is expired
function isAccessTokenExpired() {
    getAccess();
    if (_.isEmpty(access)) {
        return true;
    }

    if (now() > access.expires) {
        return true;
    }

    return false;
}

// Refresh the accesstoken by refreshtoken or password
function refreshAccessToken(successCallback) {
    var requestBody = {};

    if (isRefreshTokenAvailable()) {
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
    auth.expires = now() + response.expires_in;
    setAuth(auth);
}

// check refreshtoken is earlier retrieved
function isRefreshTokenAvailable() {
    var auth = getAuth();
    return !_.isEmpty(auth) && !_.isUndefined(auth.refreshToken);
}

// Get now
function now() {
    return Math.floor(new Date().getTime() / 1000);
}

// Get access from memory or storage
function getAccess() {
    if (_.isEmpty(access)) {
        var auth = getAuth();
        if (_.isEmpty(auth) || _.isNaN(auth.expires)) {
            return {};
        }
        access = {
            expires: auth.expires,
            token: auth.accessToken
        };
    }

    return access;
}

// Get oauth credentials from storage
function getAuth() {
    return Ti.App.Properties.getObject('sensimity_oauth', {});
}

// Set oauth credentials in storage and update the access variable in memory
function setAuth(object) {
    if (_.isEmpty(object)) {
        access = {};
    } else {
        access = {
            expires: object.expires,
            token: object.accessToken
        };
    }
    Ti.App.Properties.setObject('sensimity_oauth', object);
}

