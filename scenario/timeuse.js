//encapsulate all code within a IIFE (Immediately-invoked-function-expression) to avoid polluting global namespace
//global object timeuse will contain functions and variables that must be accessible from elsewhere
var timeuse = (function () {
	"use strict";
	var url = "../data/" + abmviz_utilities.GetURLParameter("scenario") + "/TimeUseData.csv";
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
					return d[1];
				});
				var tripleLevelNest = doubleLevelNest.key(function (d) {
					return d[2];
				});
				var rollUpTripleNest = tripleLevelNest.rollup(function (leaves) {
					return {
						"numPurposes": leaves.length
						, "total_quantity": d3.sum(leaves, function (d) {
							return parseInt(d[3]);
						})
					};
				});
				var rolledUpData = rollUpTripleNest.entries(csv);
				//populate drop down of all person -types
				var personTypeSelector = d3.select("#timeuse-current-person-type");
				personTypeSelector.selectAll("option").data(rolledUpData).enter().append("option").text(function (d) {
					return d.key;
				});
				personTypeSelector.on("change", function() {
					var newPersonType = this.value;
					console.log("changed person type to: " + newPersonType);
				});
				
				createVisualization(rolledUpData);
			}); //end d3.text
		}
		else {
			//if already exists don't need to read in and parse again
			createVisualization(rolledUpData);
		}
		//https://bl.ocks.org/kerryrodden/7090426
		// Main function to draw and set up the visualization, once we have the data.
		function createVisualization(rolledUpData) {
			// Basic setup of page elements.
			var timeuseBounds = d3.select("#timeuse-main").node().getBoundingClientRect();
			//http://nvd3.org/examples/stackedArea.html
			nv.addGraph(function () {
				var chart = nv.models.stackedAreaChart().margin({
						right: 100
					}).x(function (d) {
						return d[0]
					}) //We can modify the data accessor functions...
					.y(function (d) {
						return d[1]
					}) //...in case your data is formatted differently.
					.useInteractiveGuideline(true) //Tooltips which show all data points. Very nice!
					.rightAlignYAxis(true) //Let's move the y-axis to the right side.
					.transitionDuration(500).showControls(true) //Allow user to choose 'Stacked', 'Stream', 'Expanded' mode.
					.clipEdge(true);
				//Format x-axis labels with custom function.
				chart.xAxis.tickFormat(function (d) {
					return d3.time.format('%x')(new Date(d))
				});
				chart.yAxis.tickFormat(d3.format(',.2f'));
				d3.select('#timeuse-chart svg').datum(rolledUpData).call(chart);
				nv.utils.windowResize(chart.update);
				return chart;
			});
		}; //end createVisualization 
	}; //end createTimeuse
	createTimeuse();
	window.addEventListener("resize", function () {
		console.log("Got resize event. Calling timeuse");
		createTimeuse();
	});
	//return only the parts that need to be global
	return {};
}()); //end encapsulating IIFEE