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
    var library = baseSensimityService.createSensimityCollection('BeaconLog');
    library.fetch({
        success: sendBeaconLogsAfterFetch
    });
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

