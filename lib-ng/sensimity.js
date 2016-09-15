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
  if (Ti.Platform.name === 'android') {
    scanOptions = Object.assign(options, { runInService: options.runInService || false });
  }

  Alloy.Globals.sensimityScan = new Scan(scanOptions);
  Alloy.Globals.sensimityDispatcher.on('sensimity:beaconsRefreshed', restartScanner);
  Alloy.Globals.sensimityScan.start();
};

/**
 * Initialize the scanner and start scanning on added network identifier
 * @param options {network_id: <network identifier to scan beacons>}
 * @param callback Callback to inform about the start of sensimity {success: <bool>, message: <string>}
 */
const start = (args, callback) =>
  // Only start Sensimity when bluetooth is enabled
  requestLocationPermissions(
    (e) => e.success
    ? isBLEEnabled(isEnabled => {
      const options = Object.assign({
        requireBLE: true,
      }, args);

      if (!isEnabled && options.requireBLE) {
        const message = 'Sensimity scan not started because BLE not enabled';
        Ti.API.warn(message);
        if (_.isFunction(callback)) {
          callback({
            success: false,
            message,
          });
        }
        return;
      }

      startScanner(Object.assign(options, {
        startBLE: isEnabled,
      }));

      if (_.isFunction(callback)) {
        callback({
          success: true,
          message: 'Sensimity successfully started',
        });
      }
    })
    : () => {
      const message = 'Sensimity scan not started because locationservices are enabled';
      Ti.API.warn(message);
      if (_.isFunction(callback)) {
        callback({
          success: false,
          message,
        });
      }
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
  if (Ti.Platform.name !== 'android' || _.isUndefined(Alloy.Globals.sensimityScan)) {
    return;
  }

  Alloy.Globals.sensimityScan.setBackgroundMode(true);
};

const resume = () => {
  if (Ti.Platform.name !== 'android' || _.isUndefined(Alloy.Globals.sensimityScan)) {
    return;
  }

  Alloy.Globals.sensimityScan.setBackgroundMode(false);
};

/**
 * Start background intent for Android
 * @param callback Callback to inform about the start of sensimity {success: <bool>, message: <string>}
 */
const runService = (options, callback) =>
    // Only start Sensimity when bluetooth is enabled
  isBLEEnabled(isEnabled => {
    if (!isEnabled) {
      const message = 'Sensimity scan not started because BLE not enabled';
      Ti.API.warn(message);
      if (_.isFunction(callback)) {
        callback({
          success: false,
          message,
        });
      }
      return;
    }

    if (Ti.Platform.name !== 'android' || _.isUndefined(sensimityConfig.backgroundService)) {
      return;
    }

    const intent = Ti.Android.createServiceIntent({
      url: sensimityConfig.backgroundService,
      startMode: Ti.Android.START_REDELIVER_INTENT,
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
        message: 'Sensimity successfully started in a Android service',
      });
    }
  });

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
