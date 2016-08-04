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

/**
* Sort geofence-regions by distance inside a defined radius from a predefined location.
*/
const sortRegionsByDistance = (regions, location, defaultRadius = 5000) => {
	return PathSense.sortRegionsByDistance(regions, location, defaultRadius);
};

exports.init = init;
exports.destruct = destruct;
exports.startMonitoring = startMonitoring;
exports.stopMonitoring = stopMonitoring;
exports.sortRegionsByDistance = sortRegionsByDistance;
