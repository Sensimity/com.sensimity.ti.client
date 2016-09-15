import { _ } from 'alloy/underscore';
import client from './client/client';
import knownBeaconService from './service/knownBeacons';
import Scan from './service/ScanService';
import { isBLEEnabled, isBLESupported, requestLocationPermissions } from './utils/permissions';
import dispatcher from './utils/dispatcher';
import sensimityConfig from './config/config';

if (_.isUndefined(Alloy.Globals.sensimityDispatcher)) {
  Alloy.Globals.sensimityDispatcher = dispatcher();
}

// After refreshing beacons, restart the scanner
const restartScanner = () => {
  if (!_.isUndefined(Alloy.Globals.sensimityScan)) {
    Alloy.Globals.sensimityScan.restart();
  }
};

// Create an scanner, specific for the running platform
const startScanner = options => {
  if (!_.isUndefined(Alloy.Globals.sensimityScan) || !_.has(options, 'networkId')) {
    return;
  }

  let scanOptions = options;
  if (Ti.Platform.osname === 'android') {
    scanOptions = Object.assign(options, { runInService: options.runInService || false });
  }

  Alloy.Globals.sensimityScan = new Scan(scanOptions);
  Alloy.Globals.sensimityDispatcher.on('sensimity:beaconsRefreshed', restartScanner);
  Alloy.Globals.sensimityScan.start();
};

const permissionsCheck = (args, callback, boot) =>
  // Only start Sensimity when bluetooth is enabled
  requestLocationPermissions(e => e.success
    ? isBLEEnabled(scanBLE => {
      const options = {
        scanBLE,
        scanGeofence: args.scanGeofence || true,
      };

      boot(Object.assign(args, options));

      if (_.isFunction(callback)) {
        callback({
          success: {
            ble: scanBLE,
            geofence: options.scanGeofence,
          },
        });
      }
    })
    : () => {
      if (_.isFunction(callback)) {
        callback({
          success: {
            ble: false,
            geofence: false,
          },
        });
      }
    });

/**
 * Initialize the scanner and start scanning on added network identifier
 * @param options {network_id: <network identifier to scan beacons>}
 * @param callback Callback to inform about the start of sensimity {success: <bool>, message: <string>}
 */
const start = (args, callback) => permissionsCheck(args, callback, options => startScanner(options));

/**
 * Start background intent for Android
 * @param callback Callback to inform about the start of sensimity {success: <bool>, message: <string>}
 */
const runService = (args, callback) => permissionsCheck(args, callback, () => {
  const intent = Ti.Android.createServiceIntent({
    url: sensimityConfig.backgroundService,
    startMode: Ti.Android.START_REDELIVER_INTENT,
  });

  if (_.isNumber(args.networkId)) {
    intent.putExtra('networkId', args.networkId);
  }

  if (Ti.Android.isServiceRunning(intent)) {
    Ti.Android.stopService(intent);
  }

  Ti.Android.startService(intent);
});

/**
 * Stop scanning
 */
const stop = () => {
  Alloy.Globals.sensimityDispatcher.off('sensimity:beaconsRefreshed', restartScanner);
  if (!_.isUndefined(Alloy.Globals.sensimityScan)) {
    Alloy.Globals.sensimityScan.stop();
  }
  Alloy.Globals.sensimityScan = undefined;
};

const pause = () => {
  if (Ti.Platform.osname !== 'android' || _.isUndefined(Alloy.Globals.sensimityScan)) {
    return;
  }

  Alloy.Globals.sensimityScan.setBackgroundMode(true);
};

const resume = () => {
  if (Ti.Platform.osname !== 'android' || _.isUndefined(Alloy.Globals.sensimityScan)) {
    return;
  }

  Alloy.Globals.sensimityScan.setBackgroundMode(false);
};

const getKnownBeacons = knownBeaconService.getKnownBeacons;
export {
  start,
  stop,
  pause,
  resume,
  runService,
  client,
  isBLESupported,
  isBLEEnabled,
  getKnownBeacons,
};
