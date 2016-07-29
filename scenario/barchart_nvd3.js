//encapsulate all code within a IIFE (Immediately-invoked-function-expression) to avoid polluting global namespace
var barchart_nvd3 = (function () {
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
	var nvd3Chart;
	var url = "../data/" + GetURLParameter("scenario") + "/BarChartAndMapData.csv";
	d3.csv(url, function (error, csv_data) {
		if (error) throw error;
		var headers = d3.keys(csv_data[0]);
		var zoneColumn = headers[0];
		var countyColumn = headers[1];
		var modeColumn = headers[2];
		var quantityColumn = headers[3];
		var uniqueModes = new Set();
		var modesInEncounterOrder = [];
		var excludedLabel = "TOTAL";
		//first need to get the total for each mode for each county
		var countiesNestFunctions = d3.nest().key(function (d) {
			return d[countyColumn];
		}).key(function (d) {
			var mode = d[modeColumn];
			//keep set for quick checking of whether we saw before
			if (!uniqueModes.has(mode)) {
				uniqueModes.add(mode);
				//but also wish to retain order for display
				if (mode != excludedLabel) {
					modesInEncounterOrder.push(mode);
				}
			}
			return mode;
		}).rollup(function (leaves) {
			return {
				"length": leaves.length
				, "countyModeTotal": d3.sum(leaves, function (d) {
					return +d[quantityColumn]
				})
			}
		});
		var countiesNest = countiesNestFunctions.entries(csv_data);
		//need to remove all 'TOTAL' modes since not needed and actually inccorrect and not a mode
		countiesNest.forEach(function (countyObject) {
			var modeArray = countyObject.values;
			for (var modeArrayIndex = modeArray.length - 1; modeArrayIndex--;) {
				if (modeArray[modeArrayIndex].key === "TOTAL") {
					//delete from array
					modeArray.splice(modeArrayIndex, 1);
				}
			}
		});
		var newData = [];
		for (var modeIndex = 0; modeIndex < modesInEncounterOrder.length; modeIndex++) {
			var modeName = modesInEncounterOrder[modeIndex]
			modeObject = {
				key: modeName
				, values: []
			};
			newData.push(modeObject);
			//get mode data from each of the counties
			countiesNest.forEach(function (countyObject) {
				var modeCountyTotal = 0; //initialize in case mode not in county
				//wish to break once mode found so cannot use forEach but instead use some
				//http://stackoverflow.com/a/2641374/283973
				countyObject.values.some(function (countyModeObject) {
					if (countyModeObject.key == modeName) {
						modeCountyTotal = countyModeObject.values.countyModeTotal;
						return true; //break some
					}
					else {
						return false;
					}
				}); //end some
				modeObject.values.push({
					label: countyObject.key
					, value: modeCountyTotal
				});
			});
		}
		var svgSelector = "#barchart_nvd3";
		var svgElement = d3.select(svgSelector);
		//	var svgElement = d3.select(svgSelector);
		//	var parentBoundingBox = svgElement.node().parentNode.getBoundingClientRect();
		//	var chartWidth = parentBoundingBox.width;
		//console.log("based on parent element of svg, setting chartWidth=" + chartWidth);
		var hierarchicalData = newData;
		//hierarchicalData = long_short_data;
		var colorScale = d3.scale.category20();
		nv.addGraph({
			generate: function chartGenerator() {
				//console.log('chartGenerator being called. nvd3Chart=' + nvd3Chart);
				nvd3Chart = nv.models.multiBarHorizontalChart();
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
					left: 100
				}).stacked(true);
				nvd3Chart.yAxis.tickFormat(d3.format(',.2f'));
				nvd3Chart.yAxis.axisLabel(countyColumn);
				nvd3Chart.xAxis.axisLabel(quantityColumn).axisLabelDistance(20);
				svgElement.datum(hierarchicalData).call(nvd3Chart);
				nv.utils.windowResize(nvd3Chart.update);
				nvd3Chart.dispatch.on('stateChange', function (e) {
					nv.log('New State:', JSON.stringify(e));
				});
				nvd3Chart.state.dispatch.on('change', function (state) {
					nv.log('state', JSON.stringify(state));
				});
				return nvd3Chart;
			}
			, callback: function () {
				console.log("***********************barchart_nvd3 callback called");
				var chartWithControlsAndLegend = d3.select(".nvd3.nv-multiBarHorizontalChart");
				var chartOnly = d3.select(".nvd3 .nv-y");
				var controlsWrap = d3.select(".nvd3 .nv-controlswrap");
				var legendWrap = d3.select(".nvd3 .nv-legendwrap");
				var originalChartWithControlsAndLegendTranslation = d3.transform(chartWithControlsAndLegend.attr("transform")).translate;
				var yAxisTranslation = d3.transform(chartOnly.attr("transform")).translate;
				var legendTranslation = d3.transform(legendWrap.attr("transform")).translate;
				var newLegendAndControlsYPos = yAxisTranslation[1];
				var controlsWrapTranslation = d3.transform(controlsWrap.attr("transform")).translate;
				var inMoveLegend = false;
				moveLegend = function (caller) {
						if (inMoveLegend) {
							console.log('Skipping moveLegend called by "' + caller + '" because already running...')
						}
						else {
							inMoveLegend = true;
							var alreadyMoved = chartWithControlsAndLegend.classed('legend-moved');
							var chartWithControlsAndLegendTranslation = d3.transform(chartWithControlsAndLegend.attr("transform")).translate;
							var needsToBeMoved = originalChartWithControlsAndLegendTranslation[1] == chartWithControlsAndLegendTranslation[1];
							console.log('moveLegend called by ' + caller + '. alreadyMoved=' + alreadyMoved + ', needsToBeMoved=' + needsToBeMoved);
							if (!alreadyMoved || needsToBeMoved) {
								chartWithControlsAndLegend.classed('legend-moved', true);
								legendWrap.attr("transform", "translate(" + legendTranslation[0] + "," + newLegendAndControlsYPos + ")");
								controlsWrap.attr("transform", "translate(" + controlsWrapTranslation[0] + "," + newLegendAndControlsYPos + ")");
								//move overall chart up to cover area where legend and controls used to be
								chartWithControlsAndLegend.attr("transform", "translate(" + originalChartWithControlsAndLegendTranslation[0] + "," + (originalChartWithControlsAndLegendTranslation[1] + legendTranslation[1]) + ")");
								console.log('Finishing moving legend called by ' + caller);
							} //end if needs to be moved
							inMoveLegend = false;
						} //end if not already in function
					} //end function moveLegend
				nvd3Chart.dispatch.on('changeState', function () {
					moveLegend("chart changeState");
				});
				nvd3Chart.dispatch.on('stateChange', function () {
					moveLegend("chart stateChange");
				});
				nvd3Chart.dispatch.on('renderEnd', function () {
					moveLegend("chart renderEnd");
				});
				nvd3Chart.legend.dispatch.on('stateChange', function () {
					moveLegend("legend stateChange");
				});
				nvd3Chart.multibar.dispatch.on('renderEnd', function () {
					moveLegend("multibar renderEnd");
				});
				nv.utils.windowResize(function () {
					moveLegend("window resize");
				});
				nvd3Chart.state.dispatch.on('change', function () {
					moveLegend("state change");
				});
				var nvd3UpdateFunction = nvd3Chart.update;
				nvd3Chart.update = function () {
					console.log('before nvd3 update');
					nvd3UpdateFunction();
					console.log('after nvd3 update');
					moveLegend("after update()");
				}
				var nvd3ChartFunction = nvd3Chart.chart;
				nvd3Chart.chart = function () {
					console.log('before nvd3 chart');
					nvd3ChartFunction();
					console.log('after nvd3 chart');
				}
				var xScaleFunction = nvd3Chart.xAxis.scale();
				var xDomain = xScaleFunction.domain();
				console.log("barchart_nvd3 xScaleFunction xDomain " + xDomain);
				var yScaleFunction = nvd3Chart.yAxis.scale();
				var yDomain = yScaleFunction.domain();
				console.log("barchart_nvd3 yScaleFunction yDomain " + yDomain);
				var bounds = svgElement.node().getBBox();
				var width = bounds.width;
				var height = bounds.height;
				console.log("barchart_nvd3 setting svg width=" + width + ", svg height=" + height);
				svgElement.attr("width", width).attr("height", height);
				// 		svgElement.append("rect").attr("width", width).attr("height", height).on("click", function (e) {
				// 			console.log('click rect');
				// 		});
				var chartArea = d3.select(".nv-barsWrap.nvd3-svg");
				chartArea.on('click', function (event) {
					console.log('Click on nvd3 background');
				});
				var nvGroups = d3.select(".nv-groups");
				chartArea.on('click', function (event) {
					console.log('Click on nvd3 .nv-groups');
				});
				svgElement.on('click', function (event) {
					var mousePosition = d3.mouse(this);
					var mouseX = mousePosition[0];
					var mouseY = mousePosition[1];
					//var chartCoordsX = xScaleFunction.invert(mouseX);
					//console.log('Click on nvd3 svgElement mouseX:' + mouseX + ', mouseY:' + mouseY + '. chartCoordsX: ' + chartCoordsX);
					var chartCoordsX = yScaleFunction.invert(mouseY);
					console.log('Click on nvd3 svgElement mouseX:' + mouseX + ', mouseY:' + mouseY + '. chartCoordsX: ' + chartCoordsX);
				})
				svgElement.on('elementMouseMove', function (event) {
					var mousePosition = d3.mouse(this);
					var mouseX = mousePosition[0];
					var mouseY = mousePosition[1];
					//var chartCoordsX = xScaleFunction.invert(mouseX);
					//console.log('Click on nvd3 svgElement mouseX:' + mouseX + ', mouseY:' + mouseY + '. chartCoordsX: ' + chartCoordsX);
					var chartCoordsX = yScaleFunction.invert(mouseY);
					console.log('Click on nvd3 svgElement mouseX:' + mouseX + ', mouseY:' + mouseY + '. chartCoordsX: ' + chartCoordsX);
				})
			}
			, dispatch: {
				renderEnd: function (e) {
					console.log("renderEnd dispatched");
				}
			} //end dispatch
		});
	});
}()); //end encapsulating IIFE