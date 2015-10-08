# Sensimity Appcelerator client
Client implementation for communication with the Sensimity platform (http://sensimity.com)

  - Get the beacon-networks and beacons from the sensimity-API (see also http://sensimity.github.io/docs/)
  - Scan for beacons within a defined Sensimity network
  - Handle beacon and beacon-business-rules (defined in Sensimity Dashboard)

## Notes
To use this module it's necessary to use the special Sensimity-forks of two Appcelerator Titanium modules:
- Android: [https://github.com/Sensimity/android-altbeacon-module](https://github.com/Sensimity/android-altbeacon-module/tree/1.2.0).
- iOS: [https://github.com/Sensimity/TiBeacons](https://github.com/Sensimity/TiBeacons/tree/0.83).

## Install
The installation- and configurationdescription is optimized for using by the [Titanium Alloy framework](https://github.com/appcelerator/alloy).

1. Download the Sensimity client from the dist folder and copy it into the `modules/commonjs` directory.
2. Add the following modules to the `modules` folder:
    * Android (Sensimity altbeacon module): [com.drtech.altbeacon-android-1.2.1.zip ](https://github.com/Sensimity/android-altbeacon-module/blob/1.2.1/android/dist/com.drtech.altbeacon-android-1.2.1.zip)
    * iOS: [Sensimity TiBeacons module](https://github.com/Sensimity/TiBeacons/blob/0.83/org.beuckman.tibeacons-iphone-0.83.zip)
3. Add the dependencies into the `modules` directory, used for the connection with the Sensimity-API and to send statistics to Sensimity:
    * Android/iOS: [reste-commonjs-1.1.8](https://github.com/jasonkneen/RESTe/blob/master/dist/reste-commonjs-1.1.8.zip)
    * Android: [ti.mely-android-0.1](https://github.com/benbahrenburg/ti.mely/blob/master/Android/dist/ti.mely-android-0.1.zip)
    * iOS: [ti.mely-iphone-0.3](https://github.com/benbahrenburg/ti.mely/blob/master/iOS/dist/ti.mely-iphone-0.3.zip)
4. Define the modules into the tiapp.xml:

    ```
    <modules>
        <module platform="commonjs" version="0.1.2">com.sensimity.ti.client</module>
        <module platform="iphone" version="0.83">org.beuckman.tibeacons</module>
        <module platform="android" version="1.2.1">com.drtech.altbeacon</module>
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
                    "backgroundService": "services/handleBackgroundScan.js"
                }
            }
        }
    ```
2. Define the backgroundScanner service. This background-service is required on Android. (`app/lib/services/handleBackgroundScan.js`).:

    ```
    var Alloy = require('alloy'),
        _ = require('alloy/underscore')._,
        Backbone = require('alloy/backbone');

        var sensimity = require('com.sensimity.ti.client');
        sensimity.startBackgroundScan(<integer network-id>);
    ```
3. Start scanning:

    ```
        var sensimity = require('com.sensimity.ti.client');
        sensimity.start({
            networkId: <integer>
        });
    ```

### Methods
All of the methods are accessible by using the Sensimity Client library:

`var sensimity = require('com.sensimity.ti.client');`

* Start scanning within a specified network (foreground)

    ```
    sensimity.start({
        networkId: <integer>
    });
    ```
* Start scanning within a specified network (background)

    ```
    sensimity.startBackgroundScan(<integer network-id>);
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
