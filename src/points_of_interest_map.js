//encapsulate all code within a IIFE (Immediately-invoked-function-expression) to avoid polluting global namespace
//global object barchart_and_map will contain functions and variables that must be accessible from elsewhere

var pointofinterest_and_map = (function() {
    "use strict";
    var map;
    var circleStyle = {
        "stroke": false,
        "fillColor": "set by updateBubbles",
        "fillOpacity": 1.0
    };
    var chartData = null;
    var url = "../data/" + abmviz_utilities.GetURLParameter("region") + "/" + abmviz_utilities.GetURLParameter("scenario") + "/PointofInterest.csv"
    var chartSelector = "#poi-by-group-chart";
    var svgChart;
    var showChartOnPage = true;
    var CENTER_LOC = [];
    var SCENARIO_FOCUS = false;
    var ROTATELABEL = 0;
    var BARSPACING = 0.2;
    var showCycleTools = true;
    var highlightLayer;
    var highlightBoxes;
    var showChartOnPage = true;
    var pointNameCol;
    var maxFeature;
    var circleMarkers;
    var groupColumn;
    var selectedGroup;
    var selectedDataGrp;
    var palette = [["rgb(0, 0, 0)", "rgb(67, 67, 67)", "rgb(102, 102, 102)", "rgb(204, 204, 204)", "rgb(217, 217, 217)", "rgb(255, 255, 255)"], ["rgb(152, 0, 0)", "rgb(255, 0, 0)", "rgb(255, 153, 0)", "rgb(255, 255, 0)", "rgb(0, 255, 0)", "rgb(0, 255, 255)", "rgb(74, 134, 232)", "rgb(0, 0, 255)", "rgb(153, 0, 255)", "rgb(255, 0, 255)"], ["rgb(230, 184, 175)", "rgb(244, 204, 204)", "rgb(252, 229, 205)", "rgb(255, 242, 204)", "rgb(217, 234, 211)", "rgb(208, 224, 227)", "rgb(201, 218, 248)", "rgb(207, 226, 243)", "rgb(217, 210, 233)", "rgb(234, 209, 220)", "rgb(221, 126, 107)", "rgb(234, 153, 153)", "rgb(249, 203, 156)", "rgb(255, 229, 153)", "rgb(182, 215, 168)", "rgb(162, 196, 201)", "rgb(164, 194, 244)", "rgb(159, 197, 232)", "rgb(180, 167, 214)", "rgb(213, 166, 189)", "rgb(204, 65, 37)", "rgb(224, 102, 102)", "rgb(246, 178, 107)", "rgb(255, 217, 102)", "rgb(147, 196, 125)", "rgb(118, 165, 175)", "rgb(109, 158, 235)", "rgb(111, 168, 220)", "rgb(142, 124, 195)", "rgb(194, 123, 160)", "rgb(166, 28, 0)", "rgb(204, 0, 0)", "rgb(230, 145, 56)", "rgb(241, 194, 50)", "rgb(106, 168, 79)", "rgb(69, 129, 142)", "rgb(60, 120, 216)", "rgb(61, 133, 198)", "rgb(103, 78, 167)", "rgb(166, 77, 121)", "rgb(91, 15, 0)", "rgb(102, 0, 0)", "rgb(120, 63, 4)", "rgb(127, 96, 0)", "rgb(39, 78, 19)", "rgb(12, 52, 61)", "rgb(28, 69, 135)", "rgb(7, 55, 99)", "rgb(32, 18, 77)", "rgb(76, 17, 48)"]];
    var latColumn;
    var lngColumn;
    var poiData;
    var chartData = null;
    var svgChart;
    var bubblesShowing = true;
    var bubbleColor = 'rgba(255, 120, 0, 0.5)';
    var pointColor = '#ff7800';
    var groupsSet;
    var groupArry = [];
    var extNvd3Chart;
    var enabledGroups;
    var minBarWidth = 1;
    var minBarSpacing = 1;
    var marginTop = 0;
    var marginBottom = 50;
    var marginLeft = 175;
    var marginRight = 50;
    var valueCols = [];
    var CSS_UPDATE_PAUSE = 150;
    var bubbleLayer;
    var myZoom = {};
    var circlesLayerGroup;
    var barsWrap;
    var barsWrapRect;
    var barsWrapRectHeight;
    var barsWrapRectId = "poi-by-group-barsWrapRectRSG"
    var barsWrapRectSelector = "#" + barsWrapRectId;
    var pointSet;
    var currentCounty = "";
var maxLabelLength = 0;
    var paletteRamps = d3.selectAll("#poi-by-group .ramp");
    var pointsAll = [];
    $("#scenario-header").html("Scenario " + abmviz_utilities.GetURLParameter("scenario"));

    //start off chain of initialization by reading in the data
    function readInDataCallback() {
        createMap(function () {
            console.log("createMap for POIT callback")
        });
        setDataSpecificDOM();
        svgChart = d3.select(chartSelector);
        //updateCurrentTripModeOrClassification();
        createEmptyChart();
        initializeMuchOfUI();

    }; //end readInDataCallback
    getConfigSettings(function () {
        readInData(function () {
            readInDataCallback();
        });
    });

    function getConfigSettings(callback) {
        if (showChartOnPage) {
            $.getJSON("../data/" + abmviz_utilities.GetURLParameter("region") + "/" + "region.json", function (data) {
                $.each(data, function (key, val) {
                    if (key == "CenterMap")
                        CENTER_LOC = val;
                    if (key == "POIMap") {
                        $.each(val, function (opt, value) {
                            if (opt == "RotateLabels") {
                                ROTATELABEL = value;
                            }
                            if (opt == "BarSpacing") {
                                BARSPACING = value;
                            }
                            if (opt == "LegendTitle") {
                                $('.legendtitle').html(value);
                            }

                        })
                    }
                    if (key == "scenarios" && Array.isArray(val)) {
                        $.each(val, function (k, v) {
                            if (v.name === abmviz_utilities.GetURLParameter("scenario") && v.CenterMap) {
                                CENTER_LOC = v.CenterMap;
                            }
                        });
                    }
                });
                callback();
            });
        }
    }

    function createEmptyChart() {
        nv.addGraph({
            generate: function chartGenerator() {
                //console.log('chartGenerator being called. nvd3Chart=' + nvd3Chart);
                var colorScale = d3.scale.category20();
                var nvd3Chart = nv.models.multiBarHorizontalChart();
                if ($("#poi-by-group-stacked").is(":checked")) {
                    nvd3Chart = nv.models.multiBarHorizontalChart().groupSpacing(BARSPACING);
                } else {
                    nvd3Chart = nv.models.multiBarHorizontalChart();
                }

                //console.log('chartGenerator being called. nvd3Chart set to:' + nvd3Chart);

                nvd3Chart.x(function (d, i) {
                    return d.label;
                }).y(function (d) {
                    return d.value
                }).color(function (d, i) {
                    var color = colorScale(i);

                    return color;
                }).duration(250).margin({
                    left: Math.max(110,110 + (maxLabelLength-14)*5),
                    right: marginRight,
                    top: marginTop,
                    bottom: marginBottom
                }).id("poi-by-group-chart-multiBarHorizontalChart").stacked(true).showControls(false);
                nvd3Chart.yAxis.tickFormat(d3.format(',.2f'));
                nvd3Chart.yAxis.axisLabel(groupColumn + " by " + $("#poi-by-group-values-current").val());
                //this is actually for xAxis since basically a sideways column chart
                nvd3Chart.xAxis.axisLabel(pointNameCol).axisLabelDistance(100);
                //this is actually for yAxis
                marginLeft =Math.max(110, 110 + (maxLabelLength-14)*5);
                nv.utils.windowResize(function () {
                    //reset marginTop in case legend has gotten less tall
                    nvd3Chart.margin({
                        top: marginTop
                    });
                    //updateChart(function () {
                    //	console.log('updateChart callback after windowResize');
                    //});
                });
                nvd3Chart.legend.dispatch.on('legendDblclick', function (event) {
                    var newTripMode = event.key;
                    console.log('legend legendDblclick on trip mode: ' + newTripMode);
                    //$('#poi-by-group-current-trip-mode-zones').val(newTripMode);
                    //updateCurrentTripModeOrClassification();
                    redrawMap();
                });
                nvd3Chart.multibar.dispatch.on("elementMouseover", function (d, i) {
                    var countyUnderMouse = d.value;
                    changeCurrentCounty(countyUnderMouse);
                });

                return nvd3Chart;
            } //end generate
            ,
            callback: function (newGraph) {
                console.log("nv.addGraph callback called");
                extNvd3Chart = newGraph;

                updateChart(function () {
                    console.log("updateChart callback during after the nvd3 callback called");
                });
            } //end callback function
        });
        //end nv.addGraph


    } //end createEmptyChart
    function updateChart(callback) {
        "use strict";
        updateChartNVD3(callback);
    }

    function readInData(callback) {
        "use strict";
        console.log("this is my poi");
        d3.csv(url, function (error, data) {
            "use strict";
            if (error) {
                $('#poi-by-group').html("<div class='container'><h3><span class='alert alert-danger'>Error: An error occurred while loading the Point of Interest Map data.</span></h3></div>");
                throw error;
            }

            var headers = d3.keys(data[0]);
            pointNameCol = headers[0];
            latColumn = headers[1];
            lngColumn = headers[2];
            groupColumn = headers[3]
            chartData = [];
            poiData = {};
            for (var i = 4; i < headers.length; i++) {
                valueCols.push(headers[i]);
            }

            groupsSet = new Set();
            console.log("this is my poi");
            pointSet = new Set();
            data.forEach(function (d) {
                var pointName = d[pointNameCol];
                var groupName = d[groupColumn];
                var pointLat = +d[latColumn];
                var pointLng = +d[lngColumn];
                var dataRow = d;

                pointsAll.push(pointName);
                groupsSet.add(groupName);
                if (poiData[pointName] == undefined) {

                    poiData[pointName] = {
                        LAT: pointLat,
                        LNG: pointLng,
                    };
                }

                if (poiData[pointName][groupName] == undefined) {
                    poiData[pointName][groupName] = [];
                }
                for (var i = 0; i < valueCols.length; i++) {
                    var name = valueCols[i];
                    var value = d[name];
                    poiData[pointName][groupName].push({name: name, value: +value});
                }

                if (!pointSet.has(pointName)) {
                    maxLabelLength = Math.max(maxLabelLength,pointName.length);
                    pointSet.add(pointName);
                    chartData.push({
                        pointlabel: pointName,
                        pointdata: poiData[pointName]
                    });
                }
            });


            // chartData.push(newPoiObject);
            groupsSet.forEach(function (D) {
                groupArry.push(D);
            });
            selectedGroup = groupArry[0];
            selectedDataGrp = valueCols[0];
            callback();
        }); //end d3.csv
    };

    function setDataSpecificDOM() {
        //d3.selectAll(".poi-by-group-area-type").html(countyColumn);
        d3.selectAll(".poi-by-group-values").html("Point Value");
        d3.selectAll(".poi-by-group-group").html(pointNameCol);
        d3.selectAll(".poi-by-group-groups").html("Point " + groupColumn);
        if (bubblesShowing) {
           // $("#poi-by-group-bubbles").prop("checked", bubblesShowing);
            $("#poi-by-group-bubble-color").spectrum(bubblesShowing ? "enable" : "disable", true);

            $("#poi-by-group-bubble-size").prop("disabled", !bubblesShowing);
        } else {
          /*  $("#poi-by-group-bubbles").prop("checked", false);
            $("#poi-by-group-bubble-color").spectrum(bubblesShowing ? "enable" : "disable", true);
            $("#poi-by-group-bubble-size").prop("disabled", !bubblesShowing);
    */
        }


        //d3.selectAll(".poi-by-group-trip-mode-bubbles").html("Bubbles");
        //d3.selectAll(".poi-by-group-trip-mode-example").html(modes[0]);
        valueCols.forEach(function (modeName) {
            $("#poi-by-group-values-current").append("<option>" + modeName + "</option>");
        });
        groupArry.forEach(function (groupName) {
            $("#poi-by-group-groups-current").append("<option>" + groupName + "</option>");
        });

        d3.selectAll(".poi-by-group-type").html($("#poi-by-group-values-current").val());

        $('#poi-by-group-values-current').change(function () {
            selectedDataGrp = $('#poi-by-group-values-current').val();
            createEmptyChart();
            redrawMap();
            d3.selectAll(".poi-by-group-type").html($("#poi-by-group-values-current").val());
        });
        $('#poi-by-group-groups-current').change(function () {
            selectedGroup = $('#poi-by-group-groups-current').val();
            redrawMap();

        });
    }

    function createMap(callback) {

        map = L.map("poi-by-group-map", {
            minZoom: 7
        }).setView(CENTER_LOC, 9);
        //centered at Atlanta
        map.on('zoomend', function (type, target) {
            var zoomLevel = map.getZoom();
            var zoomScale = map.getZoomScale();
            console.log('zoomLevel: ', zoomLevel, ' zoomScale: ', zoomScale);
        });
        console.log("create map poi");

        var underlyingMapLayer = L.tileLayer('//stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}.png', {
            updateWhenIdle: true,
            unloadInvisibleFiles: true,
            reuseTiles: true,
            opacity: 1.0
        });
        underlyingMapLayer.addTo(map);
        redrawMap();

    }

    function redrawMap() {
        highlightBoxes = [];
        circleMarkers = [];
        if (circlesLayerGroup != undefined) {
            map.removeLayer(circlesLayerGroup);
        }
        if (highlightLayer != undefined) {
            map.removeLayer(highlightLayer);
        }

        highlightLayer = new L.FeatureGroup();
        circlesLayerGroup = new L.LayerGroup();
        circlesLayerGroup.clearLayers();
        highlightLayer.clearLayers();
        var selectedData = selectedDataGrp;
        var polyLayers = [];
        var selectedGrping;
        var currentPoint;
        var prevPoint;
        pointsAll.forEach(function (d) {
            var dataSelected = poiData[d][selectedGroup];
            dataSelected.forEach(function (d) {
                if (d.name == selectedData) {
                    selectedGrping = d;
                }
            });
            currentPoint = d;
            if (currentPoint != prevPoint) {
                var tooltipval = selectedGrping;
                var zoomLevel = map.getZoom();
                var diff = myZoom.start - zoomLevel;
                //var radiusMultiplier = parseInt($("#poi-by-group-point-size").val());
                //var radius = ((radiusMultiplier * 1000) / zoomLevel);
                //radius = radius + (zoomLevel <= 9 ? 100 : 0);
                //zoomLevel <= 9 ? 450.0 : zoomLevel > 9 ? 350 : 25.0;
               // var circle = new L.Circle([poiData[d].LAT, poiData[d].LNG], {radius: radius}).addTo(map);
                /*var rect = L.rectangle(circle.getBounds(), {
                    color: pointColor,
                    weight: 4,
                    fillOpacity: 1.0
                }).bindPopup("<div  ><table style='width:100%;'><thead><tr><td colspan='3'><strong class='x-value'>" + d + "</strong></td></tr></thead><tbody><tr><td class='key'><strong>Group</strong>: " + selectedGroup + " " + "</td></tr><tr><td class='value'> <strong>Value</strong>: " + tooltipval.value.toLocaleString() + "</td></tr></tbody></table></div>", {
                    minWidth: 130,
                    maxWidth: 250
                });
                //.bindTooltip("<div style='text-align:center'><span style='font-size:'" + d + "</br>" + tooltipval.value + "</div>");

                rect.on('mouseover', function (e) {
                    this.openPopup();
                });
                rect.on('mouseout', function (e) {
                    this.closePopup();
                });
                rect.properties = {};
                rect.properties["NAME"] = d;

                highlightBoxes.push(rect);
*/
                var circleMarker = L.circleMarker(L.latLng(poiData[d].LAT, poiData[d].LNG), circleStyle).bindPopup("<div  ><table style='width:100%;'><thead><tr><td colspan='3'><strong class='x-value'>" + d + "</strong></td></tr></thead><tbody><tr><td class='key'><strong>Group</strong>: " + selectedGroup + " " + "</td></tr><tr><td class='value'> <strong>Value</strong>: " + tooltipval.value.toLocaleString() + "</td></tr></tbody></table></div>", {
                    minWidth: 130,
                    maxWidth: 250
                });
                circleMarker.on('mouseover', function (e) {
                    this.openPopup();
                });
                circleMarker.on('mouseout', function (e) {
                    this.closePopup();
                });
                circleMarker.myData = tooltipval.value;
                circleMarker.properties = {};
                circleMarker.properties["NAME"] = d;
                circleMarkers.push(circleMarker);


                //circle.removeFrom(map);
                prevPoint = currentPoint;
            }
        });
        for (var i = 0; i < highlightBoxes.length; i++) {

            highlightLayer.addLayer(highlightBoxes[i]);
        }

        circlesLayerGroup = L.layerGroup(circleMarkers);
        if (bubblesShowing) {
            circlesLayerGroup.addTo(map);
            updateBubbleColor();
            updateBubbleSize();

        } else {
            map.addLayer(highlightLayer);
        }
    }

    function ColorLuminance(hex, lum) {
        // validate hex string
        hex = String(hex).replace(/[^0-9a-f]/gi, '');
        if (hex.length < 6) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }
        lum = lum || 0;
        // convert to decimal and change luminosity
        var rgb = "#", c, i;
        var noPound = "";
        for (i = 0; i < 3; i++) {
            c = parseInt(hex.substr(i * 2, 2), 16);
            c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
            rgb += ("00" + c).substr(c.length);
            noPound += ("00" + c).substr(c.length);
        }

        return noPound == hex ? ColorLuminance(rgb, -0.5) : rgb;
    }

    function initializeMuchOfUI() {


        $("#poi-by-group-stacked").click(function () {
            extNvd3Chart.stacked(this.checked);
            var test = extNvd3Chart.groupSpacing();
            if (this.checked) {
                extNvd3Chart.groupSpacing(BARSPACING);
            } else {
                extNvd3Chart.groupSpacing(0.2);
            }
            extNvd3Chart.update();
        });
        if(bubblesShowing){
            updateMapUI();
        }


        function updateMapUI() {
           // bubblesShowing = $("#poi-by-group-bubbles").is(":checked");

            console.log('updateBubbles: bubblesShowing=' + bubblesShowing);
            console.log('$("#poi-by-group-bubble-size").prop("disabled"): ' + $("#poi-by-group-bubble-size").prop("disabled"));
            $("#poi-by-group-bubble-color").spectrum(bubblesShowing ? "enable" : "disable", true);

            $("#poi-by-group-bubble-size").prop("disabled", !bubblesShowing);
            console.log('$("#poi-by-group-bubble-size").prop("disabled"): ' + $("#poi-by-group-bubble-size").prop("disabled"));
            if (bubblesShowing) {
                updateBubbleColor();
                updateBubbleSize();
                circlesLayerGroup.addTo(map);
                map.removeLayer(highlightLayer);

            } else {
                map.addLayer(highlightLayer);
                circlesLayerGroup.removeFrom(map);
            }
        }

        $('#poi-by-group-point-size').change(updatePointSize);
        $("#poi-by-group-bubble-size").change(updateBubbleSize);
        $("#poi-by-group-legend-type").click(function () {
            extNvd3Chart.legend.vers(this.checked ? "classic" : "furious");
            extNvd3Chart.update();
        });
        var colorRamps = paletteRamps.on('click', function (d, i) {
            setColorPalette(i);

            //add delay to redrawMap so css has change to updates
            setTimeout(redrawMap, CSS_UPDATE_PAUSE);
        });        //end on click for ramp/palette

        //Logic fr cycling through the maps
        //end
        $("#poi-by-group-current-trip-mode-bubbles").change(function () {
            updateCurrentTripModeOrClassification();
            redrawMap();
        });

        $("#poi-by-group-classification").change(function () {
            //updateCurrentTripModeOrClassification();
            redrawMap();
        });

        $("#poi-by-group-bubble-color").spectrum({
            color: bubbleColor,
            showInput: true,
            className: "full-spectrum",
            showInitial: true,
            showPalette: true,
            showAlpha: true,
            showSelectionPalette: true,
            maxSelectionSize: 10,
            preferredFormat: "hex",
            localStorageKey: "spectrum.demo",
            clickoutFiresChange: true,
            palette: palette,
            // 			change: function (color) {
            // 				//BUG this gets called when user still clicking in color chooser (despite docs) See
            // 				//https://github.com/bgrins/spectrum/issues/289
            // 				console.log("bubble-color spectrum change called with color:" + color);
            // 				bubbleColor = color;
            // 				updateBubbleColor();
            // 			},
            hide: function (color) {
                if (color != bubbleColor) {
                    bubbleColor = color;
                    console.log("bubble-color spectrum hide called with color:" + color);
                    updateBubbleColor();
                }
            },
            //move is called for all color changes within picker
            move: function (color) {
                if (color != bubbleColor) {
                    bubbleColor = color;
                    console.log("bubble-color spectrum move called with color:" + color);
                    updateBubbleColor();
                }
            }
        });

        $("#poi-by-group-point-color").spectrum({
            color: pointColor,
            showInput: true,
            className: "full-spectrum",
            showInitial: true,
            showPalette: true,
            showAlpha: true,
            showSelectionPalette: true,
            maxSelectionSize: 10,
            preferredFormat: "hex",
            localStorageKey: "spectrum.demo",
            clickoutFiresChange: true,
            palette: palette,
            // 			change: function (color) {
            // 				//BUG this gets called when user still clicking in color chooser (despite docs) See
            // 				//https://github.com/bgrins/spectrum/issues/289
            // 				console.log("bubble-color spectrum change called with color:" + color);
            // 				bubbleColor = color;
            // 				updateBubbleColor();
            // 			},
            hide: function (color) {
                if (color != pointColor) {
                    pointColor = color;
                    console.log("point-color spectrum hide called with color:" + color);
                    redrawMap();
                }
            },
            //move is called for all color changes within picker
            move: function (color) {
                if (color != pointColor) {
                    pointColor = color;
                    console.log("point-color spectrum move called with color:" + color);
                    redrawMap();
                }
            }
        });
        //initialize the map palette
        // setColorPalette(selectedColorRampIndex);
        $("#poi-by-group-checkboxes").change(function () {
            redrawMap();
        });
        updateChart(function () {
            console.log('updateChart callback after initialize');
        });
    }

    function setColorPalette(clickedIndex) {
        console.log("DO NOTHING");
    }; //end setColorPalette
    function updateBubbleColor() {
        "use strict";
        var styleObject = {
            "fillColor": bubbleColor
        };
        circleMarkers.forEach(function (circleMarker) {
            circleMarker.setStyle(styleObject);
        });
    }

    function updatePointSize() {
        redrawMap();
    }

    function updatePointColor() {
        "use strict";
        var styleObject = {
            "fillColor": pointColor
        };
        highlightBoxes.forEach(function (highlightBox) {
            highlightBox.setStyle(styleObject);
        });
    }

    function updateBubbleSize() {
        var mapCenter = map.getCenter();
        var eastBound = map.getBounds().getEast();
        var centerEast = L.latLng(mapCenter.lat, eastBound);
        var bubbleMultiplier = parseInt($("#poi-by-group-bubble-size").val());
        var mapBounds = d3.select("#poi-by-group-map").node().getBoundingClientRect();
        var mapRadiusInPixels = mapBounds.width / 2;
        var maxBubbleRadiusInPixels = mapRadiusInPixels / 50;
        var maxBubbleSize = bubbleMultiplier * maxBubbleRadiusInPixels;
        var dataSeries = [];
        var selectedDataName = $('#poi-by-group-values-current').val();
        pointsAll.forEach(function (d) {
            var dataSelected = poiData[d][selectedGroup];
            dataSelected.forEach(function (d) {
                if (d.name == selectedDataName) {
                    dataSeries.push(d.value);
                }
            });
            var serie = new geostats(dataSeries);
            maxFeature = serie.max();
            var scaleSqrt = d3.scale.sqrt().domain([0, maxFeature]).range([0, maxBubbleSize]);
            circleMarkers.forEach(function (circleMarker) {
                var myData = circleMarker.myData;
                var sqrtRadius = 0;
                var quantity = myData;
                var sqrtRadius = scaleSqrt(quantity);

                circleMarker.setRadius(sqrtRadius);
            });
        });
    }

    function updateChartNVD3(callback) {
        "use strict";
        //nvd3 expects data in the opposite hierarchy than rest of code so need to create
        //but can also filter out counties at same time
        //NOTE: ability to enable/disable counties  removed from UI so currently never used.
        var enabledGroups = chartData.filter(function (D) {
            return D;
        });
        var selectedValues = selectedDataGrp;
        var selectedGrp = selectedGroup;

        var hierarchicalData = [];
        groupArry.forEach(function (modeName, modeIndex) {

            var subgroups = [];
            var modeObject = {
                key: modeName,
                values: subgroups
            };
            hierarchicalData.push(modeObject);
            enabledGroups.forEach(function (countyWithModesObject) {
                var simpleModeObject = countyWithModesObject.pointdata[modeName].filter(function (obj) {
                    return obj.name == selectedValues;
                });
                var retrievedModeName = simpleModeObject.pointlabel;
                //if (retrievedModeName != modeName) {
                //	throw ("SOMETHING IS WRONG. Mode is not as expected. Expected mode: " + modeName + ", found modeName: " + retrievedModeName);
                //}
                var simpleCountyObject = {
                    label: countyWithModesObject.pointlabel,
                    value: simpleModeObject[0].value
                }
                subgroups.push(simpleCountyObject);
            });
            //end loop over chartData countyObjects
        });
        //end loop over modes
        //poll every 150ms for up to two seconds waiting for chart
        abmviz_utilities.poll(function () {
            return extNvd3Chart != undefined;
        }, function () {
            svgChart.datum(hierarchicalData).call(extNvd3Chart);
            //create a rectangle over the chart covering the entire y-axis and to the left of x-axis to include county labels
            //first check if
            $('#poi-by-group .nv-x .nv-axis text').not('.nv-axislabel').css('transform', 'rotate(' + ROTATELABEL + 'deg)');
            barsWrap = svgChart.select(".nv-barsWrap.nvd3-svg");
            if (barsWrap[0].length == 0) {
                throw ("did not find expected part of chart")
            }
            //if first time (enter() selection) create rect
            //nv-barsWrap nvd3-svg
            barsWrapRect = barsWrap.selectAll(barsWrapRectSelector).data([barsWrapRectId]).enter().insert("rect", ":first-child").attr("id", barsWrapRectId).attr("x", -marginLeft).attr("fill-opacity", "0.0").on("mousemove", function (event) {
                var mouseY = d3.mouse(this)[1];
                var pointarry = Array.from(new Set(pointSet));
                var numCounties = pointarry.length;
                var heightPerGroup = (barsWrapRectHeight / numCounties);
                var countyIndex = Math.floor(mouseY / heightPerGroup);
                var countyObject = pointarry[countyIndex];
                var newCounty = countyObject;
                changeCurrentCounty(newCounty);
            });
            setTimeout(updateChartMouseoverRect, 1000);
        }, function () {
            throw "something is wrong -- extNvd3Chart still doesn't exist after polling "
        });
        //end call to poll
        console.log("we are at the callback");
        callback();

    }; //end updateChartNVD3
    function updateChartMouseoverRect() {
        var shownTabs = $('li[role="presentation"]').children(":visible");
        if (shownTabs.length == 0 || ($('li[role="presentation"]').children(":visible").length > 1 && $("#thenavbar li.active").text() === "Points of Interest")) {
            var innerContainer = svgChart.select(".nvd3.nv-wrap.nv-multibarHorizontal");
            var innerContainerNode = innerContainer.node();
            var tryAgain = true;
            if (innerContainerNode != undefined) {
                var bounds = innerContainerNode.getBBox();
                var width = bounds.width + marginLeft;
                barsWrapRectHeight = bounds.height;
                if (barsWrapRectHeight > 0) {
                    console.log("barsWrap setting  width=" + width + ", height=" + barsWrapRectHeight);
                    barsWrap.select(barsWrapRectSelector).attr("width", width).attr("height", 20);
                    tryAgain = false;
                }
            }
            //end if innerContainerNode exists
            if (tryAgain) {
                console.log('updateChartMouseoverRect called but innerContainerNode is null so will try again shortly');
                setTimeout(updateChartMouseoverRect, 500);
            }
        }
    }

    //end updateChartMouseoverRect
    function changeCurrentCounty(newCurrentCounty) {
        if (currentCounty != newCurrentCounty) {
            console.log('changing from ' + currentCounty + " to " + newCurrentCounty);
            currentCounty = newCurrentCounty;
            var countyLabels = d3.selectAll(".nvd3.nv-multiBarHorizontalChart .nv-x text ");
            countyLabels.classed("poi-by-group-current-poi", function (d, i) {
                var setClass = d == currentCounty;
                return setClass;
            });
            //end classed of group rect
            if (bubblesShowing) {
                circlesLayerGroup.eachLayer(function (feature) {
                    var style = {};
                    if (feature.properties.NAME == currentCounty) {
                        style.weight = 6;
                        style.fillColor = ColorLuminance(feature.options.fillColor, 0.5);
                         feature.openPopup();
                    } else {
                        style.fillColor = bubbleColor;
                        style.weight = 4;
                        feature.closePopup();
                    }
                    feature.setStyle(style);
                    //return (style);
                });
            } else {
                highlightLayer.eachLayer(function (feature) {
                    var style = {};
                    if (feature.properties.NAME == currentCounty) {
                        style.weight = 6;
                        style.color = ColorLuminance(pointColor, 0.5);
                        feature.openPopup();
                        //style.fillColor ="green";
                    } else {
                        style.color = pointColor;
                        style.weight = 4;
                        feature.closePopup();
                    }
                    feature.setStyle(style);
                    //return (style);
                });
            }
            //end setStyle function
            //add delay to redrawMap so that text has chance to bold
            //setTimeout(redrawMap, CSS_UPDATE_PAUSE);
        }
        //end if county is changing
    }; //end change currentCounty
    function updateOutline() {

        redrawMap();
    }

    //return only the parts that need to be global
    return {
        updateOutline: updateOutline,
    };
}());
