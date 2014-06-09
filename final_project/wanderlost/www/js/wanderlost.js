/** 
*  wanderlost.js
*  Matthew Korporaal
*/


// Global variables
KM_PER_MILE = 1.60934;
FEET_PER_KM = 3280.4;   
ARRIVAL_THRESH = 40;            // Feet, anything below considered "arrived"


FEET_PER_MILE = 5280;
FEET_PER_YARD = 3;
FOOT_YARD_THRESH = 100;         // Feet, distance below will be in feet, above in yards

IMAGE_ROTATION_OFFSET = -26.0;  // offset to make image point to 0deg
GUIDE_INTERVAL = 300;           // milliseconds, guide loop interval

// Namespace application variables and functions
var app = {

    // Application Constructor
    initialize: function() {
        this.bindEvents();
        this.initGlobals();
        this.drawMap();
        this.startGeolocation();
        this.startCompass();
        this.createMarker();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicity call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
    },
    // initialize variables shared across app functions
    initGlobals: function() {
        this.map = null,                 // Leaflet map window
        this.markers = [],               // Array for user created waypoints 
        this.currLatLng = [],            // Current Latitude/Longitude
        this.currLatLngStr = '',         // Current Latitude/Longitude string
        this.currPosMarker = null,       // Leaflet marker used for current position
        this.currPosCircle = null,       // Leaflet circle for accuracy prediction
        this.currGuideId = null,         // Marker id assigned by Leaflet
        this.guidingIntervalId = null,   // Interval ID for main guiding logic
        this.magneticHeading = 0,        // Bearing values: 0-360
        this.needleRotation = 0;         // Rotation of compass guiding needle in deg
        this.currLatLngObj = null;       // latlon.js current latlng object
        this.polyline = null;            // Line on Map from current position to marker
        this.polylineDecorator = null;   // Leaflet plugin for decorative line

        this.posIcon = L.icon({
            iconUrl:      'js/images/current-pos.png',
            iconSize:     [20, 20], // size of the icon
            iconAnchor:   [10,10],    // point of the icon which will correspond to marker's location
            popupAnchor:  [0,-10]     // point from which the popup should open relative to the iconAnchor
        });

        this.markerIcon = L.icon({
            iconUrl:      'js/images/marker.png',
            iconSize:     [30, 30], // size of the icon
            iconAnchor:   [7,25],  // point of the icon which will correspond to marker's location
            popupAnchor:  [0, -25]  // point from which the popup should open relative to the iconAnchor
        });

        this.needleIcon = L.icon({
            iconUrl:      'js/images/needle-small.png',
            iconSize:     [30, 30], // size of the icon
            iconAnchor:   [0,0],  // point of the icon which will correspond to marker's location
            popupAnchor:  [6, -33]  // point from which the popup should open relative to the iconAnchor            
        });
    },
    // Leaflet map and Google satellite
    drawMap: function() {

        // Draw map and tile, these options are hack for a pinch-zoom bug in leaflet
        this.map = L.map('map', { zoomAnimation: true, fadeAnimation: true }); 
        
        // Hack to fill window with tiles    
        this.map._onResize();

        // Add street layer to map
        var dataURL = 'http://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png';
        var layerOptions = {
            maxZoom: 18,
            attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> ',
            id: 'machewpchew.i93ncjo1',
        };
        var streetLayer = L.tileLayer(dataURL, layerOptions).addTo(this.map);

        // Add satellite layer to map
        var satelliteLayer = new L.Google();
        this.map.addLayer(satelliteLayer);

        // Add control group toggle to map
        var controlGroupOptions = { 
            'Street': streetLayer, 
            'Satellite': satelliteLayer 
        };
        L.control.layers(controlGroupOptions).addTo(this.map);

    },
    // PhoneGap geolocation
    startGeolocation: function() {

        // Get position data
        var positionOptions = { 
            maximumAge: 3000, 
            timeout: 30000, 
            enableHighAccuracy: true 
        };
        var locationWatchId = navigator.geolocation.watchPosition(geolocationSuccess, geolocationError, positionOptions); 

    },
    // Update current position and marker
    updatePosition: function(position) {

        // Format position to add to popup
        this.currLatLng = [position.coords.latitude, position.coords.longitude];
        this.currLatLngStr = this.currLatLng[0].toString() + ', ' + this.currLatLng[1].toString();

        // Create Leaflet latLng object with new coordinates and update marker position
        // TODO remove this if working
        //this.currLatLngObj = new L.LatLng(position.coords.latitude, position.coords.longitude);
        this.currPosMarker.setLatLng(this.currLatLng);// changed this.currLatLngObj to ...
        this.currPosMarker.update();
        this.currPosMarker.bindPopup(this.currLatLngStr);

        // Update accuracy circle position
        this.currPosCircle.setLatLng(this.currLatLng);
        this.currPosCircle.update();
    },
    // PhoneGap compass
    startCompass: function() {
        var compassWatchId = navigator.compass.watchHeading(compassSuccess, compassError);
    },
    // Add marker layer to map
    createMarker: function() {

        // Create new marker after 'save'
        $('#marker-save').click(function(){

            // Get user input for marker name
            var markerName = $('#marker-name').val();

            // Create new Leaflet marker and add to map
            var markerOptions = { draggable: true, icon: app.markerIcon };
            var newMarker = L.marker(app.currLatLng, markerOptions)
                .bindPopup('Marker Name:  ' )
                .addTo(app.map)

            // Remove name from popup
            $('#marker-name').val('');

            // Add waypoint to markers array for List
            var marker = {
                id:   newMarker._leaflet_id,
                name: markerName,
                lat:  app.currLatLng[0],
                lng:  app.currLatLng[1]
            };
            app.markers.push(marker);

            // Add link within popup to start Guide
            newMarker.on('click', function(e){

                // Anchor tag id is set to marker id and is then passed to Guide to start guiding
                var template = "<a href='#page3' data-transition='slide' class='ui-link-inherit' onclick='app.setCurrGuideId(this)' id={{id}}>{{name}}</a>";
                var html = Mustache.to_html(template, {
                    name: markerName,
                    id: newMarker._leaflet_id
                });

                // Append link to the new marker's popup
                $('.leaflet-popup-content').append(html);
            });

            // Update coordinates of marker when dragged to a new position
            newMarker.on('dragend', function(e) {                
                var newLatLng = this.getLatLng();

                // find marker info and change the coordinates
                for (var i in app.markers) {
                    if (app.markers[i].id === newMarker._leaflet_id) {
                        app.markers[i].lat = newLatLng.lat;
                        app.markers[i].lng = newLatLng.lng;
                    }
                }
            });
        });
    },
    // Create List using mustache.js
    listMarkers: function() {

        // Delete list before re-populating
        $('#marker-list').find('ul').empty();

        // Attach list to page
        var template = 
            "<li data-role='list-divider' role='heading' class='ui-li ui-li-divider ui-bar-a ui-first-child ui-last-child'>" +
                "Markers" +
            "</li>" +
            "{{#markers}}" +
            "<li data-theme='c' data-corners='false' data-shadow='false' data-iconshadow='true' data-wrapperels='div' data-icon='arrow-r' data-iconpos='right' class='ui-btn ui-btn-icon-right ui-li-has-arrow ui-li ui-btn-up-c'>" + 
                "<div class='ui-btn-inner ui-li'>" +
                    "<div class='ui-btn-text'>" +
                        "<a href='#page3' data-transition='slide' class='ui-link-inherit' onclick='app.setCurrGuideId(this)' id={{id}}>{{name}}</a>" +
                    "</div>" +
                "<span class='ui-icon ui-icon-arrow-r ui-icon-shadow'>&nbsp;</span>" +
                "</div>" +
            "</li>" +
            "{{/markers}}";

        var markers = this.markers;
        var html = Mustache.to_html(template, { markers: markers });
        var list = $('#marker-list').find('ul').append(html);
    },
    // Using leaflet marker id to trigger guiding
    setCurrGuideId: function(item) {
        this.currGuideId = parseInt($(item).attr('id'));
    },
    // Create latlon instances used for getting distanceTo and bearingTo marker
    getCoordinates: function() {

        // Create LatLon instances
        for (var i in this.markers) {
            if (this.markers[i].id === this.currGuideId) {
                this.markerLatLon = new LatLon(this.markers[i].lat, this.markers[i].lng)
            }
        }

        this.currLatLngObj = new LatLon(this.currLatLng[0], this.currLatLng[1]);
    },
    // find distance to marker
    updateDistance: function() {
        this.distanceTo = parseFloat(this.currLatLngObj.distanceTo(this.markerLatLon));
    },
    // find bearing to marker
    updateBearing: function() {
        this.bearingTo = this.currLatLngObj.bearingTo(this.markerLatLon);
    },
    // update DOM with guiding info
    updateGuidePage: function() {
        // update bearing
        var deviceBearingTo = this.bearingTo - this.magneticHeading + IMAGE_ROTATION_OFFSET;
        if (deviceBearingTo < 0) {
            deviceBearingTo = deviceBearingTo + 360;
        }
        this.seamlessRotation(deviceBearingTo);

        $('#needle').css('transform', 'rotate(' + this.needleRotation + 'deg)');

        // update distance and convert to feet yards miles...
        this.convertDistanceToStr();
        $('span b').text(this.distanceToStr);

    },
    // update DOM with polyline
    updateMapPage: function() {

        // If still guiding then update map page
        if(this.currGuideId) {

            // remove polyline first,
            if (this.polyline) {
                this.map.removeLayer(this.polylineDecorator);
            } 

            // Get current coordinates
            var pointA = this.currLatLng;

            for (var i in this.markers) {
                if (this.markers[i].id == this.currGuideId) {
                    var pointB = [this.markers[i].lat, this.markers[i].lng];
                }
            }

            var pointList = [pointA, pointB];

            //  then draw a new one with updated coords        
            this.polyline = new L.Polyline(pointList);


            var decoratorOptions =
            {
                patterns: [
                    // define a pattern of 5px-wide dashes, repeated every 15px on the line 
                    {
                        offset: 0, 
                        repeat: '8px', 
                        symbol: new L.Symbol.Dash({ pixelSize: 1 })
                    }
                ]
            };
            this.polylineDecorator = L.polylineDecorator(this.polyline, decoratorOptions).addTo(app.map);
        }
    },
    // Convert distance in kilometers to Miles, Yards, and Feet
    convertDistanceToStr: function() {

        // If distance is null or distance is less than arrival threshold, stop guiding
        if (!this.distanceTo || (this.distanceTo * FEET_PER_KM) < ARRIVAL_THRESH) {
            this.distanceToStr = 'You have arrived!';
            this.stopGuiding();
        } else {

            // KM to miles
            var distInMiles = this.distanceTo / KM_PER_MILE;
            var distInMilesStr = distInMiles.toString().split('.');

            if (distInMiles >= 2) {

                // If greater than 1 mile then append "Miles"
                this.distanceToStr = distInMilesStr[0] + '.' + distInMilesStr[1].substr(1,1) + ' Miles';
            } else if (distInMiles >= 1) {

                // If 1 mile then append "Mile"
                this.distanceToStr = distInMilesStr[0] + '.' + distInMilesStr[1].substr(1,1) + ' Mile';
            } else {

                // Miles to yards
                distInYards = distInMiles * FEET_PER_MILE / FEET_PER_YARD;
                distInYardsStr = distInYards.toString().split('.')[0];

                if (distInYards > FOOT_YARD_THRESH) {
                    // If less than a mile then append "Yards"
                    this.distanceToStr = distInYardsStr + ' Yards';
                } else {

                    // If number of yards is less than threshold, then append "Feet"
                    distInFeet = distInYards * FEET_PER_YARD;
                    distInFeetStr = distInFeet.toString().split('.')[0];
                    this.distanceToStr = distInFeetStr + ' Feet';
                }
            }
        }
    },
    // Seamlessly switches compass needle from 359 to 0 and 0 to 359 without flipping
    seamlessRotation: function(rotation) {
        var apparentRotation;
        this.needleRotation = this.needleRotation || 0; 
        apparentRotation = this.needleRotation % 360;
        if (apparentRotation < 0) { apparentRotation += 360; }
        if (apparentRotation < 180 && (rotation > (apparentRotation + 180))) { this.needleRotation -= 360; }
        if (apparentRotation >= 180 && (rotation <= (apparentRotation - 180))) { this.needleRotation += 360; }
        this.needleRotation += (rotation - apparentRotation);
    },
    // Stop guiding loop
    stopGuiding: function() {

        // Stop guiding interval and set to null
        clearInterval(app.guidingIntervalId);
        app.guidingIntervalId = null

        // Reset guide id and remove polyline from map
        app.currGuideId = null;
        app.map.removeLayer(app.polylineDecorator);
    }
};

// Tabbar widget and events
(function($) {
  $.widget('mobile.tabbar', $.mobile.navbar, {
    _create: function() {
      // Set the theme before we call the prototype, which will 
      // ensure buttonMarkup() correctly grabs the inheritied theme.
      // We default to the "a" swatch if none is found
      var theme = this.element.jqmData('theme') || 'a';
      this.element.addClass('ui-footer ui-footer-fixed ui-bar-' + theme);

      // Make sure the page has padding added to it to account for the fixed bar
      this.element.closest('[data-role="page"]').addClass('ui-page-footer-fixed');


      // Call the NavBar _create prototype
      $.mobile.navbar.prototype._create.call(this);
    },

    // Set the active URL for the Tab Bar, and highlight that button on the bar
    setActive: function(url) {
      // Sometimes the active state isn't properly cleared, so we reset it ourselves
      this.element.find('a').removeClass('ui-btn-active ui-state-persist');
      this.element.find('a[href="' + url + '"]').addClass('ui-btn-active ui-state-persist');
    }
  });

  $(document).on('pagecreate create', function(e) {
    return $(e.target).find(":jqmData(role='tabbar')").tabbar();
  });

  $(document).on('pageshow', ":jqmData(role='page')", function(e) {
    // TODO: set guide to inactive
        // $('#page3').on('click', function(e) {
        //     e.preventDefault();
        // });
    // Grab the id of the page that's showing, and select it on the Tab Bar on the page
    var tabBar, id = $(e.target).attr('id');

    tabBar = $.mobile.activePage.find(':jqmData(role="tabbar")');
    if (tabBar.length) {
      tabBar.tabbar('setActive', '#' + id);
    }

  });
  
})(jQuery);

