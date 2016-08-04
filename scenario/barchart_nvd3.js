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
		var parentBoundingBox = svgElement.node().parentNode.getBoundingClientRect();
		var chartWidth = parentBoundingBox.width;
		//console.log("based on parent element of svg, setting chartWidth=" + chartWidth);
		var hierarchicalData = newData;
		var marginLeft = 100;
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
					left: marginLeft
				}).stacked(false).showControls(false);
				nvd3Chart.yAxis.tickFormat(d3.format(',.2f'));
				nvd3Chart.yAxis.axisLabel(countyColumn);
				nvd3Chart.xAxis.axisLabel(quantityColumn).axisLabelDistance(20);
				svgElement.datum(hierarchicalData).call(nvd3Chart);
				//nv.utils.windowResize(nvd3Chart.update);
				nvd3Chart.dispatch.on('stateChange.rsg', function (e) {
					nv.log('New State:', JSON.stringify(e));
				});
				nvd3Chart.state.dispatch.on('change.rsg', function (state) {
					nv.log('state', JSON.stringify(state));
				});
				//nvd3Chart.controls.updateState(true);
				nvd3Chart.legend.vers('furious');
				//add rectangles extending over each county to the right side of chart
				//NOTE X AND Y AXES ARE REVERSED -- because this is a horizontal bar chart
				//looks like nvd3 treated it like a rotated vertical bar chart. I use the actual axis names -- x horizontal, y vertical
				// 				var yAxisSvgObject = d3.select(".nvd3 .nv-x .nv-wrap.nv-axis");
				// 				var yAxisHeight = yAxisSvgObject.node().getBBox().height;
				// 				var firstModeCountyObjects = hierarchicalData[0].values;
				// 				var numCounties = hierarchicalData[0].values.length;
				// 				var heightPerGroup = yAxisHeight / numCounties;
				// 				var countyOverlayBoxes = yAxisSvgObject.selectAll(".group-overlay").data(firstModeCountyObjects, function (d) {
				// 					return "clickRects+" + d.label;
				// 				}).enter().append("rect").attr("class", "group-overlay");
				// 				countyOverlayBoxes.attr("height", heightPerGroup).attr("width", chartWidth).style("fill-opacity", "0.0") //transparent
				// 					.style("stroke-opacity", "1.0").attr("x", -marginLeft).attr("y", function (countyDatum, i) {
				// 						return i * heightPerGroup
				// 					})
				// 					.on('click', function (e) {
				// 						console.log('got click on target: ' + e.label);
				// 					})
				// 					;
				return nvd3Chart;
			}
			, callback: function () {
				console.log("***********************barchart_nvd3 callback called");
				nvd3Chart.multibar.dispatch.on('chartClick', function (e) {
					console.log('multibar chartClick');
				});
				nvd3Chart.multibar.dispatch.on('elementClick', function (e) {
					console.log('elementClick element:' + e.value + " e.point: " + e.value);
				});
				var chartWithAxesLabels = d3.select(".nvd3 g.nv-x.nv-axis");
				chartWithAxesLabels.style("pointer-events", "visiblePainted").on('click', function (d, i) {
					console.log('click chartWithAxesLabels nv-x');
				});
				chartWithAxesLabels = d3.select(".nvd3 g.nv-y.nv-axis");
				chartWithAxesLabels.style("pointer-events", "visiblePainted").on('click', function (d, i) {
					console.log('click chartWithAxesLabels nv-y');
				});
				chartWithLabels = d3.select(".nvd3.nv-wrap.nv-multibarHorizontal");
				chartWithAxesLabels.style("pointer-events", "visiblePainted").on('click', function (d, i) {
					console.log('click .nvd3.nv-wrap.nv-multibarHorizontal');
				});
				chartWithLabels = d3.selectAll(".nvd3.nv-wrap.nv-multibarHorizontal");
				chartWithAxesLabels.style("pointer-events", "visiblePainted").on('click', function (d, i) {
					console.log('click .nvd3.nv-wrap.nv-multibarHorizontal');
				});
				var inMoveLegend = false;
				var observer = new MutationObserver(function (mutations) {
					mutations.forEach(function (mutation) {
						console.log("Mutation: " + mutation.type);
						moveLegend('mutation');
					});
				});
				// configuration of the observer:
				var mutationObserverConfig = {
					attributes: true
					, attributeFilter: ['transform']
					, childList: false
					, characterData: false
				};
				var mainChartGSelector = ".nvd3.nv-multiBarHorizontalChart";
				// pass in the target node, as well as the observer options
				//observer.observe(d3.select(mainChartGSelector).node(), mutationObserverConfig);
				moveLegend = function (caller) {
						if (inMoveLegend) {
							console.log('Skipping moveLegend called by "' + caller + '" because already running...')
						}
						else {
							inMoveLegend = true;
							var chartWithControlsAndLegend = d3.select(mainChartGSelector);
							var chartWithAxesLabels = d3.select(".nvd3 .nv-y.nv-axis");
							var controlsWrap = d3.select(".nvd3 .nv-controlswrap");
							var legendWrap = d3.select(".nvd3 .nv-legendwrap");
							var legendTranslation = d3.transform(legendWrap.attr("transform")).translate;
							var legendY = legendTranslation[1];
							var chartWithControlsAndLegendTranslation = d3.transform(chartWithControlsAndLegend.attr("transform")).translate;
							var chartWithAxesLabelsTranslation = d3.transform(chartWithAxesLabels.attr("transform")).translate;
							var chartWithAxesLabelsY = chartWithAxesLabelsTranslation[1];
							//NOTE X AND Y AXES ARE REVERSED -- because this is a horizontal bar chart
							//looks like nvd3 treated it like a rotated vertical bar chart. I use the actual axis names -- x horizontal, y vertical
							var xAxis = d3.select(".nvd3 .nv-y .nv-wrap.nv-axis");
							var xAxisHeight = xAxis.node().getBBox().height;
							var newLegendAndControlsYPos = chartWithAxesLabelsY + xAxisHeight;
							var newChartWithControlsAndLegendY = chartWithControlsAndLegendTranslation[1] + legendTranslation[1];
							var controlsWrapTranslation = d3.transform(controlsWrap.attr("transform")).translate;
							var needsToBeMoved = legendY < chartWithAxesLabelsY;
							var alreadyMoved = chartWithControlsAndLegend.classed('legend-moved');
							console.log('moveLegend called by ' + caller + '. alreadyMoved=' + alreadyMoved + ', needsToBeMoved=' + needsToBeMoved);
							printPositions('before');

							function printPositions(prefix) {
								console.log(prefix + ': chartWithControlsAndLegendY=' + d3.transform(chartWithControlsAndLegend.attr("transform")).translate[1]);
								console.log(prefix + ': legendY=' + d3.transform(controlsWrap.attr("transform")).translate[1]);
								console.log(prefix + ': chartWithAxesLabelsY=' + d3.transform(chartWithAxesLabels.attr("transform")).translate[1]);
							}
							if (!alreadyMoved || needsToBeMoved) {
								chartWithControlsAndLegend.classed('legend-moved', true);
								legendWrap.attr("transform", "translate(" + legendTranslation[0] + "," + newLegendAndControlsYPos + ")");
								controlsWrap.attr("transform", "translate(" + controlsWrapTranslation[0] + "," + newLegendAndControlsYPos + ")");
								//move overall chart up to cover area where legend and controls used to be
								chartWithControlsAndLegend.attr("transform", "translate(" + chartWithControlsAndLegendTranslation[0] + "," + 0 + ")");
								console.log('Finishing moving legend called by ' + caller);
								printPositions('after move');
							} //end if needs to be moved
							inMoveLegend = false;
						} //end if not already in function
					} //end function moveLegend
					//moveLegend('Initial chart callback');
					// 				nvd3Chart.dispatch.on('changeState.rsg', function () {
					// 					moveLegend("chart changeState.rsg");
					// 				});
					// 				nvd3Chart.dispatch.on('stateChange.rsg', function () {
					// 					moveLegend("chart stateChange.rsg");
					// 				});
					// 				nvd3Chart.dispatch.on('renderEnd.rsg', function () {
					// 					moveLegend("chart renderEnd.rsg");
					// 				});
					// 				nvd3Chart.controls.dispatch.on('stateChange.rsg', function () {
					// 					moveLegend("controls stateChange.rsg");
					// 				});
					// 				nvd3Chart.controls.dispatch.on('legendClick.rsg', function () {
					// 					moveLegend("controls legendClick.rsg");
					// 				});
					// 				nvd3Chart.legend.dispatch.on('legendClick.rsg', function () {
					// 					moveLegend("legend legendClick.rsg");
					// 				});
					// 				nvd3Chart.legend.dispatch.on('stateChange.rsg', function () {
					// 					moveLegend("legend dispatch.on stateChange.rsg");
					// 				});
					// 				nvd3Chart.multibar.dispatch.on('renderEnd.rsg', function () {
					// 					moveLegend("multibar renderEnd.rsg");
					// 				});
					// 				nvd3Chart.multibar.dispatch.on('chartClick.rsg', function () {
					// 					moveLegend("multibar chartClick.rsg");
					// 				});
					// 				nvd3Chart.multibar.dispatch.on('elementClick.rsg', function () {
					// 					moveLegend("multibar elementClick.rsg");
					// 				});
					// 				nv.utils.windowResize(function () {
					// 					moveLegend("window resize");
					// 				});
					// 				nvd3Chart.state.dispatch.on('change.rsg', function () {
					// 					moveLegend("state change.rsg");
					// 				});
					// 				var nvd3UpdateFunction = nvd3Chart.update;
					// 				nvd3Chart.update = function () {
					// 					console.log('before nvd3 update');
					// 					nvd3UpdateFunction();
					// 					console.log('after nvd3 update');
					// 					moveLegend("after update()");
					// 				}
					// 				var nvd3ChartFunction = nvd3Chart.chart;
					// 				nvd3Chart.chart = function () {
					// 					console.log('before nvd3 chart');
					// 					nvd3ChartFunction();
					// 					console.log('after nvd3 chart');
					// 				}
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
				// 				var nvGroups = d3.select(".nv-groups");
				// 				chartArea.on('click', function (event) {
				// 					console.log('Click on nvd3 .nv-groups');
				// 				});
				svgElement.on('click', function (event) {
						var mouseY = d3.mouse(this)[1];
						var chartYOffset = d3.transform(d3.select(mainChartGSelector).attr("transform")).translate[1];
						var chartHeight = d3.transform(d3.select(".nvd3 .nv-y.nv-axis").attr("transform")).translate[1];
						var mouseChartY = mouseY - chartYOffset;
						if (mouseChartY > 0 && mouseChartY < chartHeight) {
							var firstModeCountyObjects = hierarchicalData[0].values;
							var numCounties = hierarchicalData[0].values.length;
							var heightPerGroup = chartHeight / numCounties;
							var countyIndex = Math.floor(mouseChartY / heightPerGroup);
							var countyObject = firstModeCountyObjects[countyIndex];
							console.log('click may be in county: ' + countyObject.label);
						}
					})
					// 				svgElement.on('elementMouseMove', function (event) {
					// 					var mousePosition = d3.mouse(this);
					// 					var mouseX = mousePosition[0];
					// 					var mouseY = mousePosition[1];
					// 					//var chartCoordsX = xScaleFunction.invert(mouseX);
					// 					//console.log('Click on nvd3 svgElement mouseX:' + mouseX + ', mouseY:' + mouseY + '. chartCoordsX: ' + chartCoordsX);
					// 					var chartCoordsX = yScaleFunction.invert(mouseY);
					// 					console.log('Click on nvd3 svgElement mouseX:' + mouseX + ', mouseY:' + mouseY + '. chartCoordsX: ' + chartCoordsX);
					// 				})
			}
			, dispatch: {
				renderEnd: function (e) {
					console.log("renderEnd dispatched");
				}
			} //end dispatch 
			
			, elementClick: function (e) {
					console.log("element dispatched");
				} //end elementClick
		});
	});
}()); //end encapsulating IIFE