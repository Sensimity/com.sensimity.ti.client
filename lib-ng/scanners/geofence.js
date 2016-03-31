var GeofenceLib = require('com.sensimity.ti.geofence'),
    beaconMapper = require('./../mapper/geofence/beacon'),
    beaconHandler = require('./../handlers/beaconHandler');

var enteredRegion = (geofenceRegion) => {
    var beacon = beaconMapper.map(geofenceRegion);
    beaconHandler.handle(beacon);
};

const init = () => {
    GeofenceLib.addEventListener('enteredRegion', enteredRegion);
};

const destruct = () => {
    GeofenceLib.removeEventListener('enteredRegion', enteredRegion);
};

const startMonitoring = (region) => {
    GeofenceLib.startMonitoringForRegion(region);
};

const stopMonitoring = () => {
    GeofenceLib.stopMonitoringAllRegions();
};

exports.init = init;
exports.destruct = destruct;
exports.startMonitoring = startMonitoring;
exports.stopMonitoring = stopMonitoring;