// onSuccess Geolocation
//
function geolocationSuccess(position) {
    var posVariance = 0.05;

    if (app.currPosMarker == null) {

        // First time through, create position marker and add to the map
        app.currLatLng = [position.coords.latitude, position.coords.longitude];
        app.currLatLngStr = app.currLatLng[0].toString() + ", " + app.currLatLng[1].toString();
        
        var markerOptions = {
            draggable: false, 
            icon: app.posIcon
        };
        app.currPosMarker = L.marker(app.currLatLng, markerOptions)
                .addTo(app.map)
                .bindPopup(app.currLatLngStr)
                .openPopup();

        // Create bounds around self and zoom in
        app.currBounds = [[position.coords.latitude - posVariance, position.coords.longitude - posVariance],
                         [position.coords.latitude + posVariance, position.coords.longitude + posVariance]];

        app.map.fitBounds(app.currBounds).zoomIn(15);

        var circleOptions = {
            weight: 1,
            opacity: 0.4,
            fillOpacity: 0.1
        };
        app.currPosCircle = L.circle(app.currLatLng, position.coords.accuracy, circleOptions).addTo(app.map);

    } else {
        app.updatePosition(position);
    }

}

// onError Callback receives a PositionError object
//
function geolocationError(e) {
    console.log('code: ' + e.code + '\n' +'message: ' + e.message + '\n');
}

