//encapsulate all code within a IIFE (Immediately-invoked-function-expression) to avoid polluting global namespace
//global object three3d_map will contain functions and variables that must be accessible from elsewhere
var three3d = (function () {
	"use strict";
	var colors = ["red", "red", "red", "red"]; //these will be replaced by default palette/ramp colors
	var selectedColorRampIndex = 0;
	//slider
	var handlers = [25, 50, 75];
	var map;
	var zoneData;
	var dataItems = [];
	var periods;
	var quantityColumn;
	var zoneColumn;
	var periodColumn;
	var url = "../data/" + abmviz_utilities.GetURLParameter("scenario") + "/3DAnimatedMapData.csv"
	var interval;
	var currentCyclePeriodIndex = 0;
	var cycleGoing = false;
	var currentPeriod;
	var zoneDataLayer;
	var periodLayer;

	function redrawMap() {
		"use strict";
		zoneDataLayer.setStyle(styleZoneGeoJSONLayer);
	}

	function readInData(callback) {
		"use strict";
		d3.csv(url, function (error, data) {
			"use strict";
			if (error) throw error; //expected data should have columns similar to: ZONE,PERIOD,TRIP_MODE_NAME,QUANTITY
			var headers = d3.keys(data[0]);
			zoneColumn = headers[0];
			periodColumn = headers[1];
			quantityColumn = headers[2];
			var rawChartData = new Map([]);
			//run through data. Filter out 'total' pseudo-period, convert quantity to int, create zoneData
			zoneData = {};
			counties = [];
			data.forEach(function (d) {
				var periodName = d[periodColumn];
				var keepThisObject = periodName != "TOTAL";
				if (keepThisObject) {
					var zoneName = d[zoneColumn];
					var periodName = d[periodColumn];
					var quantity = parseInt(d[quantityColumn]);
					if (zoneData[zoneName] == undefined) {
						zoneData[zoneName] = {};
					}
					zoneData[zoneName][periodName] = {
						PERIOD: periodName
						, QUANTITY: quantity
					};
					if (rawChartData[periodName] == undefined) {
						rawChartData[periodName] = {};
						counties.push(periodName);
					}
					if (rawChartData[periodName][periodName] == undefined) {
						rawChartData[periodName][periodName] = 0;
						//keep track of counts for each period
						//don't actually care about counts but this also implicitly keeps a list of all periods
						//in the order they were encountered because properties are ordered
						if (periodData[periodName] == undefined) {
							periodData[periodName] = {
								enabled: true
								, serie: []
							};
						}
					}
					periodData[periodName].serie.push(quantity);
					rawChartData[periodName][periodName] += quantity;
				} //end if keeping this object
				return keepThisObject;
			}); //end filtering and other data prep
			countiesSet = new Set(counties);
			periods = Object.keys(periodData);
			data = null; //allow GC to reclaim memory
			//need to run through rawChartData and put periods in order and insert ones that are missing
			chartData = [];
			counties.forEach(function (periodName) {
				var rawPeriodObject = rawChartData[periodName];
				var newPeriodObject = {
					groupLabel: periodName
					, subgroups: []
					, enabled: true
				};
				chartData.push(newPeriodObject);
				periods.forEach(function (periodName) {
					var periodPeriodTotalQuantity = rawPeriodObject[periodName];
					if (periodPeriodTotalQuantity == undefined) {
						periodPeriodTotalQuantity = 0;
					}
					newPeriodObject.subgroups.push({
						subgroupLabel: periodName
						, value: periodPeriodTotalQuantity
					});
				}); //end periods foreach
			}); //end counties forEach
			rawChartData = null; //allow GC to reclaim memory
			callback();
		}); //end d3.csv
	}; //end readInData
	console.log("About to hold ready");
	$.holdReady(true); //prevent ready event to fire
	readInData(function () {
		console.log("Finished loading data");
		$.holdReady(false); //allow ready event to fire}
	});

	function setDataSpecificDOM() {
		$("#attribute-label").html(periodColumn);
		d3.selectAll(".area-type").html(periodColumn);
		d3.selectAll(".trip-period").html(periodColumn);
		d3.selectAll(".trip-period-example").html(periods[0]);
		periods.forEach(function (periodName) {
			$("#current-trip-period").append("<option>" + periodName + "</option>");
		});
		// 		chartData.forEach(function (chartObject) {
		// 			$("#chart-selection").append("<option>" + chartObject.groupLabel + "</option>");
		// 		});
		// 		$("#chart-selection").chosen();
	} //end setDataSpecificDOM
	function updateChart(callback) {
		"use strict";
		updateChartNVD3(callback);
	}

	function updateChartNVD3(callback) {
		"use strict";
		//nvd3 expects data in the opposite hierarchy than rest of code so need to create
		//but can also filter out counties at same time
		//NOTE: ability to enable/disable counties  removed from UI so currently never used.
		enabledCounties = chartData.filter(function (periodObject) {
			return periodObject.enabled;
		})
		var hierarchicalData = [];
		periods.forEach(function (periodName, periodIndex) {
			var subgroups = [];
			var periodObject = {
				key: periodName
				, values: subgroups
			};
			hierarchicalData.push(periodObject);
			enabledCounties.forEach(function (periodWithPeriodsObject) {
				var simplePeriodObject = periodWithPeriodsObject.subgroups[periodIndex];
				var retrievedPeriodName = simplePeriodObject.subgroupLabel;
				if (retrievedPeriodName != periodName) {
					throw ("SOMETHING IS WRONG. Period is not as expected. Expected period: " + periodName + ", found periodName: " + retrievedPeriodName);
				}
				var simplePeriodObject = {
					label: periodWithPeriodsObject.groupLabel
					, value: simplePeriodObject.value
				}
				subgroups.push(simplePeriodObject);
			}); //end loop over chartData periodObjects
		}); //end loop over periods
		//poll every 150ms for up to two seconds waiting for chart
		abmviz_utilities.poll(function () {
			return extNvd3Chart != undefined;
		}, function () {
			svgElement.datum(hierarchicalData).call(extNvd3Chart);
			//create a rectangle over the chart covering the entire y-axis and to the left of x-axis to include period labels
			//first check if
			var chartOuterSelector = ".nv-barsWrap.nvd3-svg";
			barsWrap = d3.select(chartOuterSelector);
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
				var periodIndex = Math.floor(mouseY / heightPerGroup);
				var periodObject = enabledCounties[periodIndex];
				var newPeriod = periodObject.groupLabel;
				changeCurrentPeriod(newPeriod);
			});
			setTimeout(updateChartMouseoverRect, 1000);
		}, function () {
			throw "something is wrong -- extNvd3Chart still doesn't exist after polling "
		}); //end call to poll
		callback();
	}; //end updateChartNVD3
	function updateChartMouseoverRect() {
		var innerContainer = d3.select(".nvd3.nv-wrap.nv-multibarHorizontal");
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
		} //end if innerContainerNode exists
		if (tryAgain) {
			console.log('updateChartMouseoverRect called but innerContainerNode is null so will try again shortly');
			setTimeout(updateChartMouseoverRect, 500);
		}
	} //end updateChartMouseoverRect
	function changeCurrentPeriod(newCurrentPeriod) {
		if (currentPeriod != newCurrentPeriod) {
			console.log('changing from ' + currentPeriod + " to " + newCurrentPeriod);
			currentPeriod = newCurrentPeriod;
			var periodLabels = d3.selectAll(".nvd3.nv-multiBarHorizontalChart .nv-x text ");
			periodLabels.classed("current-period", function (d, i) {
				var setClass = d == currentPeriod;
				return setClass;
			}); //end classed of group rect
			periodLayer.setStyle(function (feature) {
				var style = {};
				if (feature.properties.NAME == currentPeriod) {
					style.weight = 4;
				}
				else {
					style.weight = 1;
				}
				return (style);
			}); //end setStyle function
			//add delay to redrawMap so that text has chance to bold
			setTimeout(redrawMap, CSS_UPDATE_PAUSE);
		} //end if period is changing
	}; //end change currentPeriod
	function createEmptyChart() {
		nv.addGraph({
			generate: function chartGenerator() {
					//console.log('chartGenerator being called. nvd3Chart=' + nvd3Chart);
					var colorScale = d3.scale.category20();
					var nvd3Chart = nv.periodls.multiBarHorizontalChart();
					//console.log('chartGenerator being called. nvd3Chart set to:' + nvd3Chart);
					nvd3Chart.x(function (d, i) {
						return d.label
					}).y(function (d) {
						return d.value
					}).color(function (d, i) {
						var color = colorScale(i);
						//console.log('barColor i=' + i + ' periodColorIndex=' + periodColorIndex + ' period=' + d.key + ' period=' + d.label + ' count=' + d.value + ' color=' + color);
						return color;
					}).duration(250).margin({
						left: marginLeft
						, right: marginRight
						, top: marginTop
						, bottom: marginBottom
					}).id("period-share-by-period-multiBarHorizontalChart").stacked(true).showControls(false);
					nvd3Chart.yAxis.tickFormat(d3.format(',.2f'));
					nvd3Chart.yAxis.axisLabel(periodColumn);
					nvd3Chart.xAxis.axisLabel(quantityColumn).axisLabelDistance(30);
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
						var newPeriod = event.key;
						console.log('legend legendDblclick on trip period: ' + newPeriod);
						$('#current-trip-period').val(newPeriod);
						updateCurrentPeriodOrClassification();
						redrawMap();
					});
					nvd3Chart.multibar.dispatch.on("elementMouseover", function (d, i) {
						var periodUnderMouse = d.value;
						changeCurrentPeriod(periodUnderMouse);
					});
					//furious has colored boxes with checkmarks
					//nvd3Chart.legend.vers('furious');
					return nvd3Chart;
				} //end generate
				
			, callback: function (newGraph) {
					console.log("nv.addGraph callback called");
					extNvd3Chart = newGraph;
					updateChart(function () {
						console.log("updateChart callback during after the nvd3 callback called");
					});
				} //end callback function
		}); //end nv.addGraph
	}; //end createEmptyChart
	function styleZoneGeoJSONLayer(feature) {
		var color = naColor;
		if (feature.zoneData != undefined) {
			var zoneDataFeature = feature.zoneData[currentPeriod];
			//possible that even if data for zone exists, could be missing this particular trip period
			if (zoneDataFeature != undefined) {
				var quantity = zoneDataFeature.QUANTITY;
				if (zoneDataFeature.QUANTITY == undefined) {
					throw ("Something is wrong. zoneDataFeature.QUANTITY is undefined. " + JSON.stringify(zoneDataFeature));
				}
				if (quantity >= breakUp[3]) {
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
			} //end if we have data for this trip period
		} //end if we have data for this zone
		//the allowed options are described here: http://leafletjs.com/reference.html#path-options
		var returnStyle = {
			//all SVG styles allowed
			fillColor: color
			, fillOpacity: 0.3
			, weight: 1
			, color: "darkGrey"
			, strokeOpacity: 0.05
			, stroke: showOutline
		};
		return (returnStyle);
	} //end styleZoneGeoJSONLayer function
	function stylePeriodGeoJSONLayer(feature) {
		var returnStyle = {
			//all SVG styles allowed
			fill: true
			, fillOpacity: 0.0
			, stroke: true
			, weight: 1
			, strokeOpacity: 0.25
			, color: "gray"
		};
		return (returnStyle);
	} //end stylePeriodGeoJSONLayer function
	function createMap(callback) {
		map = L.map("map").setView([33.754525, -84.384774], 9); //centered at Atlanta
		map.on('zoomend', function (type, target) {
			var zoomLevel = map.getZoom();
			var zoomScale = map.getZoomScale();
			console.log('zoomLevel: ', zoomLevel, ' zoomScale: ', zoomScale);
		});
		$.getJSON("../scripts/ZoneShape.GeoJSON", function (zoneTiles) {
			"use strict";
			//there should be at least as many zones as the number we have data for.
			if (zoneTiles.features.length < Object.keys(zoneData).length) {
				throw ("Something is wrong! zoneTiles.features.length(" + zoneTiles.features.length + ") < Object.keys(zoneData).length(" + Object.keys(zoneData).length + ").");
			}
			//calculate the zone centeriods
			for (var i = 0; i < zoneTiles.features.length; i++) {
				var feature = zoneTiles.features[i];
				var featureZoneData = zoneData[feature.properties.id];
				if (featureZoneData == undefined) {
					//missing data for this zone
				}
				else {
					feature.zoneData = featureZoneData;
					featureZoneData.centroid = L.latLngBounds(feature.geometry.coordinates[0]).getCenter();
				}
			}
			//http://leafletjs.com/reference.html#tilelayer
			zoneDataLayer = L.geoJson(zoneTiles, {
				updateWhenIdle: true
				, unloadInvisibleFiles: true
				, reuseTiles: true
				, opacity: 1.0
				, style: styleZoneGeoJSONLayer
			});
			//var stamenTileLayer = new L.StamenTileLayer("toner-lite"); //B&W stylized background map
			//map.addLayer(stamenTileLayer);
			var underlyingMapLayer = L.tileLayer('http://tile.stamen.com/toner-lite/{z}/{x}/{y}.png', {
				updateWhenIdle: true
				, unloadInvisibleFiles: true
				, reuseTiles: true
				, opacity: 1.0
			});
			underlyingMapLayer.addTo(map);
			$.getJSON("../scripts/cb_2015_us_period_500k_GEORGIA.json", function (periodTiles) {
				"use strict";
				console.log("cb_2015_us_period_500k GEORGIA.json success");
				//http://leafletjs.com/reference.html#tilelayer
				periodLayer = L.geoJson(periodTiles, {
					//keep only counties that we have data for
					filter: function (feature) {
						return countiesSet.has(feature.properties.NAME);
					}
					, updateWhenIdle: true
					, unloadInvisibleFiles: true
					, reuseTiles: true
					, opacity: 1.0
					, style: stylePeriodGeoJSONLayer
					, onEachFeature: onEachPeriod
				});
				zoneDataLayer.addTo(map);
				periodLayer.addTo(map);
			}).success(function () {
				console.log("cb_2015_us_period_500k GEORGIA.json second success");
			}).error(function (jqXHR, textStatus, errorThrown) {
				console.log("cb_2015_us_period_500k GEORGIA.json textStatus " + textStatus);
				console.log("cb_2015_us_period_500k GEORGIA.json errorThrown" + errorThrown);
				console.log("cb_2015_us_period_500k GEORGIA.json responseText (incoming?)" + jqXHR.responseText);
			}).complete(function () {
				console.log("cb_2015_us_period_500k GEORGIA.json complete");
			}); //end geoJson of period layer
			function onEachPeriod(feature, layer) {
				layer.on({
					mouseover: mouseoverPeriod
				});
			} //end on each Period
			function mouseoverPeriod(e) {
				var layer = e.target;
				changeCurrentPeriod(layer.feature.properties.NAME);
			}
		}); //end geoJson of zone layer
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
		$('#slider').css('background-image', css);
	}

	function setColorPalette(clickedIndex) {
		selectedColorRampIndex = clickedIndex;
		var paletteRamps = d3.selectAll(".ramp");
		var currentPalette = paletteRamps[0][selectedColorRampIndex];
		var rects = d3.select(currentPalette).selectAll("rect");
		rects.each(function (d, i) {
			var paletteColor = d3.rgb(d3.select(this).attr("fill"));
			paletteRamps
			colors[i] = paletteColor;
		});
		d3.selectAll(".ramp").classed("selected", function (d, tempColorRampIndex) {
			return tempColorRampIndex == selectedColorRampIndex;
		});
	}; //end setColorPalette
	function handleDocumentReady(callback) {
		"use strict";
		$(document).ready(function () {
			"use strict";
			console.log("enter ready callback");
			createMap(function () {
				console.log("createMap callback")
			});
			//NOTE: data should have been fully read in opn entry because
			//readInData() set holdReady until finished
			setDataSpecificDOM();
			svgElement = d3.select(svgSelector);
			updateCurrentPeriodOrClassification();
			createEmptyChart();
			$("#stacked").click(function () {
				extNvd3Chart.stacked(this.checked);
				extNvd3Chart.update();
			});
			$("#legend-type").click(function () {
				extNvd3Chart.legend.vers(this.checked ? "classic" : "furious");
				extNvd3Chart.update();
			});
			var colorRamps = d3.selectAll(".ramp").on('click', function (d, i) {
				setColorPalette(i);
				updateColors($("#slider").slider("values"));
				//add delay to redrawMap so css has change to updates
				setTimeout(redrawMap, CSS_UPDATE_PAUSE);
			}); //end on click for ramp/palette
			if ($("#classification").val() == "custom") {
				$("#update-map").css("display", "inline");
			};
			$("#scenario-header").html("Scenario " + abmviz_utilities.GetURLParameter("scenario"));
			// 			$("#chart-selection").change(function () {
			// 				//check ALL
			// 				var allIsSet;
			// 				var options = $("#chart-selection option");
			// 				options.each(function () {
			// 					var option = this;
			// 					var optionName = option.text;
			// 					if (optionName == "All") {
			// 						allIsSet = option.selected;
			// 					}
			// 					else {
			// 						var periodIndex = option.index - 1; //subtract 'All'
			// 						var isSelected = allIsSet || option.selected;
			// 						chartData[periodIndex].enabled = isSelected;
			// 					}
			// 				});
			// 				updateChart();
			// 			});
			//Logic for cycling through the maps
			$("#start-cycle-map").click(function () {
				$("#stop-cycle-map").css("display", "inline");
				$("#start-cycle-map").css("display", "none");
				cycleGoing = true;
				currentCyclePeriodIndex = 0;
				cyclePeriod();
			});
			$("#stop-cycle-map").click(function () {
				cycleGoing = false;
				$("#stop-cycle-map").css("display", "none");
				$("#start-cycle-map").css("display", "inline");
			});

			function cyclePeriod() {
				var newPeriod = periods[currentCyclePeriodIndex];
				$('#current-trip-period').val(newPeriod);
				updateCurrentPeriodOrClassification();
				redrawMap();
				currentCyclePeriodIndex++;
				if (currentCyclePeriodIndex >= $("#current-trip-period option").size()) {
					currentCyclePeriodIndex = 0;
				}
				if (cycleGoing) {
					var timeInterval = parseInt($("#cycle-frequency").val()) * 1000;
					setTimeout(cyclePeriod, timeInterval);
				} //end if cycleGoing
			} //end cyclePeriod
			$("#cycle-frequency").change(function () {
				//no need to do anything since cyclePeriod always reads the current #cycle-frequency
			});
			$("#update-map").click(function () {
				var sliderValues = $("#slider").slider("values");
				$("#val2").val(sliderValues[0]);
				$("#val3").val(sliderValues[1]);
				$("#val4").val(sliderValues[2]);
				redrawMap();
			});
			//value slider
			$("#slider").slider({
				range: false
				, disabled: ($("#classification").val() != "custom")
				, min: 0
				, max: 100
				, values: handlers
				, create: function (event, ui) {
					$('.ui-slider-handle:first').html('<div class="tooltip top slider-tip"><div class="tooltip-arrow"></div><div class="tooltip-inner">' + handlers[0] + '</div></div>');
					$('.ui-slider-handle:eq(1)').html('<div class="tooltip top slider-tip"><div class="tooltip-arrow"></div><div class="tooltip-inner">' + handlers[1] + '</div></div>');
					$('.ui-slider-handle:last').html('<div class="tooltip top slider-tip"><div class="tooltip-arrow"></div><div class="tooltip-inner">' + handlers[2] + '</div></div>');
				}
				, slide: function (event, ui) {
					var themax = $("#slider").slider("option", "max");
					updateColors(ui.values, themax);
					$('.ui-slider-handle:first').html('<div class="tooltip top slider-tip"><div class="tooltip-arrow"></div><div class="tooltip-inner">' + ui.values[0] + '</div></div>');
					$('.ui-slider-handle:eq(1)').html('<div class="tooltip top slider-tip"><div class="tooltip-arrow"></div><div class="tooltip-inner">' + ui.values[1] + '</div></div>');
					$('.ui-slider-handle:last').html('<div class="tooltip top slider-tip"><div class="tooltip-arrow"></div><div class="tooltip-inner">' + ui.values[2] + '</div></div>');
				}
			});
			updateColors(handlers, $("#slider").slider("option", "max"));
			$("#current-trip-period").change(function () {
				updateCurrentPeriodOrClassification();
				redrawMap();
			});
			$("#classification").change(function () {
				updateCurrentPeriodOrClassification();
				redrawMap();
			});
			$("#naColor").spectrum({
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
					updateColors($("#slider").slider("values"));
				}
			});
			$("#bubble-color").spectrum({
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
			callback();
		}); //end on document ready
	}; //end handleDocumentReady
	console.log("Before handling document ready");
	handleDocumentReady(function () {
		console.log("Finished handling document ready");
	});
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
		bubblesShowing = $("#bubbles").is(":checked");
		console.log('updateBubbles: bubblesShowing=' + bubblesShowing);
		if (circlesLayerGroup == undefined) {
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
			var bubbleMultiplier = parseInt($("#bubble-size").val());
			var mapBounds = d3.select("#map").node().getBoundingClientRect();
			var mapRadiusInPixels = mapBounds.width / 2;
			var maxBubbleRadiusInPixels = mapRadiusInPixels / 10;
			var maxBubbleSize = bubbleMultiplier * maxBubbleRadiusInPixels;
			var scaleSqrt = d3.scale.sqrt().domain([0, maxFeature]).range([0, maxBubbleSize]);
			Object.keys(zoneData).forEach(function (zoneKey) {
				var zoneDatum = zoneData[zoneKey];
				var bubbleCenter = zoneDatum.centroid;
				var zoneTripData = zoneDatum[currentPeriod];
				if (zoneTripData != undefined) {
					var quantity = zoneTripData.QUANTITY;
					var sqrtRadius = scaleSqrt(quantity);
					var circle = L.circleMarker(L.latLng(bubbleCenter.lng, bubbleCenter.lat), circleStyle);
					circle.setRadius(sqrtRadius);
					//add circle to circlesLayerGroup
					circlesLayerGroup.addLayer(circle);
				} //end if have data for this zone and trip period
			}); //end Object.keys(zoneData).forEach
		} //end if bubbles showing
	}; //end updateBubbles
	function updateCurrentPeriodOrClassification() {
		"use strict";
		currentPeriod = $('#current-trip-period').val();
		var startTime = Date.now();
		console.log('updateCurrentPeriodOrClassification: #current-trip-period.val()=' + currentPeriod);
		var serie = new geostats(periodData[currentPeriod].serie);
		maxFeature = serie.max();
		//handle the different classifications
		var classification = $("#classification").val();
		$("#slider").slider({
			range: false
			, disabled: ($("#classification").val() != "custom")
		});
		if (classification == "custom") {
			$("#update-map").css("display", "inline");
			breakUp = [$("#val1").val(), $("#val2").val(), $("#val3").val(), $("#val4").val(), $("#val5").val()];
		}
		else {
			$("#update-map").css("display", "none");
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
			$("#val1").val(breakUp[0]);
			$("#val2").val(breakUp[1]);
			$("#val3").val(breakUp[2]);
			$("#val4").val(breakUp[3]);
			$("#val5").val(breakUp[4]);
			var newValues = [parseInt(breakUp[1]), parseInt(breakUp[2]), parseInt(breakUp[3])];
			//update the slider
			$("#slider").slider({
				min: breakUp[0]
				, max: breakUp[4]
				, values: newValues
			});
			$('.ui-slider-handle:first').html('<div class="tooltip top slider-tip"><div class="tooltip-arrow"></div><div class="tooltip-inner">' + newValues[0] + '</div></div>');
			$('.ui-slider-handle:eq(1)').html('<div class="tooltip top slider-tip"><div class="tooltip-arrow"></div><div class="tooltip-inner">' + newValues[1] + '</div></div>');
			$('.ui-slider-handle:last').html('<div class="tooltip top slider-tip"><div class="tooltip-arrow"></div><div class="tooltip-inner">' + newValues[2] + '</div></div>');
			updateColors(newValues, breakUp[4]);
		} //end if !custom
		updateBubbles();
	}; //end updateCurrentPeriodOrClassification
	function updateOutline() {
		showOutline = ($("#stroke").is(":checked"));
		redrawMap();
	}
	//return only the parts that need to be global
	return {
		updateOutline: updateOutline
		, updateBubbles: updateBubbles
	};
}()); //end encapsulating IIFE