(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g=(g.com||(g.com = {}));g=(g.sensimity||(g.sensimity = {}));g=(g.ti||(g.ti = {}));g.client = f()}})(function(){var define,module,exports;return (function e(t,n,r){function o(i,u){if(!n[i]){if(!t[i]){var a=typeof require=="function"&&require;if(!u&&a)return a.length===2?a(i,!0):a(i);if(s&&s.length===2)return s(i,!0);if(s)return s(i);var f=new Error("Cannot find module '"+i+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[i]={exports:{}};t[i][0].call(l.exports,function(e){var n=t[i][1][e];return o(n?n:e)},l,l.exports,e,t,n,r)}return n[i].exports}var i=Array.prototype.slice;Function.prototype.bind||Object.defineProperty(Function.prototype,"bind",{enumerable:!1,configurable:!0,writable:!0,value:function(e){function r(){return t.apply(this instanceof r&&e?this:e,n.concat(i.call(arguments)))}if(typeof this!="function")throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");var t=this,n=i.call(arguments,1);return r.prototype=Object.create(t.prototype),r.prototype.contructor=r,r}});var s=typeof require=="function"&&require;for(var u=0;u<r.length;u++)o(r[u]);return o})({1:[function(require,module,exports){
'use strict';

var sensimity = require('./lib/sensimity');

module.exports = sensimity;

},{"./lib/sensimity":19}],2:[function(require,module,exports){
'use strict';
/* Compatibility for Ti standalone (without Alloy) */
if (typeof OS_ANDROID === "undefined") {
    var OS_ANDROID = Ti.Platform.name === "android";
    var OS_IOS = Ti.Platform.name === "iPhone OS";
}

/* jshint ignore:start */
var Alloy = require('alloy'),
    _ = require('alloy/underscore')._,
    Backbone = require('alloy/backbone');
/* jshint ignore:end */

var token,
    expires,
    url = "https://api.sensimity.com/",
    reste = require("reste"),
    api = new reste(),
    oauth2 = require('./oauth2');

if (!_.isUndefined(Alloy.CFG.sensimity.url)) {
    url = Alloy.CFG.sensimity.url;
}

function setApiConfig() {
    api.config({
        debug: false, // allows logging to console of ::REST:: messages
        autoValidateParams: false, // set to true to throw errors if <param> url properties are not passed
        timeout: 10000,
        url: url,
        requestHeaders: {
            "Accept": "application/vnd.sensimity.v1+json",
            "Content-Type": "application/vnd.sensimity.v1+json",
            "Authorization": "Bearer " + oauth2.getAccess().token
        },
        methods: [
            {
                name: "getNetworks",
                get: "network"
            },
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

function getNetworks(callback) {
    oauth2.init(function() {
        setApiConfig();
        api.getNetworks(function (beacons) {
            callback(beacons);
        });
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
    'getNetworks': getNetworks,
    'getBeacons': getBeacons,
    'sendScanResults': sendScanResults,
    'getSingleBusinessRule': getSingleBusinessRule,
    'getBusinessRules': getBusinessRules
};

},{"./oauth2":3,"alloy":undefined,"alloy/backbone":undefined,"alloy/underscore":undefined,"reste":undefined}],3:[function(require,module,exports){
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


},{"alloy":undefined,"alloy/backbone":undefined,"alloy/underscore":undefined,"reste":undefined}],4:[function(require,module,exports){
/* jshint ignore:start */
var Alloy = require('alloy'),
    _ = require('alloy/underscore')._,
    Backbone = require('alloy/backbone');
/* jshint ignore:end */

module.exports = _.clone(Backbone.Events);

},{"alloy":undefined,"alloy/backbone":undefined,"alloy/underscore":undefined}],5:[function(require,module,exports){
/* jshint ignore:start */
var Alloy = require('alloy'),
    _ = require('alloy/underscore')._,
    Backbone = require('alloy/backbone');
/* jshint ignore:end */

var businessRuleService = require('./../service/businessRule'),
    knownBeaconService = require('./../service/knownBeacons'),
    foundBeacons, // Found beacons is used to handle the moving towards and moving away from business rules
    typeOfAvailableBusinessRules = { // Types of available Business rules
        far: 'far',
        close: 'close',
        immediate: 'immediate',
        movingTowards: 'moving_towards',
        movingAwayFrom: 'moving_away_from'
    },
    proximities = {
        far: 'far',
        close: 'near',
        immediate: 'immediate'
    };

/**
 * Public functions
 */

/*****
 * Initialize the handler and set the notify and knownbeaconservice
 */
function init() {
    foundBeacons = [];
}

/****
 * This function must be called when the beaconscanner founds a beacon. It checks beacon exists in the system and search for the appropiate business rule(s).
 * @param mappedBeacon Mapped beacon is a found beacon in the base scanner
 */
function handle(mappedBeacon) {
    var knownBeacon = knownBeaconService.findKnownBeacon(mappedBeacon.UUID, mappedBeacon.major, mappedBeacon.minor);
    // If beacon = unknown, do nothing
    if (!_.isEmpty(knownBeacon)) {
        // Trigger a 'beacon found' event
        handleBeacon(mappedBeacon, knownBeacon);

        // Find appropiate business rules
        var businessRules = businessRuleService.getBusinessRules(knownBeacon);

        // Handle every businessrule
        _.each(businessRules, function(businessRule) {
            handleBusinessRule(businessRule, mappedBeacon, knownBeacon);
        });

        // add found beacon with proximity and beacon_id
        addFoundBeacon(mappedBeacon.proximity, knownBeacon.get('beacon_id'));
    }
}

exports.init = init;
exports.handle = handle;


/**
 * Private functions
 */

/****
 * Handle and checks beaconproximity and businessrule are the same. If businessrule is active, trigger the dispatcher to use this businessrule in the app
 * @param businessRule
 * @param beacon found Beacon in basescanner
 * @param knownBeacon knownBeacon from local database
 */
function handleBusinessRule(businessRule, beacon, knownBeacon) {
    var businessRuleType = businessRule.get('type');
    var businessRuleTriggerItem = {
        businessRule: businessRule.toJSON(),
        beacon: beacon,
        knownBeacon: knownBeacon.toJSON()
    };

    if (_.isEqual(businessRuleType, typeOfAvailableBusinessRules.far) && _.isEqual(beacon.proximity, proximities.far)) {
        Alloy.Globals.sensimityEvent.trigger('sensimity:businessrule', businessRuleTriggerItem);
        Ti.App.fireEvent('sensimity:businessrule', businessRuleTriggerItem);
    }

    if (_.isEqual(businessRuleType, typeOfAvailableBusinessRules.close) && _.isEqual(beacon.proximity, proximities.close)) {
        Alloy.Globals.sensimityEvent.trigger('sensimity:businessrule', businessRuleTriggerItem);
        Ti.App.fireEvent('sensimity:businessrule', businessRuleTriggerItem);
    }

    if (_.isEqual(businessRuleType, typeOfAvailableBusinessRules.immediate) && _.isEqual(beacon.proximity, proximities.immediate)) {
        Alloy.Globals.sensimityEvent.trigger('sensimity:businessrule', businessRuleTriggerItem);
        Ti.App.fireEvent('sensimity:businessrule', businessRuleTriggerItem);
    }

    if (_.isEqual(businessRuleType, typeOfAvailableBusinessRules.movingTowards) && checkMovingTowards(beacon.proximity, knownBeacon.get('beacon_id'))) {
        Alloy.Globals.sensimityEvent.trigger('sensimity:businessrule', businessRuleTriggerItem);
        Ti.App.fireEvent('sensimity:businessrule', businessRuleTriggerItem);
    }

    if (_.isEqual(businessRuleType, typeOfAvailableBusinessRules.movingAwayFrom) && checkMovingAwayFrom(beacon.proximity, knownBeacon.get('beacon_id'))) {
        Alloy.Globals.sensimityEvent.trigger('sensimity:businessrule', businessRuleTriggerItem);
        Ti.App.fireEvent('sensimity:businessrule', businessRuleTriggerItem);
    }
}

/**
 * Handle a beacon if no businessrule is set for current
 * @param beacon
 * @param knownBeacon
 */
function handleBeacon(beacon, knownBeacon) {
    var eventItem = {
        beacon: beacon,
        knownBeacon: knownBeacon.toJSON()
    };
    Alloy.Globals.sensimityEvent.trigger('sensimity:beacon', eventItem);
    Ti.App.fireEvent('sensimity:beacon', eventItem);
}

/**
 * Add a found beacon to check moving towards or moving away from
 * @param proximity proximity value to check compare the distance
 * @param beaconId beacon identifier
 */
function addFoundBeacon(proximity, beaconId) {
    foundBeacons = _.without(foundBeacons, _.findWhere(foundBeacons, {
        beaconId: beaconId
    }));
    foundBeacons.push({
        beaconId: beaconId,
        proximity: proximity
    });
}

// Check the proximity of previous beacon has more distance than the new proximity
function checkMovingTowards(proximity, beaconId) {
    var lastFoundBeacon = _.findWhere(foundBeacons, {
        beaconId: beaconId,
        proximity: proximities.close
    });
    return (!_.isEmpty(lastFoundBeacon) && (_.isEqual(proximity, proximities.close) || _.isEqual(proximity, proximities.immediate)));
}

// Check the proximity of previous beacon has less distance than the new proximity
function checkMovingAwayFrom(proximity, beaconId) {
    var lastFoundImmediateBeacon = _.findWhere(foundBeacons, {
        beaconId: beaconId,
        proximity: proximities.close
    });
    var lastFoundNearBeacon = _.findWhere(foundBeacons, {
        beaconId: beaconId,
        proximity: proximities.immediate
    });
    return ((!_.isEmpty(lastFoundNearBeacon) || !_.isEmpty(lastFoundImmediateBeacon)) && (_.isEqual(proximity, proximities.far)));
}

},{"./../service/businessRule":22,"./../service/knownBeacons":23,"alloy":undefined,"alloy/backbone":undefined,"alloy/underscore":undefined}],6:[function(require,module,exports){
/* jshint ignore:start */
var Alloy = require('alloy'),
    _ = require('alloy/underscore')._,
    Backbone = require('alloy/backbone');
/* jshint ignore:end */

/**
 * Public functions
 */

/**
 * A mapping function make the beaconinfo retrieved with the drtech beaconscanner, general
 * @param beaconRaw The beacon retrieved from the beuckman
 * @returns {{UUID: string, major: Number, minor: Number, rssi: Number, accuracy: Number, proximity: String }}
 */
function map(beaconRaw) {
    return {
        UUID: beaconRaw.uuid.toUpperCase(),
        major: parseInt(beaconRaw.major),
        minor: parseInt(beaconRaw.minor),
        rssi: parseInt(beaconRaw.rssi, 10),
        accuracy: beaconRaw.accuracy,
        proximity: beaconRaw.proximity
    };
}

exports.map = map;

},{"alloy":undefined,"alloy/backbone":undefined,"alloy/underscore":undefined}],7:[function(require,module,exports){
/* jshint ignore:start */
var Alloy = require('alloy'),
    _ = require('alloy/underscore')._,
    Backbone = require('alloy/backbone');
/* jshint ignore:end */

/**
 * Create a beaconregion from a knownbeacon used by the altbeaconscanner
 * @param knownBeacon A knownbeacon
 * @returns {{uuid: String, identifier: String}}
 */
function map(knownBeacon) {
    return {
        uuid: knownBeacon.get('UUID'),
        identifier: knownBeacon.get('beacon_id')
    };
}

exports.map = map;

},{"alloy":undefined,"alloy/backbone":undefined,"alloy/underscore":undefined}],8:[function(require,module,exports){
arguments[4][7][0].apply(exports,arguments)
},{"alloy":undefined,"alloy/backbone":undefined,"alloy/underscore":undefined,"dup":7}],9:[function(require,module,exports){
/* jshint ignore:start */
var Alloy = require('alloy'),
    _ = require('alloy/underscore')._,
    Backbone = require('alloy/backbone');
/* jshint ignore:end */

/**
 * Public functions
 */

/**
 * A mapping function make the beaconinfo retrieved with the beuckman beaconscanner, general
 * @param beaconRaw The beacon retrieved from the beuckman
 * @returns {{UUID: string, major: Number, minor: Number, rssi: Number, accuracy: Number, proximity: String }}
 */
function map(beaconRaw) {
    return {
        UUID: beaconRaw.uuid.toUpperCase(),
        major: parseInt(beaconRaw.major),
        minor: parseInt(beaconRaw.minor),
        rssi: parseInt(beaconRaw.rssi),
        accuracy: beaconRaw.accuracy,
        proximity: beaconRaw.proximity
    };
}

exports.map = map;

},{"alloy":undefined,"alloy/backbone":undefined,"alloy/underscore":undefined}],10:[function(require,module,exports){
/* jshint ignore:start */
var Alloy = require('alloy'),
    _ = require('alloy/underscore')._,
    Backbone = require('alloy/backbone');
/* jshint ignore:end */

/**
 * Create a beaconregion from a knownbeacon used by the beuckmanscanner
 * @param knownBeacon A knownbeacon
 * @returns {{uuid: String, identifier: String}}
 */
function map(knownBeacon) {
    return {
        uuid: knownBeacon.get('UUID'),
        identifier: knownBeacon.get('beacon_id')
    };
}

exports.map = map;

},{"alloy":undefined,"alloy/backbone":undefined,"alloy/underscore":undefined}],11:[function(require,module,exports){
arguments[4][10][0].apply(exports,arguments)
},{"alloy":undefined,"alloy/backbone":undefined,"alloy/underscore":undefined,"dup":10}],12:[function(require,module,exports){
/* jshint ignore:start */
var Alloy = require('alloy'),
    _ = require('alloy/underscore')._,
    Backbone = require('alloy/backbone');
/* jshint ignore:end */

var model, collection;

exports.definition = {
    config: {
        columns: {
            "id": "INTEGER PRIMARY KEY AUTOINCREMENT",
            "UUID": "TEXT",
            "major": "INTEGER",
            "minor": "INTEGER",
            "rssi": "INTEGER",
            "accuracy": "INTEGER",
            "timestamp": "INTEGER"
        },
        adapter: {
            db_name: "sensimity",
            type: "sql",
            collection_name: "BeaconLog",
            idAttribute: "id"
        }
    },
    extendModel: function(Model) {
        _.extend(Model.prototype, {});

        return Model;
    },
    extendCollection: function(Collection) {
        _.extend(Collection.prototype, {
            // Extend, override or implement Backbone.Collection
            erase: function(args) {
                var self = this;

                var sql = "DELETE FROM " + self.config.adapter.collection_name,
                    db = Ti.Database.open(self.config.adapter.db_name);
                db.execute(sql);
                db.close();

                self.fetch();
            }
        });

        return Collection;
    }
};

// Alloy compiles models automatically to this statement. In this case the models not exists in /app/models folder, so this must be fixed by set this statements manually.
model = Alloy.M("BeaconLog", exports.definition, []);
collection = Alloy.C("BeaconLog", exports.definition, model);
exports.Model = model;
exports.Collection = collection;

},{"alloy":undefined,"alloy/backbone":undefined,"alloy/underscore":undefined}],13:[function(require,module,exports){
/* jshint ignore:start */
var Alloy = require('alloy'),
    _ = require('alloy/underscore')._,
    Backbone = require('alloy/backbone');
/* jshint ignore:end */

var model, collection;

exports.definition = {
    config: {
        columns: {
            "id": "INTEGER PRIMARY KEY AUTOINCREMENT",
            "UUID": "TEXT",
            "major": "INTEGER",
            "minor": "INTEGER",
            "notifiedDate": "REAL" // datetime not supported by backbonemodels in titanium, so use juliandate (REAL)
        },
        adapter: {
            db_name: "sensimity",
            type: "sql",
            collection_name: "BeaconNotified",
            idAttribute: "id"
        }
    },
    extendModel: function(Model) {
        _.extend(Model.prototype, {});

        return Model;
    },
    extendCollection: function(Collection) {
        _.extend(Collection.prototype, {
            // Extend, override or implement Backbone.Collection
            erase: function(args) {
                var self = this;

                var sql = "DELETE FROM " + self.config.adapter.collection_name,
                    db = Ti.Database.open(self.config.adapter.db_name);
                db.execute(sql);
                db.close();

                self.fetch();
            }
        });

        return Collection;
    }
};

// Alloy compiles models automatically to this statement. In this case the models not exists in /app/models folder, so this must be fixed by set this statements manually.
model = Alloy.M("BeaconNotified", exports.definition, []);
collection = Alloy.C("BeaconNotified", exports.definition, model);
exports.Model = model;
exports.Collection = collection;

},{"alloy":undefined,"alloy/backbone":undefined,"alloy/underscore":undefined}],14:[function(require,module,exports){
/* jshint ignore:start */
var Alloy = require('alloy'),
    _ = require('alloy/underscore')._,
    Backbone = require('alloy/backbone');
/* jshint ignore:end */

var model,collection;

exports.definition = {
    config: {
        columns: {
            "id": "INTEGER PRIMARY KEY AUTOINCREMENT",
            "business_rule_id": "INTEGER",
            "beacon_id": "INTEGER",
            "type": "TEXT",
            "interaction_id": "INTEGER",
            "interaction_type": "TEXT",
            "content": "TEXT"
        },
        adapter: {
            db_name: "sensimity",
            type: "sql",
            collection_name: "BusinessRule",
            idAttribute: "id"
        }
    },
    extendModel: function(Model) {
        _.extend(Model.prototype, {});

        return Model;
    },
    extendCollection: function(Collection) {
        _.extend(Collection.prototype, {
            // Extend, override or implement Backbone.Collection
            erase: function(args) {
                var self = this;

                var sql = "DELETE FROM " + self.config.adapter.collection_name,
                    db = Ti.Database.open(self.config.adapter.db_name);
                db.execute(sql);
                db.close();

                self.fetch();
            }
        });

        return Collection;
    }
};

// Alloy compiles models automatically to this statement. In this case the models not exists in /app/models folder, so this must be fixed by set this statements manually.
model = Alloy.M("BusinessRule", exports.definition, []);
collection = Alloy.C("BusinessRule", exports.definition, model);
exports.Model = model;
exports.Collection = collection;

},{"alloy":undefined,"alloy/backbone":undefined,"alloy/underscore":undefined}],15:[function(require,module,exports){
/* jshint ignore:start */
var Alloy = require('alloy'),
    _ = require('alloy/underscore')._,
    Backbone = require('alloy/backbone');
/* jshint ignore:end */

var model, collection;

exports.definition = {
    config: {
        columns: {
            "id": "INTEGER",
            "beacon_id": "INTEGER",
            "network_id": "INTEGER",
            "title": "TEXT",
            "description": "TEXT",
            "UUID": "TEXT",
            "major": "INTEGER",
            "minor": "INTEGER"
        },
        adapter: {
            db_name: "sensimity",
            type: "sql",
            collection_name: "KnownBeacon",
            idAttribute: "id"
        }
    },
    extendModel: function(Model) {
        _.extend(Model.prototype, {});

        return Model;
    },
    extendCollection: function(Collection) {
        _.extend(Collection.prototype, {
            // Extend, override or implement Backbone.Collection
            erase: function(args) {
                var self = this;

                var sql = "DELETE FROM " + self.config.adapter.collection_name,
                    db = Ti.Database.open(self.config.adapter.db_name);
                db.execute(sql);
                db.close();

                self.fetch();
            }
        });

        return Collection;
    }
};

// Alloy compiles models automatically to this statement. In this case the models not exists in /app/models folder, so this must be fixed by set this statements manually.
model = Alloy.M("KnownBeacon", exports.definition, []);
collection = Alloy.C("KnownBeacon", exports.definition, model);
exports.Model = model;
exports.Collection = collection;

},{"alloy":undefined,"alloy/backbone":undefined,"alloy/underscore":undefined}],16:[function(require,module,exports){
/* jshint ignore:start */
var Alloy = require('alloy'),
    _ = require('alloy/underscore')._,
    Backbone = require('alloy/backbone');
/* jshint ignore:end */

var BaseScanner = require('./../scanners/base');
var beaconMapper = require('./../mapper/altbeacon/beacon');
var beaconRegionMapper = require('./../mapper/altbeacon/beaconRegion');
var beaconRegionMonitoringMapper = require('./../mapper/altbeacon/beaconRegionMonitoring');

/**
 * Altbeacon scanner to scan iBeacons on Android devices
 * @param boolean backgroundMode - Parameter to handle beacons when the application is running in backgroundmode
 * @returns {BaseScanner}
 */
function altbeaconScanner(runInService) {
    var self = new BaseScanner(beaconMapper, beaconRegionMapper, beaconRegionMonitoringMapper);
    self.Beacons = require('com.drtech.altbeacon');
    self.scanPeriods = {
        'proactive': {
            foregroundScanPeriod: 1101,
            foregroundBetweenScanPeriod: 0,
            backgroundScanPeriod: 5001,
            backgroundBetweenScanPeriod: 60001
        },
        'aggressive': {
            foregroundScanPeriod: 1001,
            foregroundBetweenScanPeriod: 0,
            backgroundScanPeriod: 2001,
            backgroundBetweenScanPeriod: 5001
        }
    };

    self.isBLESupported = function () {
        return self.Beacons.isBLESupported();
    };

    self.isBLEEnabled = function (callback) {
        if (!_.isFunction(callback)) {
            Ti.API.warn('please define a function callback, ble status cannot be retrieved');
            return;
        }
        callback(self.Beacons.checkAvailability());
    };

    // Bind the beaconservice
    self.bindService = function (bindCallback) {
        var handleServiceBind = function () {
            self.Beacons.removeEventListener("serviceBound", handleServiceBind);
            bindCallback();
        };
        self.Beacons.setAutoRange(true);
        self.Beacons.setRunInService(runInService);
        self.Beacons.addBeaconLayout('m:2-3=0215,i:4-19,i:20-21,i:22-23,p:24-24');
        // Start scanning after binding beaconservice
        self.Beacons.addEventListener("serviceBound", handleServiceBind);
        self.Beacons.bindBeaconService();
    };

    // Stop scanning
    self.stopScanning = function () {
        if (self.Beacons.beaconServiceIsBound()) {
            self.Beacons.stopMonitoringAllRegions();
            self.Beacons.unbindBeaconService();
        }
        self.removeAllEventListeners();
        self.destruct();
    };

    // Add eventlisteners for scanning beacons
    self.addAllEventListeners = function () {
        self.Beacons.addEventListener('beaconProximity', self.beaconFound);
    };

    // Remove eventlisteners when the scanning is stopped
    self.removeAllEventListeners = function () {
        self.Beacons.removeEventListener('beaconProximity', self.beaconFound);
    };

    // Set backgroundmode to save power in background
    self.setBackgroundMode = function (value) {
        self.Beacons.setBackgroundMode(value);
    };

    self.setBehavior = function (period) {
        if (!_.has(self.scanPeriods, period)) {
            Ti.API.warn('behavior cannot be set. Only values \'proactive\' or \'aggressive\' are applicable');
        }
        self.Beacons.setScanPeriods(self.scanPeriods[period]);
    };

    return self;
}

module.exports = altbeaconScanner;

},{"./../mapper/altbeacon/beacon":6,"./../mapper/altbeacon/beaconRegion":7,"./../mapper/altbeacon/beaconRegionMonitoring":8,"./../scanners/base":17,"alloy":undefined,"alloy/backbone":undefined,"alloy/underscore":undefined,"com.drtech.altbeacon":undefined}],17:[function(require,module,exports){
/* Compatibility for Ti standalone (without Alloy) */
if (typeof OS_ANDROID === "undefined") {
    var OS_ANDROID = Ti.Platform.name === "android";
    var OS_IOS = Ti.Platform.name === "iPhone OS";
}

/* jshint ignore:start */
var Alloy = require('alloy'),
    _ = require('alloy/underscore')._,
    Backbone = require('alloy/backbone');
/* jshint ignore:end */

/**
 * Abstract BaseScanner. Please use this function as a self object. Add a custom beaconmapper, beaconregionmapper and beaconregionmonitoringmapper.
 * @param beaconMapper Beaconmapper to map a foundbeacon in a beacon who can handled by the beaconhandler
 * @param beaconRegionMapper BeaconRegionMapper to convert a knownbeacon in a beaconregion.
 * @param beaconRegionMonitoringMapper BeaconRegionMonitoringMapper to convert a knownbeacon in a beaconregion which can be monitored.
 * @constructor Use this basescanner as an abstract function. Please set in the child function var self = BaseScanner();
 */
var BaseScanner = function (beaconMapper, beaconRegionMapper, beaconRegionMonitoringMapper) {
    var self = this,
        beaconHandler = require('./../handlers/beaconHandler'),
        beaconLog = require('./../service/beaconLog'),
        knownBeaconService = require('./../service/knownBeacons');

    /**
     * Public functions
     */

    /**
     * Initialise the scanner.
     * @param networkIdentifier the identifier of the Sensimity-network which must be scanned
     */
    this.init = function (networkIdentifier) {
        if (_.isUndefined(networkIdentifier)) {
            Ti.API.warn('Network identifier is undefined. Scanner not initialized');
            return;
        }

        self.networkId = networkIdentifier;

        if (!OS_IOS) {
            self.prepareForScanning();
            return;
        }

        self.handleiOSLocationPermissions();
    };

    this.prepareForScanning = function () {
        beaconHandler.init();
        beaconLog.init();
        self.setBeaconRegions([]);
        if (OS_IOS && Ti.App.arguments.launchOptionsLocationKey) {
            // Do not refresh beacons if the app has been started based on an enter/exited region event
            return;
        }
        knownBeaconService.refreshBeacons([self.networkId]);
    };

    this.isOldTiVersion = function () {
        var version = Ti.version.split(".");
        if (version[0] < 5) { // Version < 5
            return true;
        }
        return (version[0] === 5 && version[1] === 0); // Version 5.0.*
    };

    this.handleiOSLocationPermissions = function () {
        // Handle iOS
        var permissionType = Ti.Geolocation.AUTHORIZATION_ALWAYS;
        if (self.isOldTiVersion()) { // Version 5.0.*
            // BC: request permission the old way for Titanium < 5.0
            Ti.Geolocation.requestAuthorization(permissionType);
            self.prepareForScanning();
            return;
        }

        if (Ti.Geolocation.hasLocationPermissions(permissionType)) {
            self.prepareForScanning();
            return;
        }

        // Request permission and wait for success
        Ti.Geolocation.requestLocationPermissions(permissionType, function(res) {
            if (res.success) {
                self.prepareForScanning();
            }
        });
    };

    /**
     * Setter for the beaconRegions which will be scanned
     * @param beaconRegions The setting beaconRegions
     */
    this.setBeaconRegions = function (beaconRegions) {
        self.beaconRegions = beaconRegions;
    };

    /**
     * Start scanning of beacons in setting beaconId
     */
    this.startScanning = function () {
        self.bindService(this.startScanningAfterBinding);
    };

    this.startScanningAfterBinding = function () {
        var knownBeacons = knownBeaconService.getKnownBeacons(self.networkId);
        if (!_.isEmpty(knownBeacons)) {
            startScanningOfKnownBeacons(knownBeacons);
        }
        self.addAllEventListeners();
    };

    /**
     * Map a found beacon and start the beaconHandler
     * @param beaconRaw A raw beacon found by the beaconscanner
     */
    this.beaconFound = function (beaconRaw) {
        if (_.isUndefined(beaconRaw.rssi)) {
            return;
        }
        var rssi = parseInt(beaconRaw.rssi);
        if (_.isEqual(rssi, 0)) {
            return;
        }
        var beacon = beaconMapper.map(beaconRaw);
        beaconLog.insertBeaconLog(beacon);
        beaconHandler.handle(beacon);
    };

    /**
     * Destruct the scanner
     */
    this.destruct = function () {
        self.beaconRegions = [];
    };

    /**
     * Private functions
     */

    // Start the scanning of found beacons
    function startScanningOfKnownBeacons(knownBeacons) {
        _.each(knownBeacons, function (knownBeacon) {
            if (!_.isEqual(knownBeacon.get('UUID'), null)) {
                startScanningOfBeacon(knownBeacon);
            }
        });
    }

    /**
     * Start scanning of a beacon
     * @param knownBeacon The beacon which will be scanning
     */
    function startScanningOfBeacon(knownBeacon) {
        // Reduce scanned beaconregions
        if (isBeaconRegionScanning(knownBeacon)) {
            return;
        }

        var beaconRegionMonitoring = beaconRegionMonitoringMapper.map(knownBeacon);
        var beaconRegion = beaconRegionMapper.map(knownBeacon);
        self.Beacons.startMonitoringForRegion(beaconRegionMonitoring);
        self.beaconRegions.push(beaconRegion);
    }

    /**
     * If check beaconregion is already scanning
     * @param knownBeacon Check this beacon scanned now
     * @returns false if beaconRegion is scanning, true if not scanning
     */
    function isBeaconRegionScanning(knownBeacon) {
        // Check beaconregion already scanning
        return _.some(self.beaconRegions, function (region) {
            return _.isEqual(region.uuid.toUpperCase(), knownBeacon.get('UUID').toUpperCase());
        });
    }
};

module.exports = BaseScanner;

},{"./../handlers/beaconHandler":5,"./../service/beaconLog":21,"./../service/knownBeacons":23,"alloy":undefined,"alloy/backbone":undefined,"alloy/underscore":undefined}],18:[function(require,module,exports){
/* jshint ignore:start */
var Alloy = require('alloy'),
    _ = require('alloy/underscore')._,
    Backbone = require('alloy/backbone');
/* jshint ignore:end */

var BaseScanner = require('./../scanners/base');
var beaconMapper = require('./../mapper/beuckman/beacon');
var beaconRegionMapper = require('./../mapper/beuckman/beaconRegion');
var beaconRegionMonitoringMapper = require('./../mapper/beuckman/beaconRegionMonitoring');

/**
 * Beuckman scanner to scan iBeacons on iOS
 * @returns {BaseScanner}
 * @constructor
 */
function Beuckman() {
    // set self = basescanner to use this function as an abstract function for the beuckmanfunction
    var self = new BaseScanner(beaconMapper, beaconRegionMapper, beaconRegionMonitoringMapper);
    self.Beacons = require('org.beuckman.tibeacons');

    self.isBLESupported = function () {
        return self.Beacons.isBLESupported();
    };

    self.isBLEEnabled = function (callback) {
        if (!_.isFunction(callback)) {
            Ti.API.warn('please define a function callback, ble status cannot be retrieved');
            return;
        }
        var handleBleStatus = function (e) {
            // Useless status See https://github.com/jbeuckm/TiBeacons/issues/24
            if (e.status === 'unknown') {
                return;
            }
            self.Beacons.removeEventListener('bluetoothStatus', handleBleStatus);
            if (e.status === 'on') {
                callback(true);
            } else {
                callback(false);
            }
        };
        self.Beacons.addEventListener('bluetoothStatus', handleBleStatus);

        self.Beacons.requestBluetoothStatus();
    };

    // Bindservice function is required in from the Basescanner, but Beuckman contains no bindoption
    self.bindService = function (bindCallback) {
        bindCallback();
    };

    // Start ranging beacons when a beaconregion is detected
    self.enterRegion = function (param) {
        self.Beacons.startRangingForBeacons(param);
    };

    // Stop ranging beacons for a region when a beaconregion is exited
    self.exitRegion = function (param) {
        self.Beacons.stopRangingForBeacons(param);
    };

    // Call beaconfound for every found beacon and handle the found beacons
    self.beaconRangerHandler = function (param) {
        param.beacons.forEach(function (beacon) {
            self.beaconFound(beacon);
        });
    };

    self.regionState = function (e) {
        if (e.regionState === 'inside') {
            self.Beacons.startRangingForBeacons({
                uuid: e.uuid,
                identifier: e.identifier
            });
        } else if (e.regionState === 'outside') {
            self.Beacons.stopRangingForBeacons({
                uuid: e.uuid,
                identifier: e.identifier
            });
        }
    };

    // override stopscanning
    self.stopScanning = function () {
        self.removeAllEventListeners();
        self.Beacons.stopMonitoringAllRegions();
        self.Beacons.stopRangingForAllBeacons();
        self.destruct();
    };

    // Add eventlisteners, called by startingscan in Basescanner
    self.addAllEventListeners = function () {
        self.Beacons.addEventListener('beaconRanges', self.beaconRangerHandler);
        self.Beacons.addEventListener('determinedRegionState', self.regionState);
    };

    // Remove eventlisteners on stop scanning
    self.removeAllEventListeners = function () {
        self.Beacons.removeEventListener('beaconRanges', self.beaconRangerHandler);
        self.Beacons.removeEventListener('determinedRegionState', self.regionState);
    };

    return self;
}

module.exports = Beuckman;

},{"./../mapper/beuckman/beacon":9,"./../mapper/beuckman/beaconRegion":10,"./../mapper/beuckman/beaconRegionMonitoring":11,"./../scanners/base":17,"alloy":undefined,"alloy/backbone":undefined,"alloy/underscore":undefined,"org.beuckman.tibeacons":undefined}],19:[function(require,module,exports){
/* jshint ignore:start */
var Alloy = require('alloy'),
    _ = require('alloy/underscore')._,
    Backbone = require('alloy/backbone');
/* jshint ignore:end */

'use strict';
/* Compatibility for Ti standalone (without Alloy) */
if (typeof OS_ANDROID === "undefined") {
    var OS_ANDROID = Ti.Platform.name === "android";
    var OS_IOS = Ti.Platform.name === "iPhone OS";
}

var sensimityClient = require('./client/client');
var knownBeaconsService = require('./service/knownBeacons');

if (_.isUndefined(Alloy.Globals.sensimityEvent)) {
    Alloy.Globals.sensimityEvent = require('./dispatcher');
}

/**
 * Initialize the scanner and start scanning on added network identifier
 * @param options {network_id: <network identifier to scan beacons>}
 * @param callback Callback to inform about the start of sensimity {success: <bool>, message: <string>}
 */
function start(options, callback) {
    // Only start Sensimity when bluetooth is enabled
    isBLEEnabled(function (value) {
        if (!value) {
            var message = 'Sensimity scan not started because BLE not enabled';
            Ti.API.warn(message);
            if (_.isFunction(callback)) {
                callback({
                    success: false,
                    message: message
                });
            }
            return;
        }

        if (_.isUndefined(Alloy.Globals.sensimityScanner) === false) {
            Ti.API.warn('Scanner already defined, please destruct first before start scanning');
        } else {
            Alloy.Globals.sensimityScanner = createScanner(options);
            initScannerAndStartScanning(options);
        }
        if (_.isFunction(callback)) {
            callback({
                success: true,
                message: 'Sensimity successfully started'
            });
        }
    });
}

/**
 * Stop scanning
 */
function stop() {
    Alloy.Globals.sensimityEvent.off('sensimity:beaconsRefreshed', restartScanner);
    if (!_.isUndefined(Alloy.Globals.sensimityScanner)) {
        Alloy.Globals.sensimityScanner.stopScanning();
    }
    Alloy.Globals.sensimityScanner = undefined;
}

function pause() {
    if (!OS_ANDROID) {
        Ti.API.warn('sensimity pause not needed on other platforms than Android');
        return;
    }

    if (_.isUndefined(Alloy.Globals.sensimityScanner)) {
        Ti.API.warn('Scanner not initialized, please first initialize the sensimity library');
        return;
    }

    Alloy.Globals.sensimityScanner.setBackgroundMode(true);
}

function resume() {
    if (!OS_ANDROID) {
        Ti.API.warn('sensimity resume not needed on other platforms than Android');
        return;
    }

    if (_.isUndefined(Alloy.Globals.sensimityScanner)) {
        Ti.API.warn('Scanner not initialized, please first initialize the sensimity library');
        return;
    }

    Alloy.Globals.sensimityScanner.setBackgroundMode(false);
}

/**
 * Start background intent for Android
 * @param callback Callback to inform about the start of sensimity {success: <bool>, message: <string>}
 */
function runService(options, callback) {
    // Only start Sensimity when bluetooth is enabled
    isBLEEnabled(function (value) {
        if (!value) {
            var message = 'Sensimity scan not started because BLE not enabled';
            Ti.API.warn(message);
            if (_.isFunction(callback)) {
                callback({
                    success: false,
                    message: message
                });
            }
            return;
        }

        if (!OS_ANDROID || _.isUndefined(Alloy.CFG.sensimity.backgroundService)) {
            return;
        }

        var intent = Ti.Android.createServiceIntent({
            url: Alloy.CFG.sensimity.backgroundService,
            startMode: Ti.Android.START_REDELIVER_INTENT
        });
        if (_.isNumber(options.networkId)) {
            intent.putExtra('networkId', options.networkId);
        }
        if (Ti.Android.isServiceRunning(intent)) {
            Ti.Android.stopService(intent);
        }
        Ti.Android.startService(intent);
        if (_.isFunction(callback)) {
            callback({
                success: true,
                message: 'Sensimity successfully started in a Android service'
            });
        }
    });
}

function isBLESupported() {
    var scanner;
    if (OS_ANDROID) {
        scanner = require('./scanners/altbeacon')();
    } else if (OS_IOS) {
        scanner = require('./scanners/beuckman')();
    }
    return scanner.isBLESupported();
}

function isBLEEnabled(callback) {
    var scanner;
    if (OS_ANDROID) {
        scanner = require('./scanners/altbeacon')();
    } else if (OS_IOS) {
        scanner = require('./scanners/beuckman')();
    }
    scanner.isBLEEnabled(callback);
}

module.exports = {
    'start': start,
    'stop': stop,
    'pause': pause,
    'resume': resume,
    'runService': runService,
    'client': sensimityClient,
    'isBLESupported': isBLESupported,
    'isBLEEnabled': isBLEEnabled,
    'getKnownBeacons': knownBeaconsService.getKnownBeacons
};

// Create an scanner, specific for the running platform
function createScanner(options) {
    if (OS_ANDROID) {
        var runInService = false;
        if (_.isBoolean(options.runInService)) {
            runInService = options.runInService;
        }
        // Android, use the altbeaconscanner to scan iBeacons
        var altbeaconScanner = require('./scanners/altbeacon');
        return altbeaconScanner(runInService);
    } else if (OS_IOS) {
        // iOS, use the beuckmanscanner to scan iBeacons
        var beuckmanScanner = require('./scanners/beuckman');
        return beuckmanScanner();
    }
}

// Initialize the sensimityscanner and start scanning on added networkID
function initScannerAndStartScanning(options) {
    if (_.has(options, 'networkId') && !_.isNull(options.networkId)) {
        Alloy.Globals.sensimityScanner.init(options.networkId);
        if (OS_ANDROID && _.has(options, 'behavior')) {
            Alloy.Globals.sensimityScanner.setBehavior(options.behavior);
        }
        Alloy.Globals.sensimityScanner.startScanning();
        Alloy.Globals.sensimityEvent.on('sensimity:beaconsRefreshed', restartScanner);
    } else {
        Ti.API.warn('Please add a networkId, scanner not started');
    }
}

// After refreshing beacons, restart the scanner
function restartScanner() {
    if (!_.isUndefined(Alloy.Globals.sensimityScanner)) {
        Alloy.Globals.sensimityScanner.stopScanning();
        Alloy.Globals.sensimityScanner.startScanning();
    }
}

},{"./client/client":2,"./dispatcher":4,"./scanners/altbeacon":16,"./scanners/beuckman":18,"./service/knownBeacons":23,"alloy":undefined,"alloy/backbone":undefined,"alloy/underscore":undefined}],20:[function(require,module,exports){
/* jshint ignore:start */
var Alloy = require('alloy'),
    _ = require('alloy/underscore')._,
    Backbone = require('alloy/backbone');
/* jshint ignore:end */

/**
 * Public functions
 */

/**
 * Use an Model defined in the sensimity library
 * @param name The name of the model
 * @param args Arguments for creating a Backbone model
 */
function createSensimityModel(name, args) {
    switch (name) {
        case "BeaconLog":
            return new (require("./../models/BeaconLog").Model)(args);
        case "BeaconNotified":
            return new (require("./../models/BeaconNotified").Model)(args);
        case "BusinessRule":
            return new (require("./../models/BusinessRule").Model)(args);
        default:
            return new (require("./../models/KnownBeacon").Model)(args);
    }
}

/**
 * Use an Collection defined in the sensimity library
 * @param name The name of the model-collection
 * @param args Arguments for creating a Backbone collection
 */
function createSensimityCollection(name, args) {
    switch (name) {
        case "BeaconLog":
            return new (require("./../models/BeaconLog").Collection)(args);
        case "BeaconNotified":
            return new (require("./../models/BeaconNotified").Collection)(args);
        case "BusinessRule":
            return new (require("./../models/BusinessRule").Collection)(args);
        default:
            return new (require("./../models/KnownBeacon").Collection)(args);
    }
}

exports.createSensimityModel = createSensimityModel;
exports.createSensimityCollection = createSensimityCollection;

},{"./../models/BeaconLog":12,"./../models/BeaconNotified":13,"./../models/BusinessRule":14,"./../models/KnownBeacon":15,"alloy":undefined,"alloy/backbone":undefined,"alloy/underscore":undefined}],21:[function(require,module,exports){
/* jshint ignore:start */
var Alloy = require('alloy'),
    _ = require('alloy/underscore')._,
    Backbone = require('alloy/backbone');
/* jshint ignore:end */

var sensimityClient = require('./../client/client'),
    baseSensimityService = require('./../service/base'),
    timerModule = require('ti.mely');

/**
 * Public functions
 */

/**
 * Initialize the beaconlogservice. At initialization the beaconlogs earlier retrieved will be send to Sensimity.
 */
function init() {
    // Send beaconlogs every 30 seconds
    var timer = timerModule.createTimer();
    timer.start({
        interval: 30000
    });
    timer.addEventListener('onIntervalChange', sendBeaconLogs);
    sendBeaconLogs();
}

/**
 * Create and save a new beaconlog to send in the future to sensimitys
 * @param beacon A beacon recieved by the beaconscanner
 */
function insertBeaconLog(beacon) {
    var timestamp = Math.round(new Date().getTime() / 1000);
    beacon.timestamp = timestamp;
    var beaconLog = baseSensimityService.createSensimityModel('BeaconLog', beacon);
    beaconLog.save();
}

exports.init = init;
exports.insertBeaconLog = insertBeaconLog;

/**
 * Send the beacons to Sensimity
 */
function sendBeaconLogs() {
    if (Ti.Network.getOnline()) {
        var library = baseSensimityService.createSensimityCollection('BeaconLog');
        library.fetch({
            success: sendBeaconLogsAfterFetch
        });
    }
}

/**
 * Send the beaconlogs to the SensimityAPI after fetching from the local database. Only send when beaconlogs are available.
 * @param beaconLogs The beaconLogs received
 */
function sendBeaconLogsAfterFetch(beaconLogs) {
    // Send beaconlogs only if exists
    if (beaconLogs.length !== 0) {
        sensimityClient.sendScanResults(JSON.parse(JSON.stringify(createBeaconLogsCollection(beaconLogs))), destroyBeaconLogs);
    }
}

/**
 * Create an beaconlogs collection. A instanceref is required to send beaconlogs.
 * @param beaconLogs The beaconlogs which will be send to the SensimityAPI.
 * @returns {{instance_ref: (exports.sensimity.instanceRef|*), device: {device_id: String, model: String, operating_system: String, version: String}, beaconLogs: *}}
 */
function createBeaconLogsCollection(beaconLogs) {
    var instanceRef = Alloy.CFG.sensimity.instanceRef;
    return {
        instance_ref: instanceRef,
        device: {
            device_id: Ti.Platform.id,
            model: Ti.Platform.model,
            operating_system: Ti.Platform.osname,
            version: Ti.Platform.version
        },
        beaconLogs: beaconLogs
    };
}

/**
 * Destroy the beaconlogs from local database
 */
function destroyBeaconLogs() {
    var collection = baseSensimityService.createSensimityCollection('BeaconLog');
    collection.erase();
}


},{"./../client/client":2,"./../service/base":20,"alloy":undefined,"alloy/backbone":undefined,"alloy/underscore":undefined,"ti.mely":undefined}],22:[function(require,module,exports){
/* jshint ignore:start */
var Alloy = require('alloy'),
    _ = require('alloy/underscore')._,
    Backbone = require('alloy/backbone');
/* jshint ignore:end */

var sensimityClient = require('./../client/client'),
    baseSensimityService = require('./../service/base');

/**
 * Public functions
 */

/*******
 * Function to refresh the beacons from Sensimity of a known beacon
 * @param {Object} knownBeacon find the business rules of this beacon
 */
function fetchBusinessRules(knownBeacon) {
    sensimityClient.getBusinessRules(knownBeacon.get('network_id'), knownBeacon.get('beacon_id'), function (data) {
        if (!_.isEmpty(data._embedded.business_rule)) {
            _.each(data._embedded.business_rule, function (businessruleRaw) {
                saveFetchedBusinessRules(businessruleRaw);
            });
        }
    });
}


/****
 * Function to get all the business rules already saved on the phone
 * @param knownBeacon knownBeacon Get the business rules of this beacon
 */
function getBusinessRules(knownBeacon) {
    var library = baseSensimityService.createSensimityCollection('BusinessRule');
    library.fetch();
    var businessRules = library.where({beacon_id: knownBeacon.get('beacon_id')});
    return businessRules;
}

exports.getBusinessRules = getBusinessRules;
exports.fetchBusinessRules = fetchBusinessRules;

/**
 * Private functions
 */

/******
 * Function to save all the business rules fetched at the fetchSingleBusinessRule function
 * @param {Object} data retrieved raw business rule data
 */
function saveFetchedBusinessRules(data) {
    // Check business rule already exists in the system
    var existingBusinessRule = findExistingBusinessRule(data.business_rule_id),
        businessRule;
    if (_.isEmpty(existingBusinessRule)) {
        // CREATE NEW Business rule
        businessRule = createNewBusinessRuleItem(data);
    } else {
        // Override existing business rule
        businessRule = setNewDataInExistingBusinessRule(existingBusinessRule, data);
    }
    businessRule.save();
}

/**
 * Create a new businessrule item from the data received from Sensimity
 * @param data The businessrule received from Sensimitys
 * @returns BusinessRule a created businessrule
 */
function createNewBusinessRuleItem(data) {
    return baseSensimityService.createSensimityModel('BusinessRule', {
        business_rule_id: data.business_rule_id,
        beacon_id: data.beacon_id,
        type: data.business_rule_type,
        interaction_id: data.interaction_id,
        interaction_type: data.interaction_type,
        content: data.content
    });
}

/**
 * Set new information retrieved from Sensimity in de Businessrule
 * @param existingBusinessRule The businessrule earlier retrieved from Sensimity
 * @param data The new data
 */
function setNewDataInExistingBusinessRule(existingBusinessRule, data) {
    // Override existing business rule
    existingBusinessRule.set('beacon_id', data.beacon_id);
    existingBusinessRule.set('type', data.business_rule_type);
    existingBusinessRule.set('interaction_id', data.interaction_id);
    existingBusinessRule.set('interaction_type', data.interaction_type);
    existingBusinessRule.set('content', data.content);
    return existingBusinessRule;

}

/*****
 * Find a business rule based on businessrule Id
 * @param id businessRuleId
 */
function findExistingBusinessRule(businessRuleId) {
    var library = baseSensimityService.createSensimityCollection('BusinessRule');
    library.fetch();
    var businessRule = library.where({business_rule_id: businessRuleId});
    if (_.isEmpty(businessRule)) {
        return businessRule;
    } else {
        return _.first(businessRule);
    }
}

},{"./../client/client":2,"./../service/base":20,"alloy":undefined,"alloy/backbone":undefined,"alloy/underscore":undefined}],23:[function(require,module,exports){
/* jshint ignore:start */
var Alloy = require('alloy'),
    _ = require('alloy/underscore')._,
    Backbone = require('alloy/backbone');
/* jshint ignore:end */

var sensimityClient = require('./../client/client'),
    baseSensimityService = require('./../service/base'),
    businessRuleService = require('./../service/businessRule');

/**
 * Function to refresh the beacons from Sensimity
 * @param networkIds The network identifiers which must be refreshed
 */
function refreshBeacons(networkIds) {
    if (Ti.Network.getOnline()) {
        _.each(_.uniq(networkIds), function (id) {
            var library = baseSensimityService.createSensimityCollection('KnownBeacon');
            library.erase();
            sensimityClient.getBeacons(id, handleSuccessfullFetchingBeacons);
        });
    }
}

/*****
 * Find a beacon based on UUID, major and minor identifier
 * @param String UUID Beacon UUID
 * @param int major Beacon major id
 * @param int minor Beacon minor id
 */
function findKnownBeacon(UUID, major, minor) {
    var library = baseSensimityService.createSensimityCollection('KnownBeacon');
    library.fetch();
    var knownBeacons = library.where({
        UUID: UUID,
        major: major,
        minor: minor
    });
    if (_.isEmpty(knownBeacons)) {
        return knownBeacons;
    } else {
        return _.first(knownBeacons);
    }
}

/*****
 * Retrieve knownbeacons of a network
 * @param networkId The network identifier of the beacons who searching for
 */
function getKnownBeacons(networkId) {
    var library = baseSensimityService.createSensimityCollection('KnownBeacon');
    library.reset();
    library.fetch();
    var knownBeaconsOfNetworkId = library.where({ network_id : networkId });
    return knownBeaconsOfNetworkId;
}

exports.refreshBeacons = refreshBeacons;
exports.findKnownBeacon = findKnownBeacon;
exports.getKnownBeacons = getKnownBeacons;

// When the beacons successfull received from Sensimity, save local and trigger the whole system to let the system know the beacons refreshed
function handleSuccessfullFetchingBeacons(data) {
    // Handle only fetching if data contains beacons.
    if (!_.isUndefined(data._embedded) && !_.isEmpty(data._embedded)) {
        var rawData = data._embedded.beacon;
        saveNewBeacons(rawData);

        // Let the whole applicatie know that the beacons are refreshed
        Alloy.Globals.sensimityEvent.trigger('sensimity:beaconsRefreshed');
    }
}

// Save all new beacons
function saveNewBeacons(beaconArray) {
    var library = getEarlierSavedKnownBeacons();
    _.each(beaconArray, function(beacon) {
        var checkBeaconAlreadySaved = library.where({
            beacon_id: beacon.beacon_id
        });
        if (_.isEmpty(checkBeaconAlreadySaved)) {
            beacon.UUID = beacon.uuid_beacon.toUpperCase();
            var sensimityKnownBeacon = baseSensimityService.createSensimityModel('KnownBeacon', beacon);
            sensimityKnownBeacon.save();

            // Also refetch all existing business rules
            businessRuleService.fetchBusinessRules(sensimityKnownBeacon);
        }
    });
}

// Get the beacons earlier retrieved from Sensimity
function getEarlierSavedKnownBeacons() {
    var library = baseSensimityService.createSensimityCollection('KnownBeacon');
    library.reset();
    library.fetch();
    return library;
}

},{"./../client/client":2,"./../service/base":20,"./../service/businessRule":22,"alloy":undefined,"alloy/backbone":undefined,"alloy/underscore":undefined}]},{},[1])(1)
});