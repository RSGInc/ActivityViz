//encapsulate all code within a IIFE (Immediately-invoked-function-expression) to avoid polluting global namespace
//global object timeuse will contain functions and variables that must be accessible from elsewhere
var timeuse = (function () {
	"use strict";
	var url = "../data/" + abmviz_utilities.GetURLParameter("scenario") + "/TimeUseData.csv";
	var svgSelector = "#timeuse-chart svg";
	var svgElement = d3.select(svgSelector);
	var extNvd3Chart;
	var legendBoxWidth = 150;
	var legendDepthIndent = 10;
	var json = null;
	var nodeVisuals;
	var legendRects;
	var legendTexts;
	var legendGroups;
	// Dimensions of legend item: width, height, spacing, radius of rounded rect.
	var li = {
		w: legendBoxWidth
		, h: 22
		, s: 3
		, r: 3
	};
	var colors = {}; //will be filled in to map keys to colors
	// Total size of all segments; we set this later, after loading the data.
	var totalSize;
	var personTypes;
	var rolledUpData;
	var personTypeSelector;
	var personTypeSelectorOptions;
	var nvd3Data = {};

	function createTimeuse() {
		//read in data and create timeuse when finished
		if (json === null) {
			d3.text(url, function (error, data) {
				"use strict";
				if (error) throw error; //expected data should have columns similar to: PERSON_TYPE	PER	ORIG_PURPOSE	QUANTITY
				var csv = d3.csv.parseRows(data).slice(1);
				var singleLevelNest = d3.nest().key(function (d) {
					return d[0];
				});
				var doubleLevelNest = singleLevelNest.key(function (d) {
					return d[2];
				});
				var tripleLevelNest = doubleLevelNest.key(function (d) {
					d.period = d[2];
					return d[1];
				});
				var rollUpTripleNest = tripleLevelNest.rollup(function (leaves) {
					return {
						"numPurposes": leaves.length
						, "total_quantity": d3.sum(leaves, function (d) {
							return parseInt(d[3]);
						})
					};
				});
				var rolledUpMap = rollUpTripleNest.map(csv);
				rolledUpData = rollUpTripleNest.entries(csv);
				rolledUpData.forEach(function (d) {
						var personTypeData = [];
						nvd3Data[d.key] = personTypeData;
					})
					//convert data to format nvd3 expects it
					//populate drop down of all person -types
				personTypeSelector = d3.select("#timeuse-current-person-type");
				personTypeSelectorOptions = personTypeSelector.selectAll("option").data(rolledUpData).enter().append("option").text(function (d) {
					return d.key;
				});
				personTypeSelector.on("change", setPersonType);
				createEmptyChart();
			}); //end d3.text
		} //end if json == null
		else {
			//if already exists don't need to read in and parse again
			createEmptyChart();
		} //end if data already read in
		function setPersonType() {
			updateChart(function () {
				console.log("finished updateChartNVD3 from setPersonType");
			});
		};

		function updateChart(callback) {
			var selectedIndex = personTypeSelector.node().selectedIndex;
			var currentPersonTypeData = rolledUpData[selectedIndex];
			//alternative curData = personTypeSelectorOptions[0][selectedIndex].__data__
			var newPersonType = currentPersonTypeData.key;
			console.log("changed person type to: " + newPersonType);
			//poll every 150ms for up to two seconds waiting for chart
			abmviz_utilities.GetURLParameter("fish");
			abmviz_utilities.poll(function () {
				return extNvd3Chart != undefined;
			}, function () {
				var datum = currentPersonTypeData.values;
				svgElement.datum(datum).call(extNvd3Chart);
			}, function () {
				throw "something is wrong -- extNvd3Chart still doesn't exist after polling "
			}); //end call to poll
			if (callback != undefined) {
				callback();
			}
			//end updateChart
		};

		function createEmptyChart() {
			//https://bl.ocks.org/kerryrodden/7090426
			// Main function to draw and set up the visualization, once we have the data.
			// Basic setup of page elements.
			var timeuseBounds = d3.select("#timeuse-main").node().getBoundingClientRect();
			//http://nvd3.org/examples/stackedArea.html
			nv.addGraph({
				generate: function () {
					var chart = nv.models.stackedAreaChart().margin({
							right: 100
						}).x(function (d) {
							return parseInt(d.key);
						}) //We can modify the data accessor functions...
						.y(function (d) {
							return d.values.total_quantity;
						}) //...in case your data is formatted differently.
						.clipEdge(true).useInteractiveGuideline(true) //Tooltips which show all data points. Very nice!
						.showControls(true); //Allow user to choose 'Stacked', 'Stream', 'Expanded' mode.
					//Format x-axis labels with custom function.
					// 					chart.xAxis.tickFormat(function (d) {
					// 						return d3.time.format('%x')(new Date(d))
					// 					});
					chart.yAxis.tickFormat(d3.format(',.2f'));
					nv.utils.windowResize(chart.update);
					return chart;
				}
				, callback: function (newGraph) {
						console.log("timeuse nv.addGraph callback called");
						extNvd3Chart = newGraph;
						updateChart(function () {
							console.log("updateChart callback during after the nvd3 callback called");
						});
					} //end callback function
			}); //end nv.addGraph
		}; //end createEmptyChart 
	}; //end createTimeuse
	createTimeuse();
	window.addEventListener("resize", function () {
		console.log("Got resize event. Calling timeuse");
		createTimeuse();
	});
	//return only the parts that need to be global
	return {};
}()); //end encapsulating IIFEE