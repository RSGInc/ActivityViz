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
				var radarAxes = new Set();
				if (error) throw error; //expected data should have columns similar to: AXIS	QUANTITY CHART
				var csv = d3.csv.parseRows(data).slice(1);
				data = null; //allow memory to be GC'ed
				var rolledUpMap = d3.nest().key(function (d) {
						var chartName = d[CHART_COLUMN];
						return chartName; //group by CHART
					}).key(function (d) {
						var radarAxis = d[AXIS_COLUMN];
						radarAxes.add(radarAxis);
						return radarAxis; //secondary group by AXIS
					})
					//.key(function (d) {
					//return d[QUANTITY_COLUMN]; //by including quantity, eliminates array of fields in data structure.
					//})
					.rollup(function (d) {
						return {
							axis: d[0][AXIS_COLUMN]
							, value: +d[0][QUANTITY_COLUMN]
						};
					}).map(csv);
				csv = null; //allow memory to be GC'ed
				//convert data to format nvd3 expects it
				//populate drop down of all person -types
				var chartNames = Object.keys(rolledUpMap);
				drawLegend(chartNames);
				chartData = [];
				chartNames.forEach(function (chartName) {
					var axesData = [];
					chartData.push([{
						className: chartName
						, axes: axesData
					}]);
					var rolledUpChartNameMap = rolledUpMap[chartName];
					//must make sure data has all radarAxes since wish each chart to look similar
					radarAxes.forEach(function (radarAxis) {
						var radarAxisDataObject = rolledUpChartNameMap[radarAxis];
						//if radarAxis missing from data, create it
						if (radarAxisDataObject == undefined) {
							radarAxisDataObject = {
								axis: radarAxis
								, value: 0
							};
							console.log('Chart name "' + chartName + '" missing data for radarAxis: ' + radarAxis);
						}
						axesData.push(radarAxisDataObject);
					}); //end loop over radarAxes
				});
				console.log('radar finished reading data');
				createCharts(chartData);
			}); //end d3.text
		} //end if chartData === undefined
		else {
			//if just a window resize, don't re-read data
			//createEmptyChart(updateChart);
		}
		var data = [
			{
				className: 'germany', // optional can be used for styling
				axes: [
					{
						axis: "strength"
						, value: 13
					}
					, {
						axis: "intelligence"
						, value: 6
					}
					, {
						axis: "charisma"
						, value: 5
					}
					, {
						axis: "dexterity"
						, value: 9
					}
					, {
						axis: "luck"
						, value: 2
					}
        ]
      }
			, {
				className: 'argentina'
				, axes: [
					{
						axis: "strength"
						, value: 6
					}
					, {
						axis: "intelligence"
						, value: 7
					}
					, {
						axis: "charisma"
						, value: 10
					}
					, {
						axis: "dexterity"
						, value: 13
					}
					, {
						axis: "luck"
						, value: 9
					}
        ]
      }
    ];

		function randomDataset() {
			return data.map(function (d) {
				return {
					className: d.className
					, axes: d.axes.map(function (axis) {
						return {
							axis: axis.axis
							, value: Math.ceil(Math.random() * 10)
						};
					})
				};
			});
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
		var chart = RadarChart.chart();
		var cfg = chart.config(); // retrieve default config
		var chartSvgs = divPortlets.selectAll("svg");
		chartSvgs.call(chart);
		$(".portlet").addClass("ui-widget ui-widget-content ui-helper-clearfix ui-corner-all").find(".portlet-header").addClass("ui-widget-header ui-corner-all").prepend("<span class='ui-icon ui-icon-minusthick portlet-toggle'></span>");
		$(".portlet-toggle").on("click", function () {
			var icon = $(this);
			icon.toggleClass("ui-icon-minusthick ui-icon-plusthick");
			icon.closest(".portlet").find(".portlet-content").toggle();
		});
	}

	function updateChart(chartName, callback) {
		//poll to make sure chart has finished being created
		abmviz_utilities.poll(function () {
			return extNvd3Chart != undefined;
		}, function () {
			var currentChartNameData = chartData[chartName];
			svgElement.datum(currentChartNameData).call(extNvd3Chart);
			turnOffAreaClick();
			//wish to prevent the double click in the legend from toggling off all items other than clicked
			extNvd3Chart.legend.dispatch.on('legendDblclick', function (e) {
				console.log('ignoring chart legend legendDblclick dispatched.');
				//klugey solution is to turn off stateChange and then turn it back on again as soon as possible
				extNvd3Chart.legend.updateState(false);
				setTimeout(function () {
					extNvd3Chart.legend.updateState(true);
				}, 1);
			});
		}, function () {
			throw "something is wrong -- extNvd3Chart still doesn't exist after polling "
		}); //end call to poll
		if (callback != undefined) {
			callback();
		}
		//end updateChart
	};

	function createEmptyChart(myCallback) {
		//http://nvd3.org/examples/stackedArea.html
		nv.addGraph({
			generate: function () {
				var chart = nv.models.stackedAreaChart().margin({
						right: 100
					}).x(function (d) {
						return d.timePeriod;
					}) //We can modify the data accessor functions...
					.y(function (d) {
						return d.quantity;
					}) //...in case your data is formatted differently.
					.clipEdge(true).id("radar-stackedAreaChart").useInteractiveGuideline(true) //Tooltips which show all data points. Very nice!
					.showControls(false).style('expand'); //Allow user to choose 'Stacked', 'Stream', 'Expanded' mode.
				//How to Remove control options from NVD3.js Stacked Area Chart
				//http://www.bainweb.com/2015/09/how-to-remove-control-options-from.html
				chart._options.controlOptions = ['Stacked', 'Expanded'];
				//Format x-axis labels with custom function. 
				chart.xAxis.tickFormat(function (d) {
					var halfHoursPast3Am = d - 1;
					//radarAxis is from 1 to 48 and is in half hours starting at 3 am
					var hours = (Math.floor(halfHoursPast3Am / 2) + 3) % 24;
					var minutes = (halfHoursPast3Am % 2) * 30; //if radarAxis is odd then add half hour
					//var timeOfDay = twoDigitIntegerFormat(hours) + ':' + twoDigitIntegerFormat(minutes);
					var am = hours < 12;
					var timeOfDayAmPm = (hours % 13);
					if ((halfHoursPast3Am % 2) == 1) {
						timeOfDayAmPm += ':30';
					}
					timeOfDayAmPm += ' ' + ((hours < 12) ? 'am' : 'pm');
					return timeOfDayAmPm;
				});
				chart.yAxis.tickFormat(d3.format(',.2f'));
				//nv.utils.windowResize(chart.update);
				chart.legend.vers('classic');
				return chart;
			}
			, callback: function (newGraph) {
					console.log("radar nv.addGraph callback called");
					extNvd3Chart = newGraph;
					if (myCallback) {
						myCallback();
					}
				} //end callback function
		}); //end nv.addGraph
	}; //end createEmptyChart 
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
	}; //end drawLegend
}; //end createRadar
createRadar(); window.addEventListener("resize", function () {
	console.log("Got resize event. Calling radar");
	createRadar();
});
//return only the parts that need to be global
return {};
}()); //end encapsulating IIFEE