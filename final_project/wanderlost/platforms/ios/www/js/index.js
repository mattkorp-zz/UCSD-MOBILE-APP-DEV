/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
        this.initGlobals();
        this.drawMap();
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
    initGlobals: function() {
        app.waypoint = [];

    },
    drawMap: function() {
        // Draw map and tile
        app.map = L.map('map'); 
        
        // Hack to fill window with tiles    
        app.map._onResize();

        // Add tile layer to map
        var dataURL = 'http://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png';
        L.tileLayer( dataURL, {
            maxZoom: 18,
            attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> ',
            id: 'machewpchew.i93ncjo1',
        }).addTo(app.map);
    },
    createMarker: function() {
        $("#marker-save").click(function(){
            var name = $("#marker-name").val();

            var newMarker = L.marker(app.currLatLng, {draggable: true, icon: markerIcon})
                .bindPopup(name)
                .addTo(app.map);

            $("#marker-name").val("");
            //var waypoint = new Waypoint(name, app.currLatLng);
            var marker = {};
            marker.id = newMarker._leaflet_id;
            marker.name = name;
            marker.lat = app.currLatLng[0];
            marker.lon = app.currLatLng[1];
            app.waypoint.push(marker);

    // TODO: add click event to start tracking
            // Marker drag event to update coordinates
            newMarker.on('dragend', function(e){
                var newLatLng = this.getLatLng();
                // find marker info and change the coordinates
                for (var i = 0; i < app.waypoint.length; i++) {
                    if (app.waypoint[i].id === this._leaflet_id) {
                        app.waypoint[i].lat = newLatLng.lat;
                        app.waypoint[i].lng = newLatLng.lng;
                    }
                }
            });
    // TODO: add drag event to update lat lon

        });
    },
    getCoordinates: function() {
        // Create LatLon instances
        for( var i= 0; i < app.waypoint.length; i++) {
            if (app.waypoint[i].id === app.currGuideId ) {
                this.markerLatLon = new LatLon(app.waypoint[i].lat, app.waypoint[i].lng)
            }
        }

        this.currLatLon = new LatLon(app.currLatLng[0], app.currLatLng[1]);
    },
    updateDistance: function() {
        // TODO: add this to globals
        var feet = 3280;
        this.distanceTo = this.currLatLon.distanceTo(this.markerLatLon);
    },
    updateBearing: function() {
        this.bearingTo = this.currLatLon.bearingTo(this.markerLatLon);
    },
    updatePage: function() {
        // update bearing
        var deviceBearingTo = this.bearingTo - 26 + this.currBearing;
        console.log(deviceBearingTo);
        $('#needle').css('transform', 'rotate(' + deviceBearingTo + 'deg)');
        // add compass offset

        // update distance TODO add feet yards miles...
        if( app.distanceTo != null ) {
            $('span b').text(app.distanceTo)
        }

    }
};

    var posIcon = L.icon({
        iconUrl:      'js/images/current-pos.png',
        iconSize:     [20, 20], // size of the icon
        iconAnchor:   [0,0], // point of the icon which will correspond to marker's location
        popupAnchor:  [9,0] // point from which the popup should open relative to the iconAnchor
    });

    var markerIcon = L.icon({
        iconUrl:      'js/images/marker.png',
        iconSize:     [30, 30], // size of the icon
        iconAnchor:   [0,30], // point of the icon which will correspond to marker's location
        popupAnchor:  [6,-33] // point from which the popup should open relative to the iconAnchor
    });

function Waypoint(name, latlng) {
    this.name = name;
    this.lat = latlng[0];
    this.lng = latLng[1];
};

function setMarker () {
                <!-- Add click event to Marker button -->
                $("#set-waypoint").click(function() {
                    var markLatLng = marker.getLatLng();
                    // change this to popup, asking for name
                    waypoint.name = waypoint.length + 1;
                    waypoint.latlng = markLatLng;

                    console.log(markLatLng);

                    // L.latLngBounds(markLatLng);
                });
}

function setCurrGuideId(item) {
    app.currGuideId = parseInt($(item).attr("id"));
}


