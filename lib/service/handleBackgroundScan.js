var routeService = require('./../services/route'),
    backgroundFollowRouteService = require('./../services/backgroundFollowRoute');

/**
 * Start the backgroundscanner and follow the last drived cycleroute
 */
function startBackgroundScanner() {
    var cycledRoute = routeService.getLastNotCompletedRoute();
    if (cycledRoute !== null) {
        backgroundFollowRouteService.start(cycledRoute.get('route_id'));
        Ti.App.addEventListener('followRouteService:updateCurrentRouteData', showNotification);
        Ti.App.addEventListener('followRouteService:routeFinished', routeFinished);
    } else {
        // no route to follow, so stop the current backgroundservice
        Ti.App.currentService.stop();
    }
}

/**
 * Remove the eventlisteners if the service is stopped
 */
Ti.App.currentService.addEventListener('stop', function() {
    Ti.App.removeEventListener('followRouteService:updateCurrentRouteData', showNotification);
    Ti.App.removeEventListener('followRouteService:routeFinished', routeFinished);
    backgroundFollowRouteService.destruct();
});

/**
 * Show a notification, triggered by the followroute-service
 * @param data information about the obtained junctions
 */
function showNotification(data) {
    if (!data.notification) {
        return;
    }

    // Wait till starting the next javascript-loop
    _.defer(function() {
        var cycledRoute = routeService.getLastNotCompletedRoute();
        Ti.App.iOS.scheduleLocalNotification({
            alertBody: 'Je hebt knooppunt ' + data.from + ' bereikt. Vervolg de route naar knooppunt ' + data.to,
            date: new Date(new Date().getTime()),
            // The following URL is passed to the application
            userInfo: {
                openController: 'followRoute',
                finished: false,
                route_id: cycledRoute.get('route_id')
            },
            sound: 'default'
        });
    });
}

/**
 * Show a notification if the route is finished by the cyclist
 * @param cycledRoute The completed route
 */
function routeFinished(cycledRoute) {
    Ti.App.iOS.cancelAllLocalNotifications();
    // Wait till starting the next javascript-loop
    _.defer(function() {
        Ti.App.iOS.scheduleLocalNotification({
            alertBody: 'Alle knooppunten zijn bereikt, de route is voltooid!',
            date: new Date(new Date().getTime()),
            // The following URL is passed to the application
            userInfo: {
                openController: 'followRoute',
                finished: true,
                route_id: cycledRoute.get('route_id')
            },
            sound: 'default'
        });
    });
    backgroundFollowRouteService.destruct();
    Ti.App.currentService.stop();
}

startBackgroundScanner();
