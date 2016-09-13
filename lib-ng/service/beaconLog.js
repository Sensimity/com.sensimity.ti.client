import Alloy from 'alloy';
import { _ } from 'alloy/underscore';
import Timer from 'ti.mely';
import client from './../client/client';
import { createSensimityCollection, createSensimityModel } from './../service/base';
import knownBeaconService from './knownBeacons';

/**
 * Send the beacons to Sensimity
 */
const sendBeaconLogs = () => {
  if (Ti.Network.getOnline()) {
    const library = createSensimityCollection('BeaconLog');
    library.fetch({
      success: sendBeaconLogsAfterFetch, // eslint-disable-line
    });
  }
};

/**
 * Create an beaconlogs collection. A instanceref is required to send beaconlogs.
 * @param beaconLogs The beaconlogs which will be send to the SensimityAPI.
 * @returns {{instance_ref: (exports.sensimity.instanceRef|*), device: {device_id: String, model: String, operating_system: String, version: String}, beaconLogs: *}}
 */
const createBeaconLogsCollection = beaconLogs => ({
  instance_ref: Alloy.CFG.sensimity.instanceRef,
  device: {
    device_id: Ti.Platform.id,
    model: Ti.Platform.model,
    operating_system: Ti.Platform.osname,
    version: Ti.Platform.version,
  },
  beaconLogs,
});

/**
 * Destroy the beaconlogs from local database
 */
const destroyBeaconLogs = () => {
  const collection = createSensimityCollection('BeaconLog');
  collection.erase();
};

/**
 * Send the beaconlogs to the SensimityAPI after fetching from the local database. Only send when beaconlogs are available.
 * @param beaconLogs The beaconLogs received
 */
const sendBeaconLogsAfterFetch = beaconLogs => {
    // Send beaconlogs only if exists
  if (beaconLogs.length !== 0) {
    client.sendScanResults(JSON.parse(JSON.stringify(createBeaconLogsCollection(beaconLogs))), destroyBeaconLogs);
  }
};

/**
 * Initialize the beaconlogservice. At initialization the beaconlogs earlier retrieved will be send to Sensimity.
 */
const init = () => {
    // Send beaconlogs every 30 seconds
  const timer = Timer.createTimer();
  timer.start({
    interval: 30000,
  });
  timer.addEventListener('onIntervalChange', sendBeaconLogs);
  sendBeaconLogs();
};

/**
 * Create and save a new beaconlog to send in the future to sensimity
 * @param beacon A beacon recieved by the beaconscanner
 */
const insertBeaconLog = beacon => {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const knownBeacon = knownBeaconService.findKnownBeacon(beacon.UUID, beacon.major, beacon.minor);
  beacon.timestamp = timestamp;
    // If beacon = unknown, do nothing
  if (!_.isEmpty(knownBeacon)) {
    beacon.beacon_id = knownBeacon.get('beacon_id');
  }
  const beaconLog = createSensimityModel('BeaconLog', beacon);
  beaconLog.save();
};

export default {
  init,
  insertBeaconLog,
};