// Tabbar widget and events
(function($) {
  $.widget('mobile.tabbar', $.mobile.navbar, {
    _create: function() {
      // Set the theme before we call the prototype, which will 
      // ensure buttonMarkup() correctly grabs the inheritied theme.
      // We default to the "a" swatch if none is found
      var theme = this.element.jqmData('theme') || "a";
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
        // $('#page3').on('click', function(e) {
        //     e.preventDefault();
        // });
    // Grab the id of the page that's showing, and select it on the Tab Bar on the page
    var tabBar, id = $(e.target).attr('id');

    tabBar = $.mobile.activePage.find(':jqmData(role="tabbar")');
    if(tabBar.length) {
      tabBar.tabbar('setActive', '#' + id);
    }

  });
  
})(jQuery);

// Mapping 
$(function() {

    FastClick.attach(document.body);

    app.currBearing = 0;
        var positionVar = 0.05;
        var locationWatchId = navigator.geolocation.watchPosition(geolocationSuccess, geolocationError, { timeout: 30000 }); 
//      var compassWatchId = navigator.compass.watchHeading(compassSuccess, compassError);


    // onSuccess Geolocation
    //
    function geolocationSuccess(position) {

        if (app.currPos == null) {
            app.currLatLng = [position.coords.latitude, position.coords.longitude];
            app.currLatLngStr = app.currLatLng[0].toString() + ", " + app.currLatLng[1].toString();
            app.currPos = L.marker(app.currLatLng, {draggable: false, icon: posIcon}).addTo(app.map)
                    .bindPopup(app.currLatLngStr)
                    .openPopup();

            app.currBounds = [[position.coords.latitude - positionVar, position.coords.longitude - positionVar],
                              [position.coords.latitude + positionVar, position.coords.longitude + positionVar]];

            app.map.fitBounds(app.currBounds);
            app.map.zoomIn(18);
            console.log(position);
        } else {
            updatePosition(position);
        }

    }

    // onError Callback receives a PositionError object
    //
    function geolocationError(error) {
        alert('code: '    + error.code    + '\n' +
              'message: ' + error.message + '\n');
    }

    function updatePosition(position) {
        var newLatLng = new L.LatLng(position.coords.latitude, position.coords.longitude);
        app.currPos.setLatLng(newLatLng);
        app.currPos.update();
    }

    function compassSuccess(heading) {
        app.currBearing = heading.magneticHeading;
    }

    function compassError(e) {
        alert('CompassError: ' + e.code);
    }
});

// var element = document.getElementById('geolocation');
// element.innerHTML = 'Latitude: '           + position.coords.latitude              + '<br />' +
//                     'Longitude: '          + position.coords.longitude             + '<br />' +
//                     'Altitude: '           + position.coords.altitude              + '<br />' +
//                     'Accuracy: '           + position.coords.accuracy              + '<br />' +
//                     'Altitude Accuracy: '  + position.coords.altitudeAccuracy      + '<br />' +
//                     'Heading: '            + position.coords.heading               + '<br />' +
//                     'Speed: '              + position.coords.speed                 + '<br />' +
//                     'Timestamp: '          + position.timestamp                    + '<br />';

// set cursor on name input of popup
$(document).on('pagebeforeshow', '#page1', function(){ 

    $( "#createMarker" ).popup({
        afteropen: function( event, ui ) {
            $('#marker-name').focus();
        }
    });
});

$(document).on('pagebeforeshow', '#page2', function(){ 
    $("#waypoint-list").find('ul').empty();
    var template = 
        "<li data-role='list-divider' role='heading' class='ui-li ui-li-divider ui-bar-a ui-first-child ui-last-child'>" +
            "Markers" +
        "</li>" +
        "{{#waypoints}}" +
        "<li data-theme='c' data-corners='false' data-shadow='false' data-iconshadow='true' data-wrapperels='div' data-icon='arrow-r' data-iconpos='right' class='ui-btn ui-btn-icon-right ui-li-has-arrow ui-li ui-btn-up-c'>" + 
            "<div class='ui-btn-inner ui-li'>" +
                "<div class='ui-btn-text'>" +
                    "<a href='#page3' data-transition='slide' class='ui-link-inherit' onclick='setCurrGuideId(this)' id={{id}}>{{name}}</a>" +
                "</div>" +
            "<span class='ui-icon ui-icon-arrow-r ui-icon-shadow'>&nbsp;</span>" +
            "</div>" +
        "</li>" +
        "{{/waypoints}}";
    var waypoints = app.waypoint;
    var html = Mustache.to_html(template, {waypoints:waypoints});
    var list = $("#waypoint-list").find('ul').append(html);
});

$(document).on('pageshow', '#page3', function(){ 
    // Update calculation every 5 second while TODO: guide tab is active
    setInterval( function(){
              // Create LatLon object
              app.getCoordinates();
              // Find Distance TODO if NaN then at destination, stop guiding
              app.updateDistance();
              // Find Bearing
              app.updateBearing();
              // Update page
              app.updatePage();  
    }, 5000);
});
