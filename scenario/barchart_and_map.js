//encapsulate all code within a IIFE (Immediately-invoked-function-expression) to avoid polluting global namespace
var barchart_and_map = (function () {
	"use strict";
	var chart, zonetiles, baselayer, map, tileIndex, tileOptions;
	var center = [33.754525, -84.384774];
	var color1 = "#f1eef6"
		, color2 = "#bdc9e1"
		, color3 = "#74a9cf"
		, color4 = "#2b8cbe"
		, naColor = "White"
		, bubbleColor = "#ff7800";
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
	//data
	var zoneData;
	var dataItems = [];
	var currentCounty = "";
	var modes;
	var counties;
	var enabledCounties;
	var circlesLayerGroup;
	var chartData = null;
	//use Map instead of vanilla object because wish to preserve insertion order
	var modeData = new Map([]);
	var quantityColumn;
	var countyColumn;
	var zoneColumn;
	var modeColumn;
	var url = "../data/" + GetURLParameter("scenario") + "/BarChartAndMapData.csv"
	var centroids = {};
	var svgSelector = "#chart";
	var svgElement;
	var extNvd3Chart;
	var minBarWidth = 2;
	var minBarSpacing = 1;
	var marginTop = 0;
	var marginBottom = 50;
	var marginLeft = 110;
	var marginRight = 50;

	function GetURLParameter(sParam) {
		"use strict";
		var sPageURL = window.location.search.substring(1);
		var sURLVariables = sPageURL.split('&');
		for (var i = 0; i < sURLVariables.length; i++) {
			var sParameterName = sURLVariables[i].split('=');
			if (sParameterName[0] == sParam) {
				return sParameterName[1];
			}
		}
	}

	function redrawMap() {
		"use strict";
		colorizeFeatures(zonetiles);
		tileIndex = geojsonvt(zonetiles, tileOptions);
		tileLayer.addTo(map);
		tileLayer.redraw();
	}

	function readInData(callback) {
		"use strict";
		d3.csv(url, function (error, data) {
			"use strict";
			if (error) throw error; //expected data should have columns similar to: ZONE,COUNTY,TRIP_MODE_NAME,QUANTITY
			var headers = d3.keys(data[0]);
			zoneColumn = headers[0];
			countyColumn = headers[1];
			modeColumn = headers[2];
			quantityColumn = headers[3];
			var rawChartData = new Map([]);
			//run through data. Filter out 'total' psuedo-mode, convert quantity to int, create zoneData
			zoneData = {};
			counties = [];
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
						COUNTY: countyName
						, QUANTITY: quantity
					};
					if (rawChartData[countyName] == undefined) {
						rawChartData[countyName] = {};
						counties.push(countyName);
					}
					if (rawChartData[countyName][modeName] == undefined) {
						rawChartData[countyName][modeName] = 0;
						//keep track of counts for each mode
						//don't actually care about counts but this also implicitly keeps a list of all modes
						//in the order they were encountered because properties are ordered
						if (modeData[modeName] == undefined) {
							modeData[modeName] = {
								enabled: true
								, serie: []
							};
						}
					}
					modeData[modeName].serie.push(quantity);
					rawChartData[countyName][modeName] += quantity;
				} //end if keeping this object
				return keepThisObject;
			}); //end filtering and other data prep
			modes = Object.keys(modeData);
			data = null; //allow GC to reclaim memory
			//need to run through rawChartData and put modes in order and insert ones that are missing
			chartData = [];
			counties.forEach(function (countyName) {
				var rawCountyObject = rawChartData[countyName];
				var newCountyObject = {
					groupLabel: countyName
					, subgroups: []
					, enabled: true
				};
				chartData.push(newCountyObject);
				modes.forEach(function (modeName) {
					var countyModeTotalQuantity = rawCountyObject[modeName];
					if (countyModeTotalQuantity == undefined) {
						countyModeTotalQuantity = 0;
					}
					newCountyObject.subgroups.push({
						subgroupLabel: modeName
						, value: countyModeTotalQuantity
					});
				}); //end modes foreach
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
		$("#attribute_label").html(modeColumn);
		modes.forEach(function (modeName) {
			$("#attribute").append("<option>" + modeName + "</option>");
		});
		chartData.forEach(function (chartObject) {
			$("#chart_selection").append("<option>" + chartObject.groupLabel + "</option>");
		});
		$("#chart_selection").chosen();
	} //end setDataSpecificDOM
	function updateChart() {
		"use strict";
		updateChartNVD3();
	}

	function updateChartNVD3() {
		"use strict";
		//nvd3 expects data in the opposite hierarchy than rest of code so need to create 
		//but can also filter out counties at same time
		enabledCounties = chartData.filter(function (countyObject) {
			return countyObject.enabled;
		})
		var hierarchicalData = [];
		modes.forEach(function (modeName, modeIndex) {
			var subgroups = [];
			var modeObject = {
				key: modeName
				, values: subgroups
			};
			hierarchicalData.push(modeObject);
			enabledCounties.forEach(function (countyWithModesObject) {
				var simpleModeObject = countyWithModesObject.subgroups[modeIndex];
				var retrievedModeName = simpleModeObject.subgroupLabel;
				if (retrievedModeName != modeName) {
					throw ("SOMETHING IS WRONG. Mode is not as expected. Expected mode: " + modeName + ", found modeName: " + retrievedModeName);
				}
				var simpleCountyObject = {
					label: countyWithModesObject.groupLabel
					, value: simpleModeObject.value
				}
				subgroups.push(simpleCountyObject);
			}); //end loop over chartData countyObjects
		}); //end loop over modes
		//poll every 150ms for up to two seconds waiting for chart
		poll(function () {
			return extNvd3Chart != undefined;
		}, function () {
			var parentBoundingBox = svgElement.node().parentNode.getBoundingClientRect();
			var chartWidth = parentBoundingBox.width;
			extNvd3Chart.width(chartWidth);
			console.log("based on parent element of svg, setting chartWidth=" + chartWidth);
			//update chart with current data
			svgElement.datum(hierarchicalData).call(extNvd3Chart);
			var legendHeight = extNvd3Chart.legend.height();
			var numTotalBars = enabledCounties.length * modes.length;
			var heightPerBar = minBarWidth + minBarSpacing;
			var chartAreaHeight = numTotalBars * heightPerBar;
			var totalHeight = legendHeight + chartAreaHeight + marginTop + marginBottom;
			console.log('setting totalHeight to: ' + totalHeight + " with chart area portion: " + chartAreaHeight);
			//extNvd3Chart.height(totalHeight);
			//extNvd3Chart.update();
			//svgElement.attr("height", totalSvgHeight); //svgElement.attr("width", chartWidth).attr("height", totalSvgHeight);
			//svgElement.style.webkitTransform = 'scale(1)';
			var entireChartWithLegend = d3.select(".nvd3.nv-multiBarHorizontalChart");
			var node = entireChartWithLegend.node();
			if (false && node) {
				var bounds = node.getBBox();
				var width = bounds.width;
				var height = bounds.height;
				console.log("barchart_nvd3 setting svg width=" + width + ", svg height=" + height);
				//svgElement.attr("width", width);
				svgElement.attr("height", height);
				svgElement.style.webkitTransform = 'scale(1)';
			} //end if node
		}, function () {
			throw "something is wrong -- extNvd3Chart still doesn't exist after polling "
		}); //end call to poll
	}; //end updateChartNVD3
	//from https://davidwalsh.name/javascript-polling
	function poll(fn, callback, errback, timeout, interval) {
		var endTime = Number(new Date()) + (timeout || 2000);
		interval = interval || 100;
		(function pollInternal() {
			// If the condition is met, we're done! 
			if (fn()) {
				callback();
			}
			// If the condition isn't met but the timeout hasn't elapsed, go again
			else if (Number(new Date()) < endTime) {
				setTimeout(pollInternal, interval);
			}
			// Didn't match and too much time, reject!
			else {
				errback(new Error('timed out for ' + fn + ': ' + arguments));
			}
		})();
	}

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
						left: marginLeft
						, right: marginRight
						, top: marginTop
						, bottom: marginBottom
					}).stacked(false).showControls(false);
					nvd3Chart.yAxis.tickFormat(d3.format(',.2f'));
					nvd3Chart.yAxis.axisLabel(countyColumn);
					nvd3Chart.xAxis.axisLabel(quantityColumn).axisLabelDistance(30);
					nv.utils.windowResize(function () {
						//reset marginTop in case legend has gotten less tall
						nvd3Chart.margin({
							top: marginTop
						});
						updateChart();
					});

					function changeCurrentCounty(newCurrentCounty) {
						currentCounty = newCurrentCounty;
						var countyLabels = d3.selectAll(".nvd3.nv-multiBarHorizontalChart .nv-x text ");
						countyLabels.classed("current-county", function (d, i) {
							var setClass = d == currentCounty;
							return setClass;
						}); //end classed of group rect
						redrawMap();
					}; //end change currentCounty
					nvd3Chart.multibar.dispatch.on("elementClick", function (e) {
						console.log('elementClick on ' + e.data.label + ', ' + e.data.key + ', with value ' + e.data.value);
						changeCurrentCounty(e.data.label);
					});
					//furious has colored boxes with checkmarks
					//nvd3Chart.legend.vers('furious');
					svgElement.on('click', function (event) {
						var entireChartWithLegend = d3.select(".nvd3.nv-multiBarHorizontalChart");
						var mainChart = d3.select(".nvd3 .nv-y.nv-axis");
						var mouseY = d3.mouse(this)[1];
						//the main area is shifted -(legendHeight)
						var chartYOffset = d3.transform(entireChartWithLegend.attr("transform")).translate[1];
						var mainChartHeight = d3.transform(mainChart.attr("transform")).translate[1];
						var mouseChartY = mouseY - chartYOffset;
						if (mouseChartY > 0 && mouseChartY < mainChartHeight) {
							var numCounties = enabledCounties.length;
							var heightPerGroup = mainChartHeight / numCounties;
							var countyIndex = Math.floor(mouseChartY / heightPerGroup);
							var countyObject = enabledCounties[countyIndex];
							console.log('click in county: ' + countyObject.groupLabel);
							changeCurrentCounty(countyObject.groupLabel);
						} //end if click in chart area
					}); //end on svgElement click
					return nvd3Chart;
				} //end generate
				
			, callback: function (newGraph) {
					extNvd3Chart = newGraph;
					console.log("***********************barchart_nvd3 callback called");
					//sizeSVG();
					//setTimeout(sizeSVG, 2500);
				} //end callback function
		}); //end nv.addGraph
	}; //end createEmptyChart
	//load tiles
	function loadTiles(callback) {
		$.getJSON("../scripts/ZoneShape.GeoJSON", function (json) {
			"use strict";
			zonetiles = json;
			//calculate the zone centeriods
			for (var i = 0; i < zonetiles.features.length; i++) {
				centroids[zonetiles.features[i].properties.id] = L.latLngBounds(zonetiles.features[i].geometry.coordinates[0]).getCenter();
			}
			baselayer = L.geoJson(zonetiles);
			setTimeout(function () {
				redrawMap();
			}, 2000);
			callback();
		});
	};
	loadTiles(function () {
		console.log("loadTiles callback")
	});

	function updateColors(values, themax) {
		"use strict";
		var colors = [color1, color2, color3, color4];
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
	var interval;
	var currentVal = 0;
	var cycleGoing = 0;

	function handleDocumentReady(callback) {
		"use strict";
		$(document).ready(function () {
			"use strict";
			console.log("enter ready callback");
			//NOTE: data should have been fully read in opn entry because 
			//readInData() set holdReady until finished
			setDataSpecificDOM();
			svgElement = d3.select(svgSelector);
			createEmptyChart();
			updateChart();
			if ($("#classification").val() == "custom") {
				$("#update_map").css("display", "inline");
			}
			$("#scenario_header").html("Scenario " + GetURLParameter("scenario"));
			$("#chart_selection").change(function () {
				//check ALL
				var allIsSet;
				var options = $("#chart_selection option");
				options.each(function () {
					var option = this;
					var optionName = option.text;
					if (optionName == "All") {
						allIsSet = option.selected;
					}
					else {
						var countyIndex = option.index - 1; //subtract 'All'
						var isSelected = allIsSet || option.selected;
						chartData[countyIndex].enabled = isSelected;
					}
				});
				updateChart();
			});
			//Logic for cycling through the maps
			$("#start_cycle_map").click(function () {
				$("#stop_cycle_map").css("display", "inline");
				$("#start_cycle_map").css("display", "none");
				interval = setInterval(function () {
					cycleGoing = 1;
					$('#attribute option:eq(' + currentVal + ')').prop('selected', true);
					redrawMap();
					currentVal++;
					if (currentVal >= $("#attribute option").size()) {
						currentVal = 0;
					}
				}, parseInt($("#cycle_frequency").val()) * 1000);
			});
			$("#stop_cycle_map").click(function () {
				clearInterval(interval);
				cycleGoing = 0;
				$("#stop_cycle_map").css("display", "none");
				$("#start_cycle_map").css("display", "inline");
			});
			$("#cycle_frequency").change(function () {
				if (cycleGoing == 1) {
					clearInterval(interval);
					interval = setInterval(function () {
						$('#attribute option:eq(' + currentVal + ')').prop('selected', true);
						redrawMap();
						currentVal++;
						if (currentVal >= $("#attribute option").size()) {
							currentVal = 0;
						}
					}, parseInt($("#cycle_frequency").val()) * 1000);
				}
			});
			map = L.map("map").setView(center, 9);
			var maxZoom = 20;
			//B&W stylized background map
			var stamenTileLayer = new L.StamenTileLayer("toner-lite");
			map.addLayer(stamenTileLayer);
			tileOptions = {
				maxZoom: 20
				, tolerance: 5
				, extent: 4096
				, buffer: 64
				, debug: 0
				, indexMaxZoom: maxZoom
				, indexMaxPoints: 100000
			, };
			map.on('zoomend', function (type, target) {
				var zoomLevel = map.getZoom();
				var zoomScale = map.getZoomScale();
				console.log('zoomLevel: ', zoomLevel, ' zoomScale: ', zoomScale);
			});
			map.on('click', function (e) {
				var layer = leafletPip.pointInLayer(e.latlng, baselayer, true);
				if (layer.length > 0) {
					currentCounty = zoneData[layer[0].feature.properties.id][modes[0]].COUNTY;
					redrawMap();
					chart.selectAll("text.label").style('font-size', "15px");
					chart.selectAll("text").filter(function () {
						return this.innerHTML == currentCounty;
					}).style('font-size', "20px");
				}
			});
			$("#update_map").click(function () {
				var slider_values = $("#slider").slider("values");
				$("#val2").val(slider_values[0]);
				$("#val3").val(slider_values[1]);
				$("#val4").val(slider_values[2]);
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
			$("#attribute").change(function () {
				redrawMap();
			});
			$("#classification").change(function () {
				if ($("#classification").val() == "custom") {
					$("#update_map").css("display", "inline");
				}
				else {
					$("#update_map").css("display", "none");
				}
				$("#slider").slider({
					range: false
					, disabled: ($("#classification").val() != "custom")
				});
				redrawMap();
			});
			//color selectors
			$("#color1").spectrum({
				color: color1
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
					color1 = color;
					redrawMap();
					updateColors($("#slider").slider("values"));
				}
			});
			$("#color2").spectrum({
				color: color2
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
					color2 = color;
					redrawMap();
					updateColors($("#slider").slider("values"));
				}
			});
			$("#color3").spectrum({
				color: color3
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
					color3 = color;
					redrawMap();
					updateColors($("#slider").slider("values"));
				}
			});
			$("#color4").spectrum({
				color: color4
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
					color4 = color;
					redrawMap();
					updateColors($("#slider").slider("values"));
				}
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
			$("#bubble_color").spectrum({
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
	//main map display function
	function colorizeFeatures(data) {
		"use strict";
		var attribute = $('#attribute').val();
		var serie = new geostats(modeData[attribute].serie);
		var maxFeature = serie.max();
		//handle the different classifications
		var classification = $("#classification").val();
		var breakUp;
		if (classification == "even_interval" || classification == "quantiles") {
			if (classification == "even_interval") {
				breakUp = serie.getClassEqInterval(4);
			}
			else if (classification == "quantiles") {
				breakUp = serie.getClassQuantile(4);
			}
			$("#val1").val(breakUp[0]);
			$("#val2").val(breakUp[1]);
			$("#val3").val(breakUp[2]);
			$("#val4").val(breakUp[3]);
			$("#val5").val(breakUp[4]);
			var new_values = [parseInt(breakUp[1]), parseInt(breakUp[2]), parseInt(breakUp[3])];
			//update the slider
			$("#slider").slider({
				min: breakUp[0]
				, max: breakUp[4]
				, values: new_values
			});
			$('.ui-slider-handle:first').html('<div class="tooltip top slider-tip"><div class="tooltip-arrow"></div><div class="tooltip-inner">' + new_values[0] + '</div></div>');
			$('.ui-slider-handle:eq(1)').html('<div class="tooltip top slider-tip"><div class="tooltip-arrow"></div><div class="tooltip-inner">' + new_values[1] + '</div></div>');
			$('.ui-slider-handle:last').html('<div class="tooltip top slider-tip"><div class="tooltip-arrow"></div><div class="tooltip-inner">' + new_values[2] + '</div></div>');
			updateColors(new_values, breakUp[4]);
		}
		else if (classification == "custom") {
			breakUp = [$("#val1").val(), $("#val2").val(), $("#val3").val(), $("#val4").val(), $("#val5").val()];
		}
		if (circlesLayerGroup == undefined) {
			//first time must initalize by creating and adding to map
			circlesLayerGroup = L.layerGroup([]);
			circlesLayerGroup.addTo(map);
		}
		else {
			circlesLayerGroup.clearLayers();
		}
		var counter = 0;
		var circleStyle = {
			"stroke": false
			, "fillColor": bubbleColor
			, "fillOpacity": 0.75
		};
		//get current map width to determine maximum bubble size
		var mapCenter = map.getCenter();
		var eastBound = map.getBounds().getEast();
		var centerEast = L.latLng(mapCenter.lat, eastBound);
		var bubbleMultiplier = parseInt($("#bubble_size").val());
		var mapBounds = d3.select("#map").node().getBoundingClientRect();
		var mapRadiusInPixels = mapBounds.width / 2;
		var maxBubbleRadiusInPixels = mapRadiusInPixels / 10;
		var maxBubbleSize = bubbleMultiplier * maxBubbleRadiusInPixels;
		var scaleSqrt = d3.scale.sqrt().domain([0, maxFeature]).range([0, maxBubbleSize]);
		for (var i = 0; i < data.features.length; i++) {
			var color = naColor;
			if (zoneData[data.features[i].properties.id] != undefined) {
				if (zoneData[data.features[i].properties.id][attribute] != undefined) {
					//add circle
					if ($("#bubbles").is(":checked")) {
						var bubbleCenter = centroids[data.features[i].properties.id];
						var quantity = zoneData[data.features[i].properties.id][attribute].QUANTITY;
						var sqrtRadius = scaleSqrt(quantity);
						var circle = L.circleMarker(L.latLng(bubbleCenter.lng, bubbleCenter.lat), circleStyle);
						circle.setRadius(sqrtRadius);
						//add circle to circlesLayerGroup
						circlesLayerGroup.addLayer(circle);
					}
					if (parseInt(zoneData[data.features[i].properties.id][attribute].QUANTITY) >= breakUp[0]) {
						color = color1;
					}
					if (parseInt(zoneData[data.features[i].properties.id][attribute].QUANTITY) >= breakUp[1]) {
						color = color2;
					}
					if (parseInt(zoneData[data.features[i].properties.id][attribute].QUANTITY) >= breakUp[2]) {
						color = color3;
					}
					if (parseInt(zoneData[data.features[i].properties.id][attribute].QUANTITY) >= breakUp[3]) {
						color = color4;
					}
				}
			}
			if (color != naColor) {
				if (zoneData[data.features[i].properties.id][attribute].COUNTY == currentCounty) {
					if (color.toHex != undefined) {
						color = color.toHex();
					}
					var rgb = hexToRgb(color);
					color = "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",0.4)";
				}
			}
			data.features[i].properties.color = color;
		}
		return counter;
	}; //end colorizefeatures
	var tileLayer = L.canvasTiles().params({
		debug: false
		, padding: 5
	}).drawing(drawingOnCanvas);
	var pad = 0;
	/* map helper function */
	function drawingOnCanvas(canvasOverlay, params) {
		"use strict";
		var bounds = params.bounds;
		params.tilePoint.z = params.zoom;
		var ctx = params.canvas.getContext('2d');
		ctx.globalCompositeOperation = 'source-over';
		var tile = tileIndex.getTile(params.tilePoint.z, params.tilePoint.x, params.tilePoint.y);
		if (!tile) {
			return;
		}
		ctx.clearRect(0, 0, params.canvas.width, params.canvas.height);
		var features = tile.features;
		ctx.strokeStyle = 'grey';
		ctx.lineWidth = 0;
		for (var i = 0; i < features.length; i++) {
			var feature = features[i]
				, type = feature.type;
			ctx.fillStyle = feature.tags.color ? feature.tags.color : 'rgba(255,0,0,0.05)';
			ctx.beginPath();
			for (var j = 0; j < feature.geometry.length; j++) {
				var geom = feature.geometry[j];
				if (type == 1) {
					ctx.arc(geom[0] * ratio + pad, geom[1] * ratio + pad, 2, 0, 2 * Math.PI, false);
					continue;
				}
				for (var k = 0; k < geom.length; k++) {
					var p = geom[k];
					var extent = 4096;
					var x = p[0] / extent * 256;
					var y = p[1] / extent * 256;
					if (k) {
						ctx.lineTo(x + pad, y + pad);
					}
					else {
						ctx.moveTo(x + pad, y + pad);
					}
				}
			}
			if (type == 3 || type == 1) {
				ctx.fill('evenodd');
			}
			if ($("#stroke").is(":checked")) {
				ctx.stroke();
			}
		}
	} //end drawingOnCanvas
	var display_chart_dic = {};
	//main chart function
	var hiddenModes = [];
	var data;
	var countyModeTotalsArray;
	var displaySeries;
	var seriesLength;
	var xAxis;

	//return only the parts that need to be global
	return { redrawMap: redrawMap,
			marginLeft: marginLeft};
}()); //end encapsulating IIFE

console.log('barchart_and_map.marginLeft: ' + barchart_and_map.marginLeft);