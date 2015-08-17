'use strict';

var expires,
    basicAuthHeader = Ti.Utils.base64encode(Alloy.CFG.sensimity.basicHeaderAuthUsername + ':' + Alloy.CFG.sensimity.basicHeaderAuthPassword).toString(),
    sensimityUrl = "http://local-api.sensimity.com/",
    api = require('reste');

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

/**
 * Private functions
 */

// Check the expiredate is undefined or is expired
function checkRefreshTokenExpired() {
    return (_.isEqual(Ti.App.Properties.getInt('sensimity_oauth_expires', 0), 0) || (getCurrentTimestamp() > Ti.App.Properties.getInt('sensimity_oauth_expires', 0)));
}
// Obtain the oauth token by refreshtoken or password
function obtainOAuthToken(successCallback) {
    if (checkRefreshTokenAvailable()) {
        api.oauth({
            body: {
                username: Alloy.CFG.sensimity.username,
                refresh_token: Ti.App.Properties.getString('sensimity_refreshtoken'),
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
    // Save the retrieved accesstoken
    Ti.App.Properties.setString('sensimity_accesstoken', response.access_token);
    if (!_.isUndefined(response.refresh_token)) {
        // If also an refreshtoken is retrieved, save the refreshtoken
        Ti.App.Properties.setString('sensimity_refreshtoken', response.refresh_token);
    }
    // save the time when the accesstoken expires
    expires = getCurrentTimestamp() + response.expires_in;
    // Save the time the refreshtoken expires
    Ti.App.Properties.setInt('sensimity_oauth_expires', expires);
}

// check refreshtoken is earlier retrieved
function checkRefreshTokenAvailable() {
    return !(_.isUndefined(expires) ||
    _.isUndefined(Ti.App.Properties.getString('sensimity_refreshtoken')) ||
    _.isNull(Ti.App.Properties.getString('sensimity_refreshtoken')));
}

// Get current typestamp
function getCurrentTimestamp() {
    return Math.floor(new Date().getTime() / 1000);
}
