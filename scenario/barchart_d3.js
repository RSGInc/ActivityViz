//encapsulate all code within a IIFE (Immediately-invoked-function-expression) to avoid polluting global namespace
var barchart_d3 = (function () {
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
	var url = "../data/" + GetURLParameter("scenario") + "/BarChartAndMapData.csv"
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
		//need to make every county contain all modes in the same order
		//also remove unneeded 'TOTAL' psuedo-mode
		var groupSubgroupData = []
		countiesNest.forEach(function (countyObject) {
			var subgroups = [];
			var newCountyObject = {
				groupLabel: countyObject.key
				, subgroups: subgroups
			};
			groupSubgroupData.push(newCountyObject);
			for (var modeIndex = 0; modeIndex < modesInEncounterOrder.length; modeIndex++) {
				var modeName = modesInEncounterOrder[modeIndex];
				var countyModeObjects = countyObject.values;
				var countyModeTotal = 0; //initialize in case mode not in county
				for (var i = countyModeObjects.length - 1; i--;) {
					var countyModeObject = countyModeObjects[i];
					if (countyModeObject.key == "TOTAL") {
						//delete from array
						countyModeObjects.splice(i, 1);
					}
					else if (countyModeObject.key == modeName) {
						countyModeTotal = countyModeObject.values.countyModeTotal;
					}
				} //end loop over countyMode objects
				var subgroup = {
					subgroupLabel: modeName
					, value: countyModeTotal
				};
				subgroups.push(subgroup);
			} //end loop over modes in encounterOrder
		}); //end loop over countiesNest
		countiesNest = null;
		allData = groupSubgroupData;
		svgSelector = "#barchart_d3";
		drawChart();
	});
	//from https://gist.github.com/tianhuil/7936887
	// data is a list of objects d
	// d.groupLabel -> label for the group
	// d.subgroups is a list of subgroup objects
	// subgroup.subgroupLabel -> label
	// subgroup.value -> value
	var disabledCounties = new Set([]);
	var disabledModes = new Set([]);
	var svgSelector;
	var allData;
	function drawChart() {
		var subgroupLabels = _.union.apply(this, _.map(allData, function (d) {
			return _.map(d.subgroups, function (g) {
				return g.subgroupLabel;
			});
		}));

		
		enabledData = [];
		allData.forEach(function(countyObject) {
			if (disabledCounties.has(countyObject.groupLabel)) {
				//skip it
			} else {
				var subgroups = [];
				enabledData.push({ groupLabel: countyObject.groupLabel,
									subgroups: subgroups
									});
				countyObject.subgroups.forEach(function(countyModeObject) {
					if (disabledModes.has(countyModeObject.subgroupLabel)) {
						//skip it
					} else {
						subgroups.push({subgroupLabel: countyModeObject.subgroupLabel,
						value: countyModeObject.value});
					}
				});	//end forEach over countyModes objects
			}	//end else enabled
		});	//end forEach over county objects

		var marginLeft = 70;
		var marginRight = 10;
		var marginTop = 30;
		var marginBottom = 50;
		var svgElement = d3.select(svgSelector);
		var parentBoundingBox = svgElement.node().parentNode.getBoundingClientRect();
		var svgWidth = parentBoundingBox.width;
		var chartWidth = svgWidth - (marginLeft + marginRight);
		console.log("barchart_and_map based on parent element of svg, setting svgWidth=" + svgWidth + ", chartWidth=" + chartWidth);
		var numGroups = allData.length - disabledCounties.size;
		var numSubgroups = subgroupLabels.length - disabledModes.size;
		var pixelsPerBar = 2;
		var gapBetweenGroups = 5;
		var chartHeight = numGroups * ((numSubgroups * pixelsPerBar) + gapBetweenGroups);
		var svgHeight = chartHeight + marginTop + marginBottom;
		var x = d3.scale.linear().range([0, chartWidth]);
		var y0 = d3.scale.ordinal().rangeRoundBands([chartHeight, 0], .1);
		var y1 = d3.scale.ordinal();
		var colorScale = d3.scale.category20();
		var xAxis = d3.svg.axis().scale(x).orient("bottom").tickFormat(d3.format(".2s"));
		var yAxis = d3.svg.axis().scale(y0).orient("left");
		//set the svg to the size of entire chart + margins
		svgElement.attr("width", svgWidth).attr("height", svgHeight)
		var chartG = svgElement.append("g").attr("transform", "translate(" + marginLeft + "," + marginTop + ")");
		y0.domain(allData.map(function (d) {
			return d.groupLabel;
		}));
		y1.domain(subgroupLabels).rangeRoundBands([0, y0.rangeBand()]);
		x.domain([0, d3.max(allData, function (d) {
			return d3.max(d.subgroups, function (d) {
				return d.value;
			});
		})]);
		chartG.append("g").attr("class", "x axis").attr("transform", "translate(0," + chartHeight + ")").call(xAxis).append("text").attr("x", chartWidth).attr("dy", "-.71em").style("text-anchor", "end").text("Population");
		chartG.append("g").attr("class", "y axis").call(yAxis);
		var group = chartG.selectAll(".group").data(allData, function(d) { return d.groupLabel;}).enter().append("g").attr("class", "group").attr("transform", function (d) {
			return "translate(0," + y0(d.groupLabel) + ")";
		});
		//the group is the county. The subgroups are the travel modes
		group.selectAll("rect.subgroup").data(function (d) {
			return d.subgroups;
		}, function(d) {return d.subgroupLabel}).enter().append("rect").attr("class", function (d, i) {
			//two classes subgroup and particular subgroup
			return "subgroup " + d.subgroupLabel;
		}).attr("height", y1.rangeBand()).attr("x", 0).attr("y", function (d) {
			return y1(d.subgroupLabel);
		}).attr("width", function (d) {
			return x(d.value);
		}).style("fill", function (d, i) {
			var color = colorScale(i);
			//console.log("fill color for d.subgroupLabel=" + d.subgroupLabel + ", index=" + i + ", color=" + color);
			return colorScale(i);
		});
		var legendUpdateSelection = chartG.selectAll(".legend").data(subgroupLabels, function(d) {return d;})

		var legendObjects = legendUpdateSelection.enter().append("g").attr("class", "legend").attr("transform", function (d, i) {
			return "translate(0," + i * 20 + ")";
		});

		legendUpdateSelection.classed("disabled", function(d) {
			return disabledModes.has(d);
		})

		legendObjects.on('click', function (d, i) {
			//is this subgroup currently showing?
			var subgroupLabel = d;	//since list of subgroups used as data
			//must toggle current enabled/disabled state
			if (disabledModes.has(subgroupLabel)) {
				disabledModes.delete(subgroupLabel);
			} else {
				disabledModes.add(subgroupLabel);
			}
			drawChart();
		});
		var legendRectSize = 18;
		var legendRectCenter = chartWidth - (legendRectSize + 1);
		legendObjects.append("rect").attr("x", legendRectCenter).attr("width", legendRectSize).attr("height", legendRectSize).style("fill", function (d, i) {
			return colorScale(i);
		});
		legendObjects.append("text").attr("x", legendRectCenter - (legendRectSize / 2) + 1).attr("y", legendRectSize / 2).attr("dy", ".35em").style("text-anchor", "end").text(function (d) {
			return d;
		});
		var heightPerGroup = chartHeight / numGroups;
		group.append("rect").attr("class", "group-overlay").attr("height", heightPerGroup).attr("width", chartWidth + marginLeft).style("fill-opacity", "0.0") //transparent
			.style("stroke-opacity", "1.0").attr("x", -marginLeft).attr("y", 0).on('click', function (e) {
				console.log('got click on target groupLabel: ' + e.groupLabel);
			});
	} //end horizontalGroupedBarGraph()
}()); //end encapsulating IIFE