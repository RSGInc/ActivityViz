//encapsulate all code within a IIFE (Immediately-invoked-function-expression) to avoid polluting global namespace
//global object barchart_and_map will contain functions and variables that must be accessible from elsewhere
var barchart_and_map = (function () {
	"use strict";
	var naColor = "White";
	var bubbleColor = 'rgba(255, 120, 0, 0.5)';
	var colors = ["red", "red", "red", "red"];
	//these will be replaced by default palette/ramp colors
	var selectedColorRampIndex = 0;
	var palette = [["rgb(0, 0, 0)", "rgb(67, 67, 67)", "rgb(102, 102, 102)", "rgb(204, 204, 204)", "rgb(217, 217, 217)", "rgb(255, 255, 255)"], ["rgb(152, 0, 0)", "rgb(255, 0, 0)", "rgb(255, 153, 0)", "rgb(255, 255, 0)", "rgb(0, 255, 0)", "rgb(0, 255, 255)", "rgb(74, 134, 232)", "rgb(0, 0, 255)", "rgb(153, 0, 255)", "rgb(255, 0, 255)"], ["rgb(230, 184, 175)", "rgb(244, 204, 204)", "rgb(252, 229, 205)", "rgb(255, 242, 204)", "rgb(217, 234, 211)", "rgb(208, 224, 227)", "rgb(201, 218, 248)", "rgb(207, 226, 243)", "rgb(217, 210, 233)", "rgb(234, 209, 220)", "rgb(221, 126, 107)", "rgb(234, 153, 153)", "rgb(249, 203, 156)", "rgb(255, 229, 153)", "rgb(182, 215, 168)", "rgb(162, 196, 201)", "rgb(164, 194, 244)", "rgb(159, 197, 232)", "rgb(180, 167, 214)", "rgb(213, 166, 189)", "rgb(204, 65, 37)", "rgb(224, 102, 102)", "rgb(246, 178, 107)", "rgb(255, 217, 102)", "rgb(147, 196, 125)", "rgb(118, 165, 175)", "rgb(109, 158, 235)", "rgb(111, 168, 220)", "rgb(142, 124, 195)", "rgb(194, 123, 160)", "rgb(166, 28, 0)", "rgb(204, 0, 0)", "rgb(230, 145, 56)", "rgb(241, 194, 50)", "rgb(106, 168, 79)", "rgb(69, 129, 142)", "rgb(60, 120, 216)", "rgb(61, 133, 198)", "rgb(103, 78, 167)", "rgb(166, 77, 121)", "rgb(91, 15, 0)", "rgb(102, 0, 0)", "rgb(120, 63, 4)", "rgb(127, 96, 0)", "rgb(39, 78, 19)", "rgb(12, 52, 61)", "rgb(28, 69, 135)", "rgb(7, 55, 99)", "rgb(32, 18, 77)", "rgb(76, 17, 48)"]];
	//slider
	var handlers = [25, 50, 75];
	var map;
	var zoneData;
	var dataItems = [];
	var currentCounty = "";
	var modes;
	var circleMarkers;
	var countiesSet;
	var enabledCounties;
	var circlesLayerGroup;
	var chartData = null;
	//use Map instead of vanilla object because wish to preserve insertion order
	var modeData = new Map([]);
	var quantityColumn;
	var countyColumn;
	var zoneColumn;
	var modeColumn;
	var url = "../data/" +abmviz_utilities.GetURLParameter("region")+"/"+ abmviz_utilities.GetURLParameter("scenario") + "/BarChartAndMapData.csv"
	var chartSelector = "#mode-share-by-county-chart";
	var svgChart;
	var extNvd3Chart;
	var minBarWidth = 2;
	var minBarSpacing = 1;
	var marginTop = 0;
	var marginBottom = 50;
	var marginLeft = 110;
	var marginRight = 50;
	var CSS_UPDATE_PAUSE = 150;
	//milliseconds to pause before redrawing map
	var interval;
	var currentCycleModeIndex = 0;
	var cycleGoing = false;
	var breakUp;
	var currentTripMode;
	var bubblesShowing = false;
	var showOutline = false;
	var maxFeature;
	var zoneDataLayer;
	var countyLayer;
	var barsWrap;
	var barsWrapRect;
	var barsWrapRectHeight;
	var barsWrapRectId = "mode-share-by-county-barsWrapRectRSG"
	var barsWrapRectSelector = "#" + barsWrapRectId;
	var paletteRamps = d3.selectAll("#mode-share-by-county .ramp");
	var circleStyle = {
		"stroke": false,
		"fillColor": "set by updateBubbles",
		"fillOpacity": 1.0
	};
	//config file options
	var COUNTY_FILE="";
	var ZONE_FILE_LOC="";
	var CENTER_LOC = [];
	var showChartOnPage = abmviz_utilities.GetURLParameter("visuals").indexOf('b') > -1;
	$("#scenario-header").html("Scenario " + abmviz_utilities.GetURLParameter("scenario"));
	//start off chain of initialization by reading in the data	
	function readInDataCallback() {
		createMap(function () {
			console.log("createMap callback")
		});
		setDataSpecificDOM();
		svgChart = d3.select(chartSelector);
		updateCurrentTripModeOrClassification();
		createEmptyChart();
		initializeMuchOfUI();
	}; //end readInDataCallback
	//start off chain of initialization by reading in the data	
	readInData(readInDataCallback);

	function redrawMap() {
		"use strict";
		zoneDataLayer.setStyle(styleZoneGeoJSONLayer);
	}

	function readInData(callback) {
		"use strict";
		if(showChartOnPage) {
            $.getJSON("../data/" + abmviz_utilities.GetURLParameter("region") + "/" + "config.json", function (data) {
                $.each(data, function (key, val) {
                    if (key == "CountyFile")
                        COUNTY_FILE = val;
                    if (key == "ZoneFile")
                        ZONE_FILE_LOC = val;
                    if(key =="CenterMap")
                    	CENTER_LOC = val;
                });
            });
            d3.csv(url, function (error, data) {
                "use strict";
                if (error)
                    throw error;

                //expected data should have columns similar to: ZONE,COUNTY,TRIP_MODE_NAME,QUANTITY
                var headers = d3.keys(data[0]);
                zoneColumn = headers[0];
                countyColumn = headers[1];
                modeColumn = headers[2];
                quantityColumn = headers[3];
                var rawChartData = new Map([]);
                //run through data. Filter out 'total' pseudo-mode, convert quantity to int, create zoneData
                zoneData = {};
                countiesSet = new Set();
                data.forEach(function (d) {
                    var modeName = d[modeColumn];
                    var keepThisObject = modeName != "TOTAL";
                    if (keepThisObject) {
                        var zoneName = d[zoneColumn];
                        var countyName = d[countyColumn];
                        var quantity = parseInt(d[quantityColumn]);
                        if (zoneData[zoneName] == undefined) {
                            zoneData[zoneName] = {};
                        }
                        zoneData[zoneName][modeName] = {
                            COUNTY: countyName,
                            QUANTITY: quantity
                        };
                        if (rawChartData[countyName] == undefined) {
                            rawChartData[countyName] = {};
                            countiesSet.add(countyName);
                        }
                        if (rawChartData[countyName][modeName] == undefined) {
                            rawChartData[countyName][modeName] = 0;
                            //keep track of counts for each mode
                            //don't actually care about counts but this also implicitly keeps a list of all modes
                            //in the order they were encountered because properties are ordered
                            if (modeData[modeName] == undefined) {
                                modeData[modeName] = {
                                    enabled: true,
                                    serie: []
                                };
                            }
                        }
                        modeData[modeName].serie.push(quantity);
                        rawChartData[countyName][modeName] += quantity;
                    }
                    //end if keeping this object
                    return keepThisObject;
                });
                //end filtering and other data prep
                modes = Object.keys(modeData);
                data = null;
                //allow GC to reclaim memory
                //need to run through rawChartData and put modes in order and insert ones that are missing
                chartData = [];
                countiesSet.forEach(function (countyName) {
                    var rawCountyObject = rawChartData[countyName];
                    var newCountyObject = {
                        groupLabel: countyName,
                        subgroups: [],
                        enabled: true
                    };
                    chartData.push(newCountyObject);
                    modes.forEach(function (modeName) {
                        var countyModeTotalQuantity = rawCountyObject[modeName];
                        if (countyModeTotalQuantity == undefined) {
                            countyModeTotalQuantity = 0;
                        }
                        newCountyObject.subgroups.push({
                            subgroupLabel: modeName,
                            value: countyModeTotalQuantity
                        });
                    });
                    //end modes foreach
                });
                //end countiesSet forEach
                rawChartData = null;
                //allow GC to reclaim memory
                callback();
            });
            //end d3.csv
        }
	}; //end readInData
	function setDataSpecificDOM() {
		d3.selectAll(".mode-share-by-county-area-type").html(countyColumn);
		d3.selectAll(".mode-share-by-county-trip-mode").html(modeColumn);
		d3.selectAll(".mode-share-by-county-trip-mode-example").html(modes[0]);
		modes.forEach(function (modeName) {
			$("#mode-share-by-county-current-trip-mode").append("<option>" + modeName + "</option>");
		});
		// 		chartData.forEach(function (chartObject) {
		// 			$("#mode-share-by-county-chart-selection").append("<option>" + chartObject.groupLabel + "</option>");
		// 		});
		// 		$("#mode-share-by-county-chart-selection").chosen();
	}
	//end setDataSpecificDOM
	function updateChart(callback) {
		"use strict";
		updateChartNVD3(callback);
	}

	function updateChartNVD3(callback) {
		"use strict";
		//nvd3 expects data in the opposite hierarchy than rest of code so need to create
		//but can also filter out counties at same time
		//NOTE: ability to enable/disable counties  removed from UI so currently never used.
		enabledCounties = chartData.filter(function (countyObject) {
			return countyObject.enabled;
		})
		var hierarchicalData = [];
		modes.forEach(function (modeName, modeIndex) {
			var subgroups = [];
			var modeObject = {
				key: modeName,
				values: subgroups
			};
			hierarchicalData.push(modeObject);
			enabledCounties.forEach(function (countyWithModesObject) {
				var simpleModeObject = countyWithModesObject.subgroups[modeIndex];
				var retrievedModeName = simpleModeObject.subgroupLabel;
				if (retrievedModeName != modeName) {
					throw ("SOMETHING IS WRONG. Mode is not as expected. Expected mode: " + modeName + ", found modeName: " + retrievedModeName);
				}
				var simpleCountyObject = {
					label: countyWithModesObject.groupLabel,
					value: simpleModeObject.value
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
			barsWrap = svgChart.select(".nv-barsWrap.nvd3-svg");
			if (barsWrap[0].length == 0) {
				throw ("did not find expected part of chart")
			}
			//if first time (enter() selection) create rect
			//nv-barsWrap nvd3-svg
			barsWrapRect = barsWrap.selectAll(barsWrapRectSelector).data([barsWrapRectId]).enter().insert("rect", ":first-child").attr("id", barsWrapRectId).attr("x", -marginLeft).attr("fill-opacity", "0.0").on("mousemove", function (event) {
				//console.log('barsWrap mousemove');
				var mouseY = d3.mouse(this)[1];
				var numCounties = enabledCounties.length;
				var heightPerGroup = barsWrapRectHeight / numCounties;
				var countyIndex = Math.floor(mouseY / heightPerGroup);
				var countyObject = enabledCounties[countyIndex];
				var newCounty = countyObject.groupLabel;
				changeCurrentCounty(newCounty);
			});
			setTimeout(updateChartMouseoverRect, 1000);
		}, function () {
			throw "something is wrong -- extNvd3Chart still doesn't exist after polling "
		});
		//end call to poll
		callback();
	}; //end updateChartNVD3
	function updateChartMouseoverRect() {
		var innerContainer = svgChart.select(".nvd3.nv-wrap.nv-multibarHorizontal");
		var innerContainerNode = innerContainer.node();
		var tryAgain = true;
		if (innerContainerNode != undefined) {
			var bounds = innerContainerNode.getBBox();
			var width = bounds.width + marginLeft;
			barsWrapRectHeight = bounds.height;
			if (barsWrapRectHeight > 0) {
				console.log("barsWrap setting  width=" + width + ", height=" + barsWrapRectHeight);
				barsWrap.select(barsWrapRectSelector).attr("width", width).attr("height", barsWrapRectHeight);
				tryAgain = false;
			}
		}
		//end if innerContainerNode exists
		if (tryAgain) {
			console.log('updateChartMouseoverRect called but innerContainerNode is null so will try again shortly');
			setTimeout(updateChartMouseoverRect, 500);
		}
	}
	//end updateChartMouseoverRect
	function changeCurrentCounty(newCurrentCounty) {
		if (currentCounty != newCurrentCounty) {
			console.log('changing from ' + currentCounty + " to " + newCurrentCounty);
			currentCounty = newCurrentCounty;
			var countyLabels = d3.selectAll(".nvd3.nv-multiBarHorizontalChart .nv-x text ");
			countyLabels.classed("mode-share-by-county-trip-mode-current-county", function (d, i) {
				var setClass = d == currentCounty;
				return setClass;
			});
			//end classed of group rect
			countyLayer.setStyle(function (feature) {
				var style = {};
				if (feature.properties.NAME == currentCounty) {
					style.weight = 4;
				} else {
					style.weight = 1;
				}
				return (style);
			});
			//end setStyle function
			//add delay to redrawMap so that text has chance to bold
			setTimeout(redrawMap, CSS_UPDATE_PAUSE);
		}
		//end if county is changing
	}; //end change currentCounty
	function createEmptyChart() {
		nv.addGraph({
			generate: function chartGenerator() {
					//console.log('chartGenerator being called. nvd3Chart=' + nvd3Chart);
					var colorScale = d3.scale.category20();
					var nvd3Chart = nv.models.multiBarHorizontalChart();
					//console.log('chartGenerator being called. nvd3Chart set to:' + nvd3Chart);
					nvd3Chart.x(function (d, i) {
						return d.label
					}).y(function (d) {
						return d.value
					}).color(function (d, i) {
						var color = colorScale(i);
						//console.log('barColor i=' + i + ' modeColorIndex=' + modeColorIndex + ' mode=' + d.key + ' county=' + d.label + ' count=' + d.value + ' color=' + color);
						return color;
					}).duration(250).margin({
						left: marginLeft,
						right: marginRight,
						top: marginTop,
						bottom: marginBottom
					}).id("mode-share-by-county-multiBarHorizontalChart").stacked(true).showControls(false);
					nvd3Chart.yAxis.tickFormat(d3.format(',.2f'));
					nvd3Chart.yAxis.axisLabel(quantityColumn);
					//this is actually for xAxis since basically a sideways column chart
					nvd3Chart.xAxis.axisLabel(countyColumn).axisLabelDistance(30);
					//this is actually for yAxis
					nv.utils.windowResize(function () {
						//reset marginTop in case legend has gotten less tall
						nvd3Chart.margin({
							top: marginTop
						});
						updateChart(function () {
							console.log('updateChart callback after windowResize');
						});
					});
					nvd3Chart.legend.dispatch.on('legendDblclick', function (event) {
						var newTripMode = event.key;
						console.log('legend legendDblclick on trip mode: ' + newTripMode);
						$('#mode-share-by-county-current-trip-mode').val(newTripMode);
						updateCurrentTripModeOrClassification();
						redrawMap();
					});
					nvd3Chart.multibar.dispatch.on("elementMouseover", function (d, i) {
						var countyUnderMouse = d.value;
						changeCurrentCounty(countyUnderMouse);
					});
					//furious has colored boxes with checkmarks
					//nvd3Chart.legend.vers('furious');
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
	}; //end createEmptyChart
	function styleZoneGeoJSONLayer(feature) {
		var color = naColor;
		if (feature.zoneData != undefined) {
			var zoneDataFeature = feature.zoneData[currentTripMode];
			//possible that even if data for zone exists, could be missing this particular trip mode
			if (zoneDataFeature != undefined) {
				var quantity = zoneDataFeature.QUANTITY;
				if (zoneDataFeature.QUANTITY == undefined) {
					throw ("Something is wrong. zoneDataFeature.QUANTITY is undefined. " + JSON.stringify(zoneDataFeature));
				}
				if (quantity >= breakUp[3]) {
					color = colors[3];
				} else if (quantity >= breakUp[2]) {
					color = colors[2];
				} else if (quantity >= breakUp[1]) {
					color = colors[1];
				} else {
					color = colors[0];
				}
			}
			//end if we have data for this trip mode
		}
		//end if we have data for this zone
		//the allowed options are described here: http://leafletjs.com/reference.html#path-options
		var returnStyle = {
			//all SVG styles allowed
			fillColor: color,
			fillOpacity: 0.3,
			weight: 1,
			color: "darkGrey",
			strokeOpacity: 0.05,
			stroke: showOutline
		};
		return (returnStyle);
	}
	//end styleZoneGeoJSONLayer function
	function styleCountyGeoJSONLayer(feature) {
		var returnStyle = {
			//all SVG styles allowed
			fill: true,
			fillOpacity: 0.0,
			stroke: true,
			weight: 1,
			strokeOpacity: 0.25,
			color: "gray"
		};
		return (returnStyle);
	}
	//end styleCountyGeoJSONLayer function
	function createMap(callback) {
		//var latlngcenter = JSON.parse(CENTER_LOC);
		//var lat=latlngcenter[0];
		//var lng=latlngcenter[1];
		map = L.map("mode-share-by-county-map").setView(CENTER_LOC, 12);
		//centered at Atlanta
		map.on('zoomend', function (type, target) {
			var zoomLevel = map.getZoom();
			var zoomScale = map.getZoomScale();
			console.log('zoomLevel: ', zoomLevel, ' zoomScale: ', zoomScale);
		});
		$.getJSON("../data/"+abmviz_utilities.GetURLParameter("region")+"/"+ZONE_FILE_LOC, function (zoneTiles) {
			"use strict";
			//there should be at least as many zones as the number we have data for.
			if (zoneTiles.features.length < Object.keys(zoneData).length) {
				throw ("Something is wrong! zoneTiles.features.length(" + zoneTiles.features.length + ") < Object.keys(zoneData).length(" + Object.keys(zoneData).length + ").");
			}
			circleMarkers = [];
			//create circle markers for each zone centroid
			for (var i = 0; i < zoneTiles.features.length; i++) {
				var feature = zoneTiles.features[i];
				var featureZoneData = zoneData[feature.properties.id];
				if (featureZoneData == undefined) { //missing data for this zone
				} else {
					//WARNING: center coordinates seem to have lat and lng reversed!
					var centroid = L.latLngBounds(feature.geometry.coordinates[0]).getCenter();
					//REORDER lat and lng
					var circleMarker = L.circleMarker(L.latLng(centroid.lng, centroid.lat), circleStyle);
					circleMarker.zoneData = featureZoneData;
					feature.zoneData = featureZoneData;
					circleMarkers.push(circleMarker);
				}
			}
			circlesLayerGroup = L.layerGroup(circleMarkers);
			//http://leafletjs.com/reference.html#tilelayer
			zoneDataLayer = L.geoJson(zoneTiles, {
				updateWhenIdle: true,
				unloadInvisibleFiles: true,
				reuseTiles: true,
				opacity: 1.0,
				style: styleZoneGeoJSONLayer
			});
			//var stamenTileLayer = new L.StamenTileLayer("toner-lite"); //B&W stylized background map
			//map.addLayer(stamenTileLayer);
			var underlyingMapLayer = L.tileLayer('//stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}.png', {
				updateWhenIdle: true,
				unloadInvisibleFiles: true,
				reuseTiles: true,
				opacity: 1.0
			});
			underlyingMapLayer.addTo(map);
			$.getJSON("../data/"+ abmviz_utilities.GetURLParameter("region") +"/"+COUNTY_FILE, function (countyTiles) {
				"use strict";
				console.log(COUNTY_FILE+" success");
				//http://leafletjs.com/reference.html#tilelayer
				countyLayer = L.geoJson(countyTiles, {
					//keep only counties that we have data for
					filter: function (feature) {
					    console.log(feature.properties.NAME);
					    console.log( countiesSet.has(feature.properties.NAME));
						return countiesSet.has(feature.properties.NAME);
					},
					updateWhenIdle: true,
					unloadInvisibleFiles: true,
					reuseTiles: true,
					opacity: 1.0,
					style: styleCountyGeoJSONLayer,
					onEachFeature: onEachCounty
				});
				var allCountyBounds = countyLayer.getBounds();
				console.log(allCountyBounds);
				map.fitBounds(allCountyBounds);
				zoneDataLayer.addTo(map);
				countyLayer.addTo(map);
			}).success(function () {
				console.log(COUNTY_FILE+" second success");
			}).error(function (jqXHR, textStatus, errorThrown) {
				console.log(COUNTY_FILE+" textStatus " + textStatus);
				console.log(COUNTY_FILE+" errorThrown" + errorThrown);
				console.log(COUNTY_FILE+ " responseText (incoming?)" + jqXHR.responseText);
			}).complete(function () {
				console.log(COUNTY_FILE+" complete");
			});
			//end geoJson of county layer
			function onEachCounty(feature, layer) {
				layer.on({
					mouseover: mouseoverCounty
				});
			}
			//end on each County
			function mouseoverCounty(e) {
				var layer = e.target;
				changeCurrentCounty(layer.feature.properties.NAME);
			}
		});
		//end geoJson of zone layer
	}; //end createMap
	function updateColors(values, themax) {
		"use strict";
		var colorStops = colors[0] + ", ";
		// start left with the first color
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
		} else if (navigator.userAgent.toLowerCase().indexOf('chrome') > -1 || navigator.userAgent.toLowerCase().indexOf('safari') > -1) {
			// Safari 5.1, Chrome 10+
			css = '-webkit-linear-gradient(left,' + colorStops + ')';
		} else {
			//ie
			css = '-ms-linear-gradient(left,' + colorStops + ')';
		}
		$('#mode-share-by-county-slider').css('background-image', css);
	}

	function setColorPalette(clickedIndex) {
		selectedColorRampIndex = clickedIndex;
		var currentPalette = paletteRamps[0][selectedColorRampIndex];
		var rects = d3.select(currentPalette).selectAll("rect");
		rects.each(function (d, i) {
			var paletteColor = d3.rgb(d3.select(this).attr("fill"));
			colors[i] = paletteColor;
		});
		d3.selectAll("#mode-share-by-county .ramp").classed("selected", function (d, tempColorRampIndex) {
			return tempColorRampIndex == selectedColorRampIndex;
		});
	}; //end setColorPalette
	function initializeMuchOfUI() {
		$("#mode-share-by-county-stacked").click(function () {
			extNvd3Chart.stacked(this.checked);
			extNvd3Chart.update();
		});
		$("#mode-share-by-county-bubbles").click(function () {
			bubblesShowing = $("#mode-share-by-county-bubbles").is(":checked");
			console.log('updateBubbles: bubblesShowing=' + bubblesShowing);
			console.log('$("#mode-share-by-county-bubble-size").prop("disabled"): ' + $("#mode-share-by-county-bubble-size").prop("disabled"));
			$("#mode-share-by-county-bubble-color").spectrum(bubblesShowing ? "enable" : "disable", true);
			//$("#mode-share-by-county-bubble-color").spectrum("disable", !bubblesShowing);
			$("#mode-share-by-county-bubble-size").prop("disabled", !bubblesShowing);
			console.log('$("#mode-share-by-county-bubble-size").prop("disabled"): ' + $("#mode-share-by-county-bubble-size").prop("disabled"));
			if (bubblesShowing) {
				updateBubbleColor();
				updateBubbleSize();
				circlesLayerGroup.addTo(map);
			} else {
				circlesLayerGroup.removeFrom(map);
			}
		});
		$("#mode-share-by-county-bubble-size").change(updateBubbleSize);
		$("#mode-share-by-county-legend-type").click(function () {
			extNvd3Chart.legend.vers(this.checked ? "classic" : "furious");
			extNvd3Chart.update();
		});
		var colorRamps = paletteRamps.on('click', function (d, i) {
			setColorPalette(i);
			updateColors($("#mode-share-by-county-slider").slider("values"));
			//add delay to redrawMap so css has change to updates
			setTimeout(redrawMap, CSS_UPDATE_PAUSE);
		});
		//end on click for ramp/palette
		if ($("#mode-share-by-county-classification").val() == "custom") {
			$("#mode-share-by-county-update-map").css("display", "inline");
		}; //Logic for cycling through the maps
		$("#mode-share-by-county-start-cycle-map").click(function () {
			$("#mode-share-by-county-stop-cycle-map").css("display", "inline");
			$("#mode-share-by-county-start-cycle-map").css("display", "none");
			cycleGoing = true;
			currentCycleModeIndex = 0;
			cycleTripMode();
		});
		$("#mode-share-by-county-stop-cycle-map").click(function () {
			cycleGoing = false;
			$("#mode-share-by-county-stop-cycle-map").css("display", "none");
			$("#mode-share-by-county-start-cycle-map").css("display", "inline");
		});

		function cycleTripMode() {
			var newTripMode = modes[currentCycleModeIndex];
			$('#mode-share-by-county-current-trip-mode').val(newTripMode);
			updateCurrentTripModeOrClassification();
			redrawMap();
			currentCycleModeIndex++;
			if (currentCycleModeIndex >= $("#mode-share-by-county-current-trip-mode option").size()) {
				currentCycleModeIndex = 0;
			}
			if (cycleGoing) {
				var timeInterval = parseInt($("#mode-share-by-county-cycle-frequency").val()) * 1000;
				setTimeout(cycleTripMode, timeInterval);
			}
			//end if cycleGoing
		}
		//end cycleTripMode
		$("#mode-share-by-county-cycle-frequency").change(function () { //no need to do anything since cycleTripMode always reads the current #cycle-frequency
		});
		$("#mode-share-by-county-update-map").click(function () {
			var sliderValues = $("#mode-share-by-county-slider").slider("values");
			breakUp[1] = sliderValues[0];
			breakUp[2] = sliderValues[1];
			breakUp[3] = sliderValues[2];
			redrawMap();
		});
		//value slider
		$("#mode-share-by-county-slider").slider({
			range: false,
			disabled: ($("#mode-share-by-county-classification").val() != "custom"),
			min: 0,
			max: 100,
			values: handlers,
			create: function (event, ui) {
				console.log("Slider created")
				$('#mode-share-by-county .ui-slider-handle:first').html('<div class="tooltip top slider-tip"><div class="tooltip-arrow"></div><div class="tooltip-inner">' + handlers[0] + '</div></div>');
				$('#mode-share-by-county .ui-slider-handle:eq(1)').html('<div class="tooltip top slider-tip"><div class="tooltip-arrow"></div><div class="tooltip-inner">' + handlers[1] + '</div></div>');
				$('#mode-share-by-county .ui-slider-handle:last').html('<div class="tooltip top slider-tip"><div class="tooltip-arrow"></div><div class="tooltip-inner">' + handlers[2] + '</div></div>');
			},
			slide: function (event, ui) {
				var themax = $("#mode-share-by-county-slider").slider("option", "max");
				updateColors(ui.values, themax);
				$('#mode-share-by-county .ui-slider-handle:first').html('<div class="tooltip top slider-tip"><div class="tooltip-arrow"></div><div class="tooltip-inner">' + ui.values[0] + '</div></div>');
				$('#mode-share-by-county .ui-slider-handle:eq(1)').html('<div class="tooltip top slider-tip"><div class="tooltip-arrow"></div><div class="tooltip-inner">' + ui.values[1] + '</div></div>');
				$('#mode-share-by-county .ui-slider-handle:last').html('<div class="tooltip top slider-tip"><div class="tooltip-arrow"></div><div class="tooltip-inner">' + ui.values[2] + '</div></div>');
			}
		});
		updateColors(handlers, $("#mode-share-by-county-slider").slider("option", "max"));
		$("#mode-share-by-county-current-trip-mode").change(function () {
			updateCurrentTripModeOrClassification();
			redrawMap();
		});
		$("#mode-share-by-county-classification").change(function () {
			updateCurrentTripModeOrClassification();
			redrawMap();
		});
		$("#mode-share-by-county-naColor").spectrum({
			color: naColor,
			showInput: true,
			className: "full-spectrum",
			showInitial: false,
			showPalette: true,
			showAlpha: true,
			showSelectionPalette: true,
			maxSelectionSize: 10,
			preferredFormat: "hex",
			localStorageKey: "spectrum.demo",
			palette: palette,
			change: function (color) {
				naColor = color;
				redrawMap();
				updateColors($("#mode-share-by-county-slider").slider("values"));
			}
		});
		$("#mode-share-by-county-bubble-color").spectrum({
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
		//initialize the map palette
		setColorPalette(selectedColorRampIndex);
	}
	//end initialize much of ui
	//hex to rgb for handling transparancy
	function hexToRgb(hex) {
		"use strict";
		var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
		hex = hex.replace(shorthandRegex, function (m, r, g, b) {
			return r + r + g + g + b + b;
		});
		var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result ? {
			r: parseInt(result[1], 16),
			g: parseInt(result[2], 16),
			b: parseInt(result[3], 16)
		} : undefined;
	}

	function updateBubbleColor() {
		"use strict";
		var styleObject = {
			"fillColor": bubbleColor
		};
		circleMarkers.forEach(function (circleMarker) {
			circleMarker.setStyle(styleObject);
		});
	}

	function updateBubbleSize() {
		var mapCenter = map.getCenter();
		var eastBound = map.getBounds().getEast();
		var centerEast = L.latLng(mapCenter.lat, eastBound);
		var bubbleMultiplier = parseInt($("#mode-share-by-county-bubble-size").val());
		var mapBounds = d3.select("#mode-share-by-county-map").node().getBoundingClientRect();
		var mapRadiusInPixels = mapBounds.width / 2;
		var maxBubbleRadiusInPixels = mapRadiusInPixels / 50;
		var maxBubbleSize = bubbleMultiplier * maxBubbleRadiusInPixels;
		var scaleSqrt = d3.scale.sqrt().domain([0, maxFeature]).range([0, maxBubbleSize]);
		circleMarkers.forEach(function (circleMarker) {
			var zoneData = circleMarker.zoneData;
			var zoneTripData = zoneData[currentTripMode];
			var sqrtRadius = 0;
			if (zoneTripData != undefined) {
				var quantity = zoneTripData.QUANTITY;
				var sqrtRadius = scaleSqrt(quantity);
			}
			circleMarker.setRadius(sqrtRadius);
		});
	}

	function updateCurrentTripModeOrClassification() {
		"use strict";
		currentTripMode = $('#mode-share-by-county-current-trip-mode').val();
		var startTime = Date.now();
		console.log('updateCurrentTripModeOrClassification: #current-trip-mode.val()=' + currentTripMode);
		var serie = new geostats(modeData[currentTripMode].serie);
		maxFeature = serie.max();
		//handle the different classifications
		var classification = $("#mode-share-by-county-classification").val();
		$("#mode-share-by-county-slider").slider({
			range: false,
			disabled: ($("#mode-share-by-county-classification").val() != "custom")
		});
		if (classification == "custom") {
			$("#mode-share-by-county-update-map").css("display", "inline");
		} else {
			$("#mode-share-by-county-update-map").css("display", "none");
			if (classification == "even-interval") {
				breakUp = serie.getClassEqInterval(4);
			} else if (classification == "quartiles") {
				breakUp = serie.getClassQuantile(4);
			} else if (classification == "jenks") {
				breakUp = serie.getClassJenks(4);
			} else {
				throw ("Unhandled classification: " + classification);
			}
			var newValues = [parseInt(breakUp[1]), parseInt(breakUp[2]), parseInt(breakUp[3])];
			//update the slider
			$("#mode-share-by-county-slider").slider({
				min: breakUp[0],
				max: breakUp[4],
				values: newValues,
				start: function (event, ui) {
					$('#mode-share-by-county .ui-slider-handle:first').html('<div class="tooltip top slider-tip"><div class="tooltip-arrow"></div><div class="tooltip-inner">' + newValues[0] + '</div></div>');
					$('#mode-share-by-county .ui-slider-handle:eq(1)').html('<div class="tooltip top slider-tip"><div class="tooltip-arrow"></div><div class="tooltip-inner">' + newValues[1] + '</div></div>');
					$('#mode-share-by-county .ui-slider-handle:last').html('<div class="tooltip top slider-tip"><div class="tooltip-arrow"></div><div class="tooltip-inner">' + newValues[2] + '</div></div>');
				}
			});
			updateColors(newValues, breakUp[4]);
			if (bubblesShowing) {
				updateBubbleSize();
			}
		}
		//end if !custom
	}; //end updateCurrentTripModeOrClassification
	function updateOutline() {
		showOutline = ($("#mode-share-by-county-stroke").is(":checked"));
		redrawMap();
	}
	//return only the parts that need to be global
	return {
		updateOutline: updateOutline,
	};
}());
//end encapsulating IIFE
