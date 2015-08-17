/* Compatibility for Ti standalone (without Alloy) */
if (typeof OS_ANDROID === "undefined") {
    var OS_ANDROID = Ti.Platform.name === "android";
    var OS_IOS = Ti.Platform.name === "iPhone OS";
}

var notifyId = 1,
    dispatcher = require('./../dispatcher'),
    baseSensimityService = require('./../service/base'),
    beaconKnownBeaconService = require('./../service/knownBeacons');

/**
 * Initialize the notification service
 */
function init() {
    registerUserNotification();
}

/**
 * A function to show the beacon information in a notification
 * @param beacon The beaconinformation which will be shown
 */
function showBeaconNotification(beacon) {
    if (checkBeaconCanNotify(beacon)) {
        var sensimityNotify = {
            beacon: beacon
        };
        dispatcher.trigger('sensimity:notify', sensimityNotify);

         //Check notifications are enabled
        if (Alloy.CFG.sensimity.showNotifications) {
            if (OS_ANDROID) {
                sensimityNotifyAndroid(sensimityNotify);
            } else if (OS_IOS) {
                sensimityNotifyIOS(sensimityNotify);
            }
            insertBeaconNotified(beacon);
        }
    }
}

exports.init = init;
exports.showBeaconNotification = showBeaconNotification;

// On IOS it's required to ask the user accept notifications
function registerUserNotification() {
    if (OS_IOS && parseInt(Ti.Platform.version.split('.')[0]) >= 8) {
        Ti.App.iOS.registerUserNotificationSettings({
            types: [
                Ti.App.iOS.USER_NOTIFICATION_TYPE_ALERT,
                Ti.App.iOS.USER_NOTIFICATION_TYPE_SOUND,
                Ti.App.iOS.USER_NOTIFICATION_TYPE_BADGE
            ]
        });
    }
}

// insert a beaconnotified
function insertBeaconNotified(beacon) {
    var today = new Date(); //set any date
    var beaconNotified = baseSensimityService.createSensimityModel('BeaconNotified', {
        UUID: beacon.UUID,
        major: parseInt(beacon.major),
        minor: parseInt(beacon.minor),
        notifiedDate: today.getJulian()
    });
    beaconNotified.save();
}

// Check the beacon notification is already shown today
function checkBeaconCanNotify(beacon) {
    // Only notify known beacons
    if (!_.isEmpty(beaconKnownBeaconService.findKnownBeacon(beacon.UUID, beacon.major, beacon.minor))) {
        var today = new Date().getJulian();
        var library = baseSensimityService.createSensimityCollection('BeaconNotified');
        library.reset();
        library.fetch();
        var notifiedBeacons = library.where({
            UUID: beacon.UUID,
            'major': parseInt(beacon.major),
            'minor': parseInt(beacon.minor)
        });
        return _.isEmpty(notifiedBeacons.filter(function(notifiedBeacon) {
            return _.isEqual(notifiedBeacon.get('notifiedDate'), today);
        }));
    }
    return false;
}

// Show a notification on an android device
function sensimityNotifyAndroid(sensimityNotify) {
    Ti.Android.NotificationManager.notify(
        notifyId,
        Ti.Android.createNotification({
            icon: Ti.App.Android.R.drawable.appicon,
            contentTitle: Ti.Locale.getString('Sensimity', 'Sensimity'),
            contentText: sensimityNotify.beacon.UUID + '-' + sensimityNotify.beacon.major + '-' + sensimityNotify.beacon.minor,
            tickerText: Ti.Locale.getString('Sensimity', 'Sensimity'),
            when: new Date().getTime(),
            defaults: Ti.Android.NotificationManager.DEFAULT_ALL
        })
    );
    notifyId++;
}

// Show a notification on an IOS device
function sensimityNotifyIOS(e) {
    var notification = Ti.App.iOS.scheduleLocalNotification({
        alertAction: L('view', 'bekijken'),
        alertBody: e.beacon.UUID + '-' + e.beacon.major + '-' + e.beacon.minor,
        sound: 'default',
        date: new Date(new Date().getTime())
    });
}

/* jshint ignore:start */
Date.prototype.getJulian = function() {
    return Math.floor((this / 86400000) - (this.getTimezoneOffset() / 1440) + 2440587.5);
};
/* jshint ignore:end */