// Compass callback
function compassSuccess(heading) {
    app.magneticHeading = heading.magneticHeading;
    console.log('Heading: ' + app.magneticHeading);
}

function compassError(e) {
    alert('CompassError: ' + e.code);
}

// set cursor on name input of popup when creating marker
$(document).on('pagebeforeshow', '#page1', function(){ 
    $('#createMarker').popup({
        afteropen: function( event, ui ) {
            $('#marker-name').focus();
        }
    });
});

// Make list of markers dynamically
$(document).on('pagebeforeshow', '#page2', function() { 
    app.listMarkers();
});

// Guiding page core logic
$(document).on('pagebeforeshow', '#page3', function() { 
        
    var $needle = $('#needle');
    var $stopGuide = $('#stop-guiding');

    if (!app.currGuideId) {

        // If no marker chosen, then nothing to guide to
        $needle.hide();
        $stopGuide.hide();
        $('span b').text('You must first pick a marker...');

    } else {
        
        // Marker has been chosen, turn indicators on
        $needle.show();
        $stopGuide.show();

        // Set page update interval
        app.guidingIntervalId = setInterval(function() {

            // Create LatLon object
            app.getCoordinates();

            // Find Distance to marker
            app.updateDistance();

            // Find Bearing
            app.updateBearing();

            // Update Guide page
            app.updateGuidePage();  

            // Update Map page with needle and line
            app.updateMapPage();

        }, GUIDE_INTERVAL);

        // Stop guiding loop when user clicks button
        $stopGuide.on('click', function() {
            app.stopGuiding();
        });
    }
});
