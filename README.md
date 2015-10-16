# Sensimity Appcelerator client
Client implementation for communication with the Sensimity platform (http://sensimity.com)

  - Get the beacon-networks and beacons from the sensimity-API (see also http://sensimity.github.io/docs/)
  - Scan for beacons within a defined Sensimity network
  - Handle beacon and beacon-business-rules (defined in Sensimity Dashboard)

## Notes
To use this module it's necessary to use the special Sensimity-forks of two Appcelerator Titanium modules:
- Android: [https://github.com/Sensimity/android-altbeacon-module](https://github.com/Sensimity/android-altbeacon-module/tree/1.3.0).
- iOS: [https://github.com/Sensimity/TiBeacons](https://github.com/Sensimity/TiBeacons/tree/0.9.3).

## Install
The installation- and configurationdescription is optimized for using by the [Titanium Alloy framework](https://github.com/appcelerator/alloy).

1. Download the Sensimity client from the dist folder and copy it into the `modules/commonjs` directory.
2. Add the following modules to the `modules` folder:
    * Android (Sensimity altbeacon module): [com.drtech.altbeacon-android-1.3.0.zip ](https://github.com/Sensimity/android-altbeacon-module/blob/1.2.1/android/dist/com.drtech.altbeacon-android-1.3.0.zip)
    * iOS: [Sensimity TiBeacons module](https://github.com/jbeuckm/TiBeacons/blob/master/org.beuckman.tibeacons-iphone-0.9.3.zip)
3. Add the dependencies into the `modules` directory, used for the connection with the Sensimity-API and to send statistics to Sensimity:
    * Android/iOS: [reste-commonjs-1.1.8](https://github.com/jasonkneen/RESTe/blob/master/dist/reste-commonjs-1.1.8.zip)
    * Android: [ti.mely-android-0.1](https://github.com/benbahrenburg/ti.mely/blob/master/Android/dist/ti.mely-android-0.1.zip)
    * iOS: [ti.mely-iphone-0.3](https://github.com/benbahrenburg/ti.mely/blob/master/iOS/dist/ti.mely-iphone-0.3.zip)
4. Define the modules into the tiapp.xml:

    ```
    <modules>
        <module platform="commonjs" version="0.2.0">com.sensimity.ti.client</module>
        <module platform="iphone" version="0.9.3">org.beuckman.tibeacons</module>
        <module platform="android" version="1.3.0">com.drtech.altbeacon</module>
        <module platform="commonjs" version="1.1.8">reste</module>
        <module platform="iphone" version="0.3">ti.mely</module>
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
                    "backgroundService": "services/handleBackgroundScan.js"
                }
            }
        }
    ```
2. Bootstrap the sensimity logic:

    ```
        var sensimity = require('com.sensimity.ti.client');
        if (OS_IOS) {
            sensimity.start({
                networkId: <integer network-id>
            });
        } else if (OS_ANDROID) {
            sensimity.runService({
                 networkId: <integer network-id>
            });
        }
    ```
3. [ANDROID only] Define the background service. (`app/lib/android/services/handleBackgroundScan.js`).:

    ```
        var Alloy = require('alloy'),
            _ = require('alloy/underscore')._,
            Backbone = require('alloy/backbone'),
            ensimity = require('com.sensimity.ti.client');

        // It's possible to grab the networkId given in at the `runService` function
        var sensimity = require('com.sensimity.ti.client');
        sensimity.start({
            networkId: serviceIntent.getIntExtra('networkId', -1),
            runInService: true // This means it doesn't matter if the rootActivity closed, it continues background-scanning anyway.
        });
    ```

### Methods
All of the methods are accessible by using the Sensimity Client library:

`var sensimity = require('com.sensimity.ti.client');`

* Start scanning within a specified network

    ```
    sensimity.start({
        networkId: <integer>
    });
    ```
* Stop scanning every network

    ```
    sensimity.stop({
        networkId: <integer>
    });
    ```
* Sensimity client

    ```
    // Get networks
    sensimity.client.getNetworks({
        networkId: <integer>
    });
    ```

### Events
To handle the triggered Business Rules and to handle the detected iBeacons, use the following eventListeners:

* Handle triggered Business rule

    ```
    Ti.App.addEventListener('sensimity:beacon', function (e) {
        e = {
            beacon: <Detected beacon data>,
            knownBeacon: <Beacon known from Sensimity>
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
