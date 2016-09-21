//encapsulate all code within a IIFE (Immediately-invoked-function-expression) to avoid polluting global namespace
//global object radar will contain functions and variables that must be accessible from elsewhere
var radar = (function () {
	"use strict";
	var legendBoxWidth = 240;
	var nodeVisuals;
	var legendRects;
	var legendTexts;
	var legendGroups;
	var displayedCharts = new Set();
	// Dimensions of legend item: width, height, spacing, radius of rounded rect.
	var li = {
		w: legendBoxWidth
		, h: 22
		, s: 15
		, r: 3
	};
	var chartData;
	var chartColor = "#0000FF"; //blue
	var AXIS_COLUMN = 0;
	var QUANTITY_COLUMN = 1;
	var CHART_COLUMN = 2;

	function createRadar() {
		//read in data and create radar when finished
		if (chartData === undefined) {
			d3.text("../data/" + abmviz_utilities.GetURLParameter("scenario") + "/RadarChartsData.csv", function (error, data) {
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
						axisInfo.percentageScale = d3.scale.linear().domain([axisInfo.min, axisInfo.max]).range([0, 1]);
					}
				}
				csv = null; //allow memory to be GC'ed
				//convert data to format nvd3 expects it
				//populate drop down of all person -types
				chartData = [];
				var minSumPercentages = 10000;
				var maxSumPercentages = -10000;
				Object.keys(rolledUpMap).forEach(function (chartName) {
					var sumPercentages = 0;
					var axesData = [];
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
								radarAxisDataObject.percentValue = axisInfo.percentageScale(radarAxisDataObject.value);
								sumPercentages += radarAxisDataObject.percentValue;
							}
							axesData.push(radarAxisDataObject);
						}
					}; //end loop over radarAxes
					minSumPercentages = Math.min(minSumPercentages, sumPercentages);
					maxSumPercentages = Math.max(maxSumPercentages, sumPercentages);
					chartData.push({
						chartName: chartName
						, axes: axesData
						, sumPercentages: sumPercentages
					});
					//end loop over charts
				});
				//now calculate color as scaled value of the max and min sumPercentages
				var identityScale = d3.scale.linear().domain([minSumPercentages, maxSumPercentages]).range([0, 1]);
				var opacityScale = d3.scale.linear().domain([minSumPercentages, maxSumPercentages]).range([.2, 0.8]);
				chartData.forEach(function (chartDatum) {
					chartDatum.scaledOpacity = opacityScale(chartDatum.sumPercentages);
					chartDatum.scaledPercentage = identityScale(chartDatum.sumPercentages);
				});
				drawLegend();
				console.log('radar finished reading and processing data');
				createCharts();
			}); //end d3.text
		} //end if chartData === undefined
		else {
			//if just a window resize, don't re-read data
			//createEmptyChart(updateChart);
		}

		function createCharts() {
			var portlets = d3.select("#radar-chart").selectAll(".portlet").data(chartData);
			var divPortlets = portlets.enter().append("div").attr("class", "portlet").attr("id", function (d) {
				return "radar-" + d.className;
			});
			divPortlets.append("div").attr("class", "portlet-header").text(function (d) {
				return d.chartName;
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
					, color: function () {
						return chartColor;
					}
					, tooltipFormatValue: abmviz_utilities.numberWithCommas
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

		function drawLegend() {
			var textGreyScale = d3.scale.linear().domain([0, 1]).range(["black", "white"]);
			d3.select("#radar-legend svg").remove(); //remove in case this is a window resize event
			//for height leave an extra slot so that when showing active nodes at top can have a space separating from rest of legend
			var totalLegendHeight = chartData.length * (li.h + li.s);
			var legend = d3.select("#radar-legend").append("svg:svg").attr("width", legendBoxWidth).attr("height", totalLegendHeight);
			legendGroups = legend.selectAll("g").data(chartData).enter().append("svg:g").attr("transform", function (d, i) {
				return "translate(0," + i * (li.h + li.s) + ")";
			});
			legendRects = legendGroups.append("svg:rect").attr("rx", li.r).attr("ry", li.r).attr("width", li.w).attr("height", li.h).attr("style", function (chartDatum, i) {
				return "fill: " + chartColor + "; opacity: " + chartDatum.scaledOpacity;
			}).on("mouseover", function (chartDatum, i) {
				//do something to highlight this chart?
			});
			legendTexts = legendGroups.append("svg:text").attr("x", li.w / 2).attr("y", li.h / 2).attr("dy", "0.35em").attr("text-anchor", "middle")
				// 			.style("fill", function (chartDatum, i) 	
				// 				return ((chartDatum.scaledPercentage > .4) && (chartDatum.scaledPercentage < .6)) ? "white" : textGreyScale(chartDatum.scaledPercentage);
				// 				})
				.text(function (chartDatum) {
					return chartDatum.chartName;
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