import { _ } from 'alloy/underscore';
import Reste from 'reste';
import sensimityConfig from '../config/config';

const basicAuthHeader =
  Ti.Utils.base64encode(`${sensimityConfig.basicHeaderAuthUsername}:${sensimityConfig.basicHeaderAuthPassword}`).toString();
const api = new Reste();
let access = {};

const url = sensimityConfig.url || 'https://api.sensimity.com/';
api.config({
  debug: false, // allows logging to console of ::REST:: messages
  autoValidateParams: false, // set to true to throw errors if <param> url properties are not passed
  timeout: 10000,
  url: url,
  requestHeaders: {
    Accept: 'application/vnd.sensimity.v1+json',
    'Content-Type': 'application/vnd.sensimity.v1+json',
    Authorization: `Basic ${basicAuthHeader}`,
  },
  methods: [{ name: 'oauth', post: 'oauth' }],
  onLoad: (e, callback) => callback(e),
});

/**
 * Private functions
 */

// Get oauth credentials from storage
const getAuth = () => Ti.App.Properties.getObject('sensimity_oauth', {});

// Set oauth credentials in storage and update the access variable in memory
const setAuth = object => {
  if (_.isEmpty(object)) {
    access = {};
  } else {
    access = {
      expires: object.expires,
      token: object.accessToken,
    };
  }
  Ti.App.Properties.setObject('sensimity_oauth', object);
};

// Get now
const now = () => Math.floor(new Date().getTime() / 1000);

// Get access from memory or storage
const getAccess = () => {
  if (_.isEmpty(access)) {
    const auth = getAuth();
    if (_.isEmpty(auth) || _.isNaN(auth.expires)) {
      return {};
    }
    access = {
      expires: auth.expires,
      token: auth.accessToken,
    };
  }

  return access;
};

// Check the expiredate is undefined or is expired
const isAccessTokenExpired = () => {
  getAccess();
  return (_.isEmpty(access) || now() > access.expires);
};

// check refreshtoken is earlier retrieved
const isRefreshTokenAvailable = () => {
  const auth = getAuth();
  return !_.isEmpty(auth) && !_.isUndefined(auth.refreshToken);
};

// Save the obtained token
const saveTokens = response => {
  const auth = getAuth();
    // Save the retrieved accesstoken
  auth.accessToken = response.access_token;
  if (!_.isUndefined(response.refresh_token)) {
    // If also an refreshtoken is retrieved, save the refreshtoken
    auth.refreshToken = response.refresh_token;
  }

  // save the time when the accesstoken expires
  auth.expires = now() + response.expires_in;
  setAuth(auth);
};

// Refresh the accesstoken by refreshtoken or password
const refreshAccessToken = successCallback => {
  const body = {};

  if (isRefreshTokenAvailable()) {
    body.refresh_token = getAuth().refreshToken;
    body.grant_type = 'refresh_token';
  } else {
    body.username = sensimityConfig.username;
    body.password = sensimityConfig.password;
    body.grant_type = 'password';
  }

  api.oauth({ body }, response => {
    if (response.status) {
      switch (response.status) {
      case 400:
        if (response.title === 'invalid_grant') {
          setAuth({});
          refreshAccessToken(successCallback);
        }
        return;
      default:
        Ti.API.info('Response status is set');
        break;
      }
    }

    saveTokens(response);
    successCallback();
  });
};

/**
 * Initialize the oauthClient, first retrieve the oAuth refreshtoken and trigger the callback.
 * @param Callback you can send a POST or GET request after fetching a new oAuth token
 */
const init = clientReady =>
    // Check the refreshtoken is expired, if expired retrieve a new accesstoken
  isAccessTokenExpired() ?
      refreshAccessToken(clientReady) : clientReady(); // Set callback

export default {
  init,
  getAccess,
};
