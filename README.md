# Sensimity Appcelerator client
Client implementation for communication with the Sensimity platform (http://sensimity.com)

  - Get the networks and beacons/geofences from the sensimity-API (see also http://sensimity.github.io/docs/)
  - Scan for beacons/geofences within a defined Sensimity network
  - Handle beacon/geofences and business-rules (defined in Sensimity Dashboard)

## Notes
To use this module it's necessary to use the Sensimity forks of two Appcelerator Titanium modules. The original ones are outdated and seem unmaintained.
- Android: [https://github.com/Sensimity/android-altbeacon-module](https://github.com/Sensimity/android-altbeacon-module/tree/1.5.0).
- iOS: [https://github.com/Sensimity/TiBeacons](https://github.com/Sensimity/TiBeacons/tree/0.12.0).
- Optionally we can also provide the geofence module on request.

## Install
The installation- and configuration description is optimized for usage via the [Titanium Alloy framework](https://github.com/appcelerator/alloy).

1. Download the Sensimity client from the dist folder and copy it into the `modules/commonjs` directory.
2. Add the following modules to the `modules` folder:
    * Android (Sensimity altbeacon module): [com.drtech.altbeacon-android-1.5.0.zip ](https://github.com/Sensimity/android-altbeacon-module/blob/1.5.0/android/dist/com.drtech.altbeacon-android-1.5.0.zip)
    * iOS: [Sensimity TiBeacons module](https://github.com/Sensimity/TiBeacons/blob/master/org.beuckman.tibeacons-iphone-0.12.0.zip)
3. Add the dependencies into the `modules` directory, used for the connection with the Sensimity-API and to send statistics to Sensimity:
    * Android/iOS: [reste-commonjs-1.1.8](https://github.com/jasonkneen/RESTe/blob/master/dist/reste-commonjs-1.1.8.zip)
    * Android: [ti.mely-android-0.1](https://github.com/benbahrenburg/ti.mely/blob/master/Android/dist/ti.mely-android-0.1.zip)
    * iOS: [ti.mely-iphone-0.3](https://github.com/benbahrenburg/ti.mely/blob/master/iOS/dist/ti.mely-iphone-0.3.zip)
4. Define the modules into the tiapp.xml:

    ```
    <modules>
        <module platform="commonjs" version="0.8.0">com.sensimity.ti.client</module>
        <module platform="commonjs" version="1.1.8">reste</module>
        <module platform="iphone" version="0.12.0">org.beuckman.tibeacons</module>
        <!--<module platform="iphone" version="0.5.0">com.sensimity.ti.pathsense</module>-->
        <module platform="iphone" version="0.3">ti.mely</module>
        <module platform="android" version="1.5.0">com.drtech.altbeacon</module>
        <!--<module platform="android" version="0.5.0">com.sensimity.ti.pathsense</module>-->
        <module platform="android" version="0.1">ti.mely</module>
    </modules>
    ```
5. Define a path to the backgroundService to use the module on Android:

    ```
    <android xmlns:android="http://schemas.android.com/apk/res/android">
        <services>
            <service url="services/handleBackgroundScan.js" type="standard"/>
        </services>
    </android>
    ```
6. Define the reason of using iBeacons

    ```
    <plist>
        <dict>
            <key>NSLocationAlwaysUsageDescription</key>
            <string>Your description for the reason of using iBeacons</string>
            <!-- in case of geofences -->
            <key>NSMotionUsageDescription</key>
            <string>Your description for the reason of using Geofences</string>
        </dict>
    </plist>
    ```

## Configuration
1. Setup your (`module/config.json`). Credentials can be requested through our contact form on: http://sensimity.com/contact-us-v1/ . These credentials can be used to retrieve the network information needed to integrate Sensimity in your app(s). The data-structure for Sensimity is like this:

    ```
        {
            "global": {
                "sensimity": {
                    "basicHeaderAuthUsername": "<string>",
                    "basicHeaderAuthPassword": "<string>",
                    "username": "<string>",
                    "password": "<string>",
                    // Can be found at the Sensimity-dashboard (after login)
                    "instanceRef": "S-<hex eight characters>-<serial-number>",
                    // necessary for android usage
                    "backgroundService": "services/handleBackgroundScan.js",
                    "monitoringScope": 'uuid|major|minor' // Optionally for beacons, default UUID
                }
            }
        }
    ```
2. Bootstrap the sensimity logic (only if BLE enabled):

    ```
        var sensimity = require('com.sensimity.ti.client'),
            callback = function (successMessage) {
                if (!successMessage.success.ble && !successMessage.success.geofence) {
                    console.log('sensimity start failed');
                }
            };
        if (OS_IOS) {
            sensimity.start({
                networkId: <integer network-id>
            }, callback);
        } else if (OS_ANDROID) {
            sensimity.runService({
                 networkId: <integer network-id>
            }, callback);
        }
    ```
3. [ANDROID only] Define the background service. (`app/lib/android/services/handleBackgroundScan.js`).:

    ```
		var service = Ti.Android.currentService;
		var serviceIntent = service.intent;
		var sensimity = require('com.sensimity.ti.client');

        if (serviceIntent.getIntExtra('networkId', -1) !== -1) {
		    sensimity.start({
		        networkId: serviceIntent.getIntExtra('networkId', -1),
		        runInService: true,
		        behavior: 'aggressive'
		    });
		}
		
		function stop() {
		    service.removeEventListener('taskremoved', stop);
		    sensimity.stop();
		    service.stop();
		}
		    
		// Stop sensimity on taskremoved service
        service.addEventListener('taskremoved', stop);
    ```

### Methods
All of the methods are accessible by using the Sensimity Client library:

`var sensimity = require('com.sensimity.ti.client');`

* Start scanning within a specified network (only if BLE enabled), if BLE disabled please check the callback
    ```
    sensimity.start({
        networkId: <integer>,
		runInService: true, // Optional, Android only
		behavior: 'aggressive|proactive' // Optional, Android only
    }, <success callback>);
    ```
* Stop scanning every network

    ```
    sensimity.stop();
    ```
* Check BLE supported on current device

    ```
    Ti.API.info('Is BLE scanning supported: 'sensimity.isBLESupported());
    ```
* Check BLE is supported and enabled on current device

    ```
    sensimity.isBLEEnabled(function (enabled) {
        Ti.API.info('Is BLE scanning enabled: ' + enabled);
    });
    ```
* [ANDROID only] Put sensimity into backgroundmode scanning

    ```
    sensimity.pause();
    ```
* [ANDROID only] Put sensimity into foregroundmode scanning back again

    ```
    sensimity.resume();
    ```
* Sensimity client

    ```
    // Get networks
    sensimity.client.getNetworks({
        networkId: <integer>
    });
    ```
### Using your own beacons
If you want to start the Scanner without using Sensimity you can inject your own custom beacons by doing the following:
```js
sensimity.start({
    ownBeacons: [
        {
            major: '123',
            minor: '123',
            uuid_beacon: '123',
            title: 'My custom beacon',
            description: 'My custom beacon',
            latitude: '52.128759',
            longitude: '6.438053',
            is_geofence: true
        }
    ]
});
```

### Events
To handle the triggered Business Rules and to handle the detected iBeacons, use the following eventListeners:

* Handle triggered Business rule

    ```
    Ti.App.addEventListener('sensimity:beacon', function (e) {
        e = {
            beacon: <Detected beacon data>,
            knownBeacon: <Beacon known from Sensimity>,
            eventType: <enterregion|exitregion|ranging>
        };
    });
    ```

* Handle triggered Business rule

    ```
    Ti.App.addEventListener('sensimity:businessrule', function (e) {
        e = {
            businessRule: <Triggered business rule>,
            beacon: <Detected beacon data>,
            knownBeacon: <Beacon known from Sensimity>
        };
    });
    ```

### Credits

* [@smclab](https://github.com/smclab) for [titaniumifier](https://github.com/smclab/titaniumifier)
* [@jbeuckm](https://github.com/jbeuckm) for [TiBeacon](https://github.com/jbeuckm/TiBeacons)
* [@dwk5123](https://github.com/dwk5123) for [Android-Altbeacon-module](https://github.com/dwk5123/android-altbeacon-module)
* [@jasonkneen](https://github.com/jasonkneen) for [RESTe](https://github.com/jasonkneen/RESTe)
* [@benbahrenburg](https://github.com/benbahrenburg) for [Ti.mely](https://github.com/benbahrenburg/ti.mely)
