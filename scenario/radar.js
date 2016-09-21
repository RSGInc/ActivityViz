//encapsulate all code within a IIFE (Immediately-invoked-function-expression) to avoid polluting global namespace
//global object radar will contain functions and variables that must be accessible from elsewhere
var radar = (function () {
	"use strict";
	var url = "../data/" + abmviz_utilities.GetURLParameter("scenario") + "/RadarChartsData.csv";
	var svgSelector = "#radar-chart";
	var svgElement = d3.select(svgSelector);
	var extNvd3Chart;
	var legendBoxWidth = 240;
	var nodeVisuals;
	var legendRects;
	var legendTexts;
	var legendGroups;
	var chartData;
	var displayedCharts = new Set();
	// Dimensions of legend item: width, height, spacing, radius of rounded rect.
	var li = {
		w: legendBoxWidth
		, h: 22
		, s: 15
		, r: 3
	};
	var AXIS_COLUMN = 0;
	var QUANTITY_COLUMN = 1;
	var CHART_COLUMN = 2;

	function createRadar() {
		//read in data and create radar when finished
		if (chartData === undefined) {
			d3.text(url, function (error, data) {
				"use strict";
				new Set();
				if (error) throw error; //expected data should have columns similar to: AXIS	QUANTITY CHART
				var csv = d3.csv.parseRows(data).slice(1);
				data = null; //allow memory to be GC'ed
				var rolledUpMap = d3.nest().key(function (d) {
						//convert quantity to a number
						d[QUANTITY_COLUMN] = +d[QUANTITY_COLUMN];
						var chartName = d[CHART_COLUMN];
						return chartName; //group by CHART
					}).key(function (d) {
						var radarAxis = d[AXIS_COLUMN];
						return radarAxis; //secondary group by AXIS
					})
					//.key(function (d) {
					//return d[QUANTITY_COLUMN]; //by including quantity, eliminates array of fields in data structure.
					//})
					.rollup(function (d) {
						return {
							axis: d[0][AXIS_COLUMN]
							, value: d[0][QUANTITY_COLUMN]
						};
					}).map(csv);
				//get max and min values for each axis
				var axesInfo = d3.nest().key(function (d) {
					var radarAxis = d[AXIS_COLUMN];
					return radarAxis; //secondary group by AXIS
				}).rollup(function (leaves) {
					return {
						name: leaves[0][AXIS_COLUMN]
						, min: d3.min(leaves, function (d) {
							return d[QUANTITY_COLUMN];
						})
						, max: d3.max(leaves, function (d) {
							return d[QUANTITY_COLUMN];
						})
					};
				}).map(csv);
				//scale each axis to range of 0 to 1 so can report as percentage across best/worst of all charts
				for (var key in axesInfo) {
					if (axesInfo.hasOwnProperty(key)) {
						var axisInfo = axesInfo[key];
						axisInfo.scale = d3.scale.linear().domain([axisInfo.min, axisInfo.max]).range([0, 1]);
					}
				}
				csv = null; //allow memory to be GC'ed
				//convert data to format nvd3 expects it
				//populate drop down of all person -types
				var chartNames = Object.keys(rolledUpMap);
				drawLegend(chartNames);
				chartData = [];
				chartNames.forEach(function (chartName) {
					var axesData = [];
					chartData.push({
						className: chartName
						, axes: axesData
					});
					var rolledUpChartNameMap = rolledUpMap[chartName];
					//must make sure data has all radarAxes since wish each chart to look similar
					for (var key in axesInfo) {
						if (axesInfo.hasOwnProperty(key)) {
							var axisInfo = axesInfo[key];
							var radarAxisDataObject = rolledUpChartNameMap[axisInfo.name];
							//if radarAxis missing from data, create it
							if (radarAxisDataObject == undefined) {
								radarAxisDataObject = {
									axis: radarAxis
									, value: NaN
									, percentValue: 0
								};
								console.log('Chart name "' + chartName + '" missing data for radarAxis: ' + radarAxis);
							}
							else {
								radarAxisDataObject.percentValue = axisInfo.scale(radarAxisDataObject.value);
							}
							axesData.push(radarAxisDataObject);
						}
					}; //end loop over radarAxes
				});
				console.log('radar finished reading and processing data');
				createCharts(chartData);
			}); //end d3.text
		} //end if chartData === undefined
		else {
			//if just a window resize, don't re-read data
			//createEmptyChart(updateChart);
		}

		function createCharts(chartData) {
			var portlets = d3.select("#radar-chart").selectAll(".portlet").data(chartData);
			var divPortlets = portlets.enter().append("div").attr("class", "portlet").attr("id", function (d) {
				return "radar-" + d.className;
			});
			divPortlets.append("div").attr("class", "portlet-header").text(function (d) {
				return d.className;
			});
			var dataIndex = 0;
			divPortlets.append("div").attr("class", "portlet-content").append("svg:svg");
			//RadarChart.defaultConfig.color = function () {};
			//RadarChart.defaultConfig.radius = 3;
			RadarChart.defaultConfig.w = 300;
			RadarChart.defaultConfig.h = 300;
			var chartSvgs = divPortlets.selectAll("svg");
			var chart;
			chartSvgs.datum(function (d) {
				chart = RadarChart.chart();
				chart.config({
					w: 300
					, h: 300
				})
				return [d];
			}).call(chart);
			$(function () {
				$(".column").sortable({
					connectWith: ".column"
					, handle: ".portlet-header"
					, cancel: ".portlet-toggle"
					, placeholder: "portlet-placeholder ui-corner-all"
				});
				$(".portlet").addClass("ui-widget ui-widget-content ui-helper-clearfix ui-corner-all").find(".portlet-header").addClass("ui-widget-header ui-corner-all").prepend("<span class='ui-icon ui-icon-minusthick portlet-toggle'></span>");
				$(".portlet-toggle").on("click", function () {
					var icon = $(this);
					icon.toggleClass("ui-icon-minusthick ui-icon-plusthick");
					icon.closest(".portlet").find(".portlet-content").toggle();
				});
			});
			//end createCharts
		}

		function drawLegend(chartNames) {
			d3.select("#radar-legend svg").remove(); //remove in case this is a window resize event
			//for height leave an extra slot so that when showing active nodes at top can have a space separating from rest of legend
			var totalLegendHeight = chartNames.length * (li.h + li.s);
			var legend = d3.select("#radar-legend").append("svg:svg").attr("width", legendBoxWidth).attr("height", totalLegendHeight);
			legendGroups = legend.selectAll("g").data(chartNames).enter().append("svg:g").attr("transform", function (d, i) {
				return "translate(0," + i * (li.h + li.s) + ")";
			});
			legendRects = legendGroups.append("svg:rect").attr("rx", li.r).attr("ry", li.r).attr("width", li.w).attr("height", li.h).on("mouseover", function (d, i) {
				chartName = d;
				clearHighlightPoints();
				updateChart();
				setChartNameClass();
			});
			legendTexts = legendGroups.append("svg:text").attr("x", li.w / 2).attr("y", li.h / 2).attr("dy", "0.35em").attr("text-anchor", "middle").text(function (d) {
				return d;
			});

			function setChartNameClass() {
				legendRects.classed("radar-current-person-type", function (d) {
					return (displayedCharts.has(d));
				});
			};
			setChartNameClass();
			//end drawLegend
		};
		//end createRadar
	};
	createRadar();
	window.addEventListener("resize", function () {
		console.log("Got resize event. Calling radar");
		createRadar();
	});
	//return only the parts that need to be global
	return {};
}()); //end encapsulating IIFEE