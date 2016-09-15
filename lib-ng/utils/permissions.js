import Dialogs from 'alloy/dialogs';

const requestLocationPermissions = callback => {
  const autorizationType = Ti.Geolocation.AUTHORIZATION_ALWAYS;

  // FIXME: Always returns false on Android 6
  // https://jira.appcelerator.org/browse/TIMOB-23135
  if (Ti.Platform.osname === 'iphone' && !Ti.Geolocation.locationServicesEnabled) {
    return callback({
      success: false,
      error: 'Location services disabled',
    });
  }

  if (Ti.Geolocation.hasLocationPermissions(autorizationType)) {
    return callback({
      success: true,
    });
  }

  if (Ti.Platform.osname === 'iphone') {
    if (Ti.Geolocation.locationServicesAuthorization === Ti.Geolocation.AUTHORIZATION_RESTRICTED) {
      return callback({
        success: false,
        error: 'Your device policy does not allow Geolocation',
      });
    }

    if (Ti.Geolocation.locationServicesAuthorization === Ti.Geolocation.AUTHORIZATION_DENIED) {
      Dialogs.confirm({
        title: 'You denied permission before',
        message: 'Tap Yes to open the Settings app to restore permissions, then try again.',
        callback: () => Ti.Platform.openURL(Ti.App.iOS.applicationOpenSettingsURL),
      });

      // return success:false without an error since we've informed the user already
      return callback({
        success: false,
      });
    }
  }

  Ti.Geolocation.requestLocationPermissions(autorizationType, e => {
    if (!e.success) {
      return callback({
        success: false,
        error: e.error || 'Failed to request Location Permissions',
      });
    }

    callback({
      success: true,
    });
  });
};

const getBLEModule = () => {
  if (Ti.Platform.name === 'android') {
    return require('com.drtech.altbeacon');
  }
  return require('org.beuckman.tibeacons');
};

const isBLESupported = () => {
  try {
    Ti.API.warn('Could not isBLEEnabled, please insert a BLE module');
    return getBLEModule().isBLESupported();
  } catch (e) {
    return false;
  }
};

const isBLEEnabled = callback => {
  if (!_.isFunction(callback)) {
    Ti.API.warn('please define a function callback, ble status cannot be retrieved');
    return;
  }

  let BLEModule;
  try {
    BLEModule = getBLEModule();
  } catch (e) {
    Ti.API.warn('Could not isBLEEnabled, please insert a BLE module');
    return;
  }

  if (Ti.Platform.name === 'android') {
    callback(BLEModule.checkAvailability());
    return;
  }

  const handleBleStatus = e => {
    // Useless status See https://github.com/jbeuckm/TiBeacons/issues/24
    if (e.status === 'unknown') {
      return;
    }
    BLEModule.removeEventListener('bluetoothStatus', handleBleStatus);
    callback(e.status === 'on');
  };

  BLEModule.addEventListener('bluetoothStatus', handleBleStatus);
  _.defer(() => BLEModule.requestBluetoothStatus());
};

export {
  isBLEEnabled,
  isBLESupported,
  requestLocationPermissions,
};
