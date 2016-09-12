import { _ } from 'alloy/underscore';
import client from './client/client';
import { getKnownBeacons } from './service/knownBeacons';
import Altbeacon from './scanners/altbeacon';
import Beuckman from './scanners/beuckman';
import dispatcher from './dispatcher';

if (_.isUndefined(Alloy.Globals.sensimityEvent)) {
  Alloy.Globals.sensimityEvent = dispatcher();
}

// Create an scanner, specific for the running platform
const createScanner = options => {
  if (_.isUndefined(Alloy.Globals.sensimityScanner)) {
    return Alloy.Globals.sensimityScanner;
  }

  if (Ti.Platform.name === 'android') {
    let runInService = false;
    if (_.isBoolean(options.runInService)) {
      runInService = options.runInService;
    }
    // Android, use the altbeaconscanner to scan iBeacons
    Alloy.Globals.sensimityScanner = new Altbeacon(runInService);
  }

  if (Ti.Platform.name === 'iPhone OS') {
    // iOS, use the beuckmanscanner to scan iBeacons
    Alloy.Globals.sensimityScanner = new Beuckman();
  }
};

const isBLESupported = options => {
  createScanner(options);
  Alloy.Globals.sensimityScanner.isBLESupported();
};

const isBLEEnabled = (options, callback) => {
  createScanner(options);
  Alloy.Globals.sensimityScanner.isBLEEnabled(callback);
};

const getHooks = options => _.isObject(options.hooks) ? options.hooks : {};

// After refreshing beacons, restart the scanner
const restartScanner = () => {
  if (!_.isUndefined(Alloy.Globals.sensimityScanner)) {
    Alloy.Globals.sensimityScanner.stopScanning();
    Alloy.Globals.sensimityScanner.startScanning();
  }
};

// Initialize the sensimityscanner and start scanning on added networkID
const initScannerAndStartScanning = options => {
  if (_.has(options, 'networkId') && options.networkId !== null) {
    Alloy.Globals.sensimityScanner.init(options.networkId, getHooks(options));
    if (Ti.Platform.name === 'android' && _.has(options, 'behavior')) {
      Alloy.Globals.sensimityScanner.setBehavior(options.behavior);
    }
    Alloy.Globals.sensimityEvent.on('sensimity:beaconsRefreshed', restartScanner);
    Alloy.Globals.sensimityScanner.startScanning();
    return;
  }
  Ti.API.warn('Please add a networkId, scanner not started');
};

/**
 * Initialize the scanner and start scanning on added network identifier
 * @param options {network_id: <network identifier to scan beacons>}
 * @param callback Callback to inform about the start of sensimity {success: <bool>, message: <string>}
 */
const start = (options, callback) =>
    // Only start Sensimity when bluetooth is enabled
  isBLEEnabled(options, isEnabled => {
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

    createScanner(options);

    if (Alloy.Globals.sensimityScanner.isScanning()) {
      Ti.API.warn('Scanner already started, please stop first before start scanning');
    } else {
      initScannerAndStartScanning(options);
    }
    if (_.isFunction(callback)) {
      callback({
        success: true,
        message: 'Sensimity successfully started',
      });
    }
  });

/**
 * Stop scanning
 */
const stop = () => {
  Alloy.Globals.sensimityEvent.off('sensimity:beaconsRefreshed', restartScanner);
  if (!_.isUndefined(Alloy.Globals.sensimityScanner)) {
    Alloy.Globals.sensimityScanner.stopScanning();
  }
  Alloy.Globals.sensimityScanner = undefined;
};

const pause = () => {
  if (Ti.Platform.name !== 'android') {
    Ti.API.warn('sensimity pause not needed on other platforms than Android');
    return;
  }

  if (_.isUndefined(Alloy.Globals.sensimityScanner)) {
    Ti.API.warn('Scanner not initialized, please first initialize the sensimity library');
    return;
  }

  Alloy.Globals.sensimityScanner.setBackgroundMode(true);
};

const resume = () => {
  if (Ti.Platform.name !== 'android') {
    Ti.API.warn('sensimity resume not needed on other platforms than Android');
    return;
  }

  if (_.isUndefined(Alloy.Globals.sensimityScanner)) {
    Ti.API.warn('Scanner not initialized, please first initialize the sensimity library');
    return;
  }

  Alloy.Globals.sensimityScanner.setBackgroundMode(false);
};

/**
 * Start background intent for Android
 * @param callback Callback to inform about the start of sensimity {success: <bool>, message: <string>}
 */
const runService = (options, callback) =>
    // Only start Sensimity when bluetooth is enabled
  isBLEEnabled(options, isEnabled => {
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

    if (Ti.Platform.name !== 'android' || _.isUndefined(Alloy.CFG.sensimity.backgroundService)) {
      return;
    }

    const intent = Ti.Android.createServiceIntent({
      url: Alloy.CFG.sensimity.backgroundService,
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
