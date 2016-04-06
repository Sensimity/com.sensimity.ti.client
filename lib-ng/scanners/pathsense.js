var PathSense = require('com.sensimity.ti.pathsense'),
    beaconMapper = require('./../mapper/pathsense/beacon'),
    beaconHandler = require('./../handlers/beaconHandler');

var enteredRegion = (geofenceRegion) => {
    var beacon = beaconMapper.map(geofenceRegion);
    beaconHandler.handle(beacon);
};

const init = () => {
    PathSense.addEventListener('enteredRegion', enteredRegion);
};

const destruct = () => {
    PathSense.removeEventListener('enteredRegion', enteredRegion);
};

const startMonitoring = (region) => {
    PathSense.startMonitoringForRegion(region);
};

const stopMonitoring = () => {
    PathSense.stopMonitoringAllRegions();
};

exports.init = init;
exports.destruct = destruct;
exports.startMonitoring = startMonitoring;
exports.stopMonitoring = stopMonitoring;
