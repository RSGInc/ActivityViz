//encapsulate all code within a IIFE (Immediately-invoked-function-expression) to avoid polluting global namespace
//global object three3d will contain functions and variables that must be accessible from elsewhere
var three3d = (function three3dFunction() {
    "use strict";
    var naColor = "#ffffff"; //white
    var bubbleColor = "#ff7800";
    var colors = ["red", "red", "red", "red"]; //these will be replaced by default palette/ramp colors
    var selectedColorRampIndex = 0;
    var periodSqrtScale;
    var allTimeSqrtScale;
    var palette = [
        ["rgb(0, 0, 0)", "rgb(67, 67, 67)", "rgb(102, 102, 102)"
        , "rgb(204, 204, 204)", "rgb(217, 217, 217)", "rgb(255, 255, 255)"]
        , ["rgb(152, 0, 0)", "rgb(255, 0, 0)", "rgb(255, 153, 0)", "rgb(255, 255, 0)", "rgb(0, 255, 0)"
        , "rgb(0, 255, 255)", "rgb(74, 134, 232)", "rgb(0, 0, 255)", "rgb(153, 0, 255)", "rgb(255, 0, 255)"]
        , ["rgb(230, 184, 175)", "rgb(244, 204, 204)", "rgb(252, 229, 205)", "rgb(255, 242, 204)", "rgb(217, 234, 211)"
        , "rgb(208, 224, 227)", "rgb(201, 218, 248)", "rgb(207, 226, 243)", "rgb(217, 210, 233)", "rgb(234, 209, 220)"
        , "rgb(221, 126, 107)", "rgb(234, 153, 153)", "rgb(249, 203, 156)", "rgb(255, 229, 153)", "rgb(182, 215, 168)"
        , "rgb(162, 196, 201)", "rgb(164, 194, 244)", "rgb(159, 197, 232)", "rgb(180, 167, 214)", "rgb(213, 166, 189)"
        , "rgb(204, 65, 37)", "rgb(224, 102, 102)", "rgb(246, 178, 107)", "rgb(255, 217, 102)", "rgb(147, 196, 125)"
        , "rgb(118, 165, 175)", "rgb(109, 158, 235)", "rgb(111, 168, 220)", "rgb(142, 124, 195)", "rgb(194, 123, 160)"
        , "rgb(166, 28, 0)", "rgb(204, 0, 0)", "rgb(230, 145, 56)", "rgb(241, 194, 50)", "rgb(106, 168, 79)"
        , "rgb(69, 129, 142)", "rgb(60, 120, 216)", "rgb(61, 133, 198)", "rgb(103, 78, 167)", "rgb(166, 77, 121)"
        , "rgb(91, 15, 0)", "rgb(102, 0, 0)", "rgb(120, 63, 4)", "rgb(127, 96, 0)", "rgb(39, 78, 19)"
        , "rgb(12, 52, 61)", "rgb(28, 69, 135)", "rgb(7, 55, 99)", "rgb(32, 18, 77)", "rgb(76, 17, 48)"]
    ];
    //slider
    var handlers = [25, 50, 75];
    var map;
    var zoneData = {}; //map of zoneIds with secondary map for period quantities
    var periodData = {}; //map of periods with array of all zone quantities - does not need zone ids since used for geostats
    var currentPeriod = 19; //12 noon
    var periods;
    var circlesLayerGroup;
    //use Map instead of vanilla object because wish to preserve insertion order
    var marginTop = 0;
    var marginBottom = 50;
    var marginLeft = 110;
    var marginRight = 50;
    var CSS_UPDATE_PAUSE = 150; //milliseconds to pause before redrawing map
    var interval;
    var currentCyclePeriodIndex = 0;
    var cycleGoing = false;
    var breakUp;
    var bubblesShowing = false;
    var showOutline = false;
    var maxFeature;
    var zoneDataLayer;
    var countyLayer;
    var paletteRamps = d3.selectAll("#three3d .ramp");
    var circleStyle = {
        "stroke": false
        , "fillColor": bubbleColor
        , "fillOpacity": 0.5
    };
    var ZONE_COLUMN = 0;
    var PERIOD_COLUMN = 1;
    var QUANTITY_COLUMN = 2;
    //start off chain of initialization by reading in the data	
    readInData(function () {
        "use strict";
        createMap(function () {
            console.log("createMap callback")
        });
        setDataSpecificDOM();
        initializeMuchOfUI();
        updateCurrentPeriodOrClassification();
    }); //end call to readInData and its follwing callback
    function redrawMap() {
        "use strict";
        if (zoneDataLayer != undefined) {
            map.removeLayer(zoneDataLayer);
            map.addLayer(zoneDataLayer);
        }
    }

    function readInData(callback) {
        "use strict";
        d3.text("../data/" + abmviz_utilities.GetURLParameter("scenario") + "/3DAnimatedMapData.csv", function (error, data) {
            "use strict";
            if (error) throw error; //expected data should have columns similar to: ZONE,PERIOD,QUANTITY
            var csv = d3.csv.parseRows(data).slice(1);
            data = null; //allow memory to be GC'ed
            var minMaxRange = [10000000, -10000000];
            var rolledUpMap = d3.nest().key(function (d) {
                //convert quantity to a number
                var quantity = d[QUANTITY_COLUMN] = +d[QUANTITY_COLUMN];
                //convert periods to integers by removing all non-numeric characters
                var period = d[PERIOD_COLUMN] = parseInt(d[PERIOD_COLUMN].replace(/\D/g, ''));
                var zone = d[ZONE_COLUMN] = +d[ZONE_COLUMN];
                if (zoneData[zone] == undefined) {
                    zoneData[zone] = {};
                }
                zoneData[zone][period] = quantity;
                if (periodData[period] == undefined) {
                    periodData[period] = [] //array of all quantities during this period for use with geostats
                }
                if (!isNaN(quantity)) {
                    periodData[period].push(quantity);
                }
                return zone;
            }).sortKeys(d3.ascending).key(function (d) {
                return d[PERIOD_COLUMN];
            }).sortKeys(d3.ascending).rollup(function (d) {
                var quantity = d[0][QUANTITY_COLUMN];
                if (!isNaN(quantity)) {
                    minMaxRange[0] = Math.min(minMaxRange[0], quantity);
                    minMaxRange[1] = Math.max(minMaxRange[1], quantity);
                }
                return quantity;
            }).map(csv);
            periods = Object.keys(periodData);
            allTimeSqrtScale = d3.scale.linear().domain(minMaxRange).range([0, 1]);
            callback();
        }); //end d3.text
    }; //end readInData 
    function setDataSpecificDOM() {
        "use strict";
    } //end setDataSpecificDOM
    function styleZoneGeoJSONLayer(feature) {
        "use strict";
        var color = naColor;
        var quantity = 0;
        var featureId = feature.properties.id;
        if (zoneData[featureId] != undefined) {
            var zoneDataFeature = zoneData[featureId][currentPeriod];
            //possible that even if data for zone exists, could be missing this particular period
            if (zoneDataFeature != undefined) {
                quantity = zoneDataFeature;
                if (isNaN(quantity)) {
                    color = naColor;
                }
                else if (quantity >= breakUp[3]) {
                    color = colors[3];
                }
                else if (quantity >= breakUp[2]) {
                    color = colors[2];
                }
                else if (quantity >= breakUp[1]) {
                    color = colors[1];
                }
                else {
                    color = colors[0];
                }
            } //end if we have data for this period
        } //end if we have data for this zone
        color = color.toString(); //convert from d3 color to generic since vizicities does not use d3 color object
        //the allowed options are described here: http://leafletjs.com/reference.html#path-options
        var returnStyle = {
            //all SVG styles allowed
            //            fillColor: color
            //            , fillOpacity: 0.3
            //            , weight: 1
            //            , color: "#999"
            //            , strokeOpacity: 0.05
            //            , stroke: showOutline
            transparent: false
            , opacity: 0.4
            , height: allTimeSqrtScale(quantity) * 5000
            , color: color
            , fillColor: 'yellow'
            , fillRect: 'yellow'
        };
        return (returnStyle);
    } //end styleZoneGeoJSONLayer function
    function styleCountyGeoJSONLayer(feature) {
        "use strict";
        var returnStyle = {
            //all SVG styles allowed
            //            fill: true
            //            , fillOpacity: 0.0
            //            , stroke: true
            //            , weight: 1
            //            , strokeOpacity: 0.25
            //            , color: "gray"
            height: Math.random() * 50
            , color: 'yellow'
        };
        return (returnStyle);
    } //end styleCountyGeoJSONLayer function
    function createMap(callback) {
        "use strict";
        map = VIZI.world("three3d-map", {
            skybox: false
            , postProcessing: false
        }).setView([33.754525, -84.384774], 9); //centered at Atlanta
        var controls = VIZI.Controls.orbit().addTo(map);
        VIZI.imageTileLayer('http://tile.stamen.com/toner-lite/{z}/{x}/{y}.png', {
            attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.'
        }).addTo(map);
        zoneDataLayer = VIZI.geoJSONLayer('../scripts/ZoneShape.GeoJSON', {
            interactive: false
            , output: true
            , style: styleZoneGeoJSONLayer
        }).addTo(map);
        //        VIZI.geoJSONLayer('../scripts/cb_2015_us_county_500k_GEORGIA.json', {
        //            interactive: false
        //            , style: styleCountyGeoJSONLayer
        //        }).addTo(map); 
        map.on('zoomend', function (type, target) {
            var zoomLevel = map.getZoom();
            var zoomScale = map.getZoomScale();
            console.log('zoomLevel: ', zoomLevel, ' zoomScale: ', zoomScale);
        });
        //        // Manhattan
        //        var coords = [40.739940, -73.988801];
        //        var world = VIZI.world('three3d-map', {
        //            skybox: false
        //            , postProcessing: false
        //        }).setView(coords);
        //        // Add controls
        //        VIZI.Controls.orbit().addTo(world);
        //        // CartoDB basemap
        //        VIZI.imageTileLayer('http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png', {
        //            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
        //        }).addTo(world);
        //        // Buildings from Mapzen
        //        VIZI.topoJSONTileLayer('https://vector.mapzen.com/osm/buildings/{z}/{x}/{y}.topojson?api_key=vector-tiles-NT5Emiw', {
        //            interactive: false
        //            , style: function (feature) {
        //                var height;
        //                if (feature.properties.height) {
        //                    height = feature.properties.height;
        //                }
        //                else {
        //                    height = 10 + Math.random() * 10;
        //                }
        //                return {
        //                    height: height
        //                };
        //            }
        //            , filter: function (feature) {
        //                // Don't show points
        //                return feature.geometry.type !== 'Point';
        //            }
        //            , attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://whosonfirst.mapzen.com#License">Who\'s On First</a>.'
        //        }).addTo(world); 
        var controlButtons = document.querySelectorAll('.control button');
        for (var i = 0; i < controlButtons.length; i++) {
            controlButtons[i].addEventListener('click', function (e) {
                var button = this;
                var parentClassList = button.parentNode.classList;
                var direction = button.classList.contains('inc') ? 1 : -1;
                var increment;
                if (parentClassList.contains('tilt')) {
                    increment = direction * 10;
                    controls.tiltBy(increment, false);
                }
                else if (parentClassList.contains('rotation')) {
                    increment = direction * 10;
                    controls.rotateBy(increment, false);
                }
                else if (parentClassList.contains('zoom')) {
                    increment = direction * 1;
                    controls.zoomBy(increment, false);
                }
            });
        }
    }; //end createMap
    function updateColors(values, themax) {
        "use strict";
        var colorStops = colors[0] + ", "; // start left with the first color
        for (var i = 0; i < values.length; i++) {
            colorStops += colors[i] + " " + (values[i] / (themax / 100.0)) + "%,";
            colorStops += colors[i + 1] + " " + (values[i] / (themax / 100.0)) + "%,";
        }
        // end with the last color to the right
        colorStops += colors[colors.length - 1];
        var css = "";
        if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1) {
            //mozilla
            css = '-moz-linear-gradient(left,' + colorStops + ')';
        }
        else if (navigator.userAgent.toLowerCase().indexOf('chrome') > -1 || navigator.userAgent.toLowerCase().indexOf('safari') > -1) {
            // Safari 5.1, Chrome 10+
            css = '-webkit-linear-gradient(left,' + colorStops + ')';
        }
        else {
            //ie
            css = '-ms-linear-gradient(left,' + colorStops + ')';
        }
        $('#three3d-slider').css('background-image', css);
    }

    function setColorPalette(clickedIndex) {
        selectedColorRampIndex = clickedIndex;
        var currentPalette = paletteRamps[0][selectedColorRampIndex];
        var rects = d3.select(currentPalette).selectAll("rect");
        rects.each(function (d, i) {
            var paletteColor = d3.rgb(d3.select(this).attr("fill"));
            colors[i] = paletteColor;
        });
        d3.selectAll("#three3d .ramp").classed("selected", function (d, tempColorRampIndex) {
            return tempColorRampIndex == selectedColorRampIndex;
        });
    }; //end setColorPalette
    function initializeMuchOfUI() {
        console.log("three3d initializeMuchOfUI");
        $("#three3d-stacked").click(function () {
            extNvd3Chart.stacked(this.checked);
            extNvd3Chart.update();
        });
        $("#three3d-legend-type").click(function () {
            extNvd3Chart.legend.vers(this.checked ? "classic" : "furious");
            extNvd3Chart.update();
        });

        function updateTimeSliderTooltip(value) {
            var timeString = abmviz_utilities.halfHourTimePeriodToTimeString(value);
            $('#three3d-slider-time .ui-slider-handle:first').html('<div class="tooltip top slider-tip"><div class="tooltip-arrow"></div><div class="tooltip-inner">' + timeString + '</div></div>');
        }
        $("#three3d-slider-time").slider({
            range: false
            , min: 1
            , max: periods.length
            , step: 1
            , value: currentPeriod
            , create: function (e, ui) {
                updateTimeSliderTooltip(currentPeriod);
            }
            , change: function (e, ui) {
                currentPeriod = ui.value;
                updateTimeSliderTooltip(currentPeriod);
                updateCurrentPeriodOrClassification();
            }
            , slide: function (e, ui) {
                currentPeriod = ui.value;
                updateTimeSliderTooltip(currentPeriod);
                updateCurrentPeriodOrClassification();
            }
        });
        var colorRamps = d3.selectAll("#three3d .ramp").on('click', function (d, i) {
            setColorPalette(i);
            updateColors($("#three3d-slider").slider("values"));
            //add delay to redrawMap so css has change to updates
            setTimeout(redrawMap, CSS_UPDATE_PAUSE);
        }); //end on click for ramp/palette
        if ($("#three3d-classification").val() == "custom") {
            $("#three3d-update-map").css("display", "inline");
        };
        //Logic for cycling through the maps
        $("#three3d-start-cycle-map").click(function () {
            $("#three3d-stop-cycle-map").css("display", "inline");
            $("#three3d-start-cycle-map").css("display", "none");
            cycleGoing = true;
            currentCyclePeriodIndex = 0;
            cyclePeriod();
        });
        $("#three3d-stop-cycle-map").click(function () {
            cycleGoing = false;
            $("#three3d-stop-cycle-map").css("display", "none");
            $("#three3d-start-cycle-map").css("display", "inline");
        });

        function cyclePeriod() {
            currentCyclePeriodIndex++;
            if (currentCyclePeriodIndex >= periods.length) {
                currentCyclePeriodIndex = 0;
            }
            $("#three3d-slider-time").slider({
                value: periods[currentCyclePeriodIndex]
            });
            if (cycleGoing) {
                var timeInterval = parseInt($("#three3d-cycle-frequency").val()) * 1000;
                setTimeout(cyclePeriod, timeInterval);
            } //end if cycleGoing
        } //end cyclePeriod
        $("#three3d-cycle-frequency").change(function () {
            //no need to do anything since cyclePeriod always reads the current #cycle-frequency
        });
        $("#three3d-update-map").click(function () {
            var sliderValues = $("#three3d-slider").slider("values");
            breakUp[1] = sliderValues[0];
            breakUp[2] = sliderValues[1];
            breakUp[3] = sliderValues[2];
            redrawMap();
        });

        function updateSliderTooltip(values) {
            $('#three3d-slider .ui-slider-handle:first').html('<div class="tooltip top slider-tip"><div class="tooltip-arrow"></div><div class="tooltip-inner">' + values[0] + '</div></div>');
            $('#three3d-slider .ui-slider-handle:eq(1)').html('<div class="tooltip top slider-tip"><div class="tooltip-arrow"></div><div class="tooltip-inner">' + values[1] + '</div></div>');
            $('#three3d-slider .ui-slider-handle:last').html('<div class="tooltip top slider-tip"><div class="tooltip-arrow"></div><div class="tooltip-inner">' + values[2] + '</div></div>');
        }
        $("#three3d-slider").slider({
            range: false
            , disabled: ($("#three3d-classification").val() != "custom")
            , min: 0
            , max: 100
            , values: handlers
            , create: function (event, ui) {
                updateSliderTooltip(handlers);
            }
            , change: function (event, ui) {
                updateSliderTooltip(ui.values);
                var themax = $("#three3d-slider").slider("option", "max");
                updateColors(ui.values, themax);
            }
        });
        updateColors(handlers, $("#three3d-slider").slider("option", "max"));
        $("#three3d-classification").change(function () {
            updateCurrentPeriodOrClassification();
        });
        $("#three3d-naColor").spectrum({
            color: naColor
            , showInput: true
            , className: "full-spectrum"
            , showInitial: false
            , showPalette: true
            , showAlpha: true
            , showSelectionPalette: true
            , maxSelectionSize: 10
            , preferredFormat: "hex"
            , localStorageKey: "spectrum.demo"
            , palette: palette
            , change: function (color) {
                naColor = color;
                redrawMap();
                updateColors($("#three3d-slider").slider("values"));
            }
        });
        $("#three3d-bubble-color").spectrum({
            color: bubbleColor
            , showInput: true
            , className: "full-spectrum"
            , showInitial: true
            , showPalette: true
            , showAlpha: true
            , showSelectionPalette: true
            , maxSelectionSize: 10
            , preferredFormat: "hex"
            , localStorageKey: "spectrum.demo"
            , palette: palette
            , change: function (color) {
                bubbleColor = color;
                redrawMap();
            }
        });
        //initialize the map palette
        setColorPalette(selectedColorRampIndex);
    } //end initializeMuchOfUI
    //hex to rgb for handling transparancy
    function hexToRgb(hex) {
        "use strict";
        var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, function (m, r, g, b) {
            return r + r + g + g + b + b;
        });
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16)
            , g: parseInt(result[2], 16)
            , b: parseInt(result[3], 16)
        } : undefined;
    }

    function updateBubbles() {
        "use strict";
        bubblesShowing = $("#three3d-bubbles").is(":checked");
        console.log('updateBubbles: bubblesShowing=' + bubblesShowing);
        if (circlesLayerGroup == undefined) {
            return;
            //first time must initalize by creating and adding to map
            circlesLayerGroup = L.layerGroup([]);
            circlesLayerGroup.addTo(map);
        }
        else {
            circlesLayerGroup.clearLayers();
        }
        if (bubblesShowing) {
            //get current map width to determine maximum bubble size
            var mapCenter = map.getCenter();
            var eastBound = map.getBounds().getEast();
            var centerEast = L.latLng(mapCenter.lat, eastBound);
            var bubbleMultiplier = parseInt($("#three3d-bubble-size").val());
            var mapBounds = d3.select("#three3d-map").node().getBoundingClientRect();
            var mapRadiusInPixels = mapBounds.width / 2;
            var maxBubbleRadiusInPixels = mapRadiusInPixels / 10;
            var maxBubbleSize = bubbleMultiplier * maxBubbleRadiusInPixels;
            Object.keys(zoneData).forEach(function (zoneKey) {
                var zoneDatum = zoneData[zoneKey];
                var bubbleCenter = zoneDatum.centroid;
                var zoneTripData = zoneDatum[currentPeriod];
                if (zoneTripData != undefined) {
                    var quantity = zoneTripData;
                    var sqrtRadius = periodSqrtScale(quantity) * maxBubbleSize;
                    var circle = L.circleMarker(L.latLng(bubbleCenter.lng, bubbleCenter.lat), circleStyle);
                    circle.setRadius(sqrtRadius);
                    //add circle to circlesLayerGroup
                    circlesLayerGroup.addLayer(circle);
                } //end if have data for this zone and period
            }); //end Object.keys(zoneData).forEach
        } //end if bubbles showing
    }; //end updateBubbles
    function updateCurrentPeriodOrClassification() {
        "use strict";
        $('#three3d-current-period').html(abmviz_utilities.halfHourTimePeriodToTimeString(currentPeriod));
        console.log('updateCurrentPeriodOrClassification: #three3d-period.val()=' + currentPeriod);
        var serie = new geostats(periodData[currentPeriod]);
        maxFeature = serie.max();
        var minFeature = serie.min();
        periodSqrtScale = d3.scale.sqrt().domain([minFeature, maxFeature]).range([0, 1]);
        //handle the different classifications
        var classification = $("#three3d-classification").val();
        $("#three3d-slider").slider({
            range: false
            , disabled: ($("#three3d-classification").val() != "custom")
        });
        if (classification == "custom") {
            $("#three3d-update-map").css("display", "inline");
        }
        else {
            $("#three3d-update-map").css("display", "none");
            if (classification == "even-interval") {
                breakUp = serie.getClassEqInterval(4);
            }
            else if (classification == "quartiles") {
                breakUp = serie.getClassQuantile(4);
            }
            else if (classification == "jenks") {
                breakUp = serie.getClassJenks(4);
            }
            else {
                throw ("Unhandled classification: " + classification);
            }
            var newValues = [parseInt(breakUp[1]), parseInt(breakUp[2]), parseInt(breakUp[3])];
            //update the slider
            $("#three3d-slider").slider({
                values: newValues
            });
            updateColors(newValues, breakUp[4]);
        } //end if !custom
        updateBubbles();
        redrawMap();
    }; //end updateCurrentPeriodOrClassification
    function updateOutline() {
        showOutline = ($("#three3d-stroke").is(":checked"));
        redrawMap();
    }
    //return only the parts that need to be global
    return {
        updateOutline: updateOutline
        , updateBubbles: updateBubbles
    };
}()); //end encapsulating IIFEddTo(map);(map);