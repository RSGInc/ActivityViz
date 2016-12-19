//encapsulate all code within a IIFE (Immediately-invoked-function-expression) to avoid polluting global namespace
//global object grouped_barchart will contain functions and variables that must be accessible from elsewhere
var grouped_barchart = (function () {
	"use strict";
	var chartData;
	var subGroupColumn;
	var mainGroupColumn;
	var quantityColumn;
	var mainGroupSet;
	var subGroupSet;
	var url = "../data/" + abmviz_utilities.GetURLParameter("scenario") + "/BarChartData.csv"
	var chartSelector = "#grouped-barchart";
	var svgChart;
	var extNvd3Chart;
	var minBarWidth = 2;
	var minBarSpacing = 1;
	var marginTop = 0;
	var marginBottom = 50;
	var marginLeft = 250;
	var marginRight = 50;
	var barsWrap;
	var barsWrapRect;
	var barsWrapRectHeight;
	var currentMainGroup;
	var pivotData = false;
	var showPercentages = false;
	var barsWrapRectId = "grouped-barchart-barsWrapRectRSG"
	var barsWrapRectSelector = "#" + barsWrapRectId;
	$("#scenario-header").html("Scenario " + abmviz_utilities.GetURLParameter("scenario"));
	//start off chain of initialization by reading in the data	
	function readInDataCallback() {
		setDataSpecificDOM();
		svgChart = d3.select(chartSelector);
		createEmptyChart();
		initializeMuchOfUI();
	}; //end readInDataCallback
	//start off chain of initialization by reading in the data	
	readInData(readInDataCallback);

	function readInData(callback) {
		"use strict";
		d3.csv(url, function (error, data) {
			"use strict";
			if (error)
				throw error;
			//expected data should have columns similar to: ZONE,COUNTY,TRIP_MODE_NAME,QUANTITY
			var headers = d3.keys(data[0]);
			mainGroupColumn = headers[0];
			subGroupColumn = headers[1];
			if (pivotData) {
				var temp = mainGroupColumn;
				mainGroupColumn = subGroupColumn;
				subGroupColumn = temp;
			}
			quantityColumn = headers[2];
			mainGroupSet = new Set();
			subGroupSet = new Set();
			//note NVD3 multiBarChart expects data in what seemlike an inverted hierarchy subGroups at top level, containing mainGroups
			var totalsForEachMainGroup = {};
			var rawChartData = d3.nest().key(function (d) {
				//change quantity to an int for convenience right off the bat
				d[quantityColumn] = parseInt(d[quantityColumn]);
				var subGroupName = d[subGroupColumn];
				subGroupSet.add(subGroupName);
				return subGroupName;
			}).key(function (d) {
				var mainGroupName = d[mainGroupColumn];
				if (!mainGroupSet.has(mainGroupName)) {
					mainGroupSet.add(mainGroupName);
					totalsForEachMainGroup[mainGroupName] = 0;
				}
				totalsForEachMainGroup[mainGroupName] += d[quantityColumn];
				return mainGroupName;
			}).rollup(function (objectArray) {
				var oneRow = objectArray[0];
				return oneRow[quantityColumn];
			}).map(data);
			//need to run through rawChartData and put subGroups in order and insert ones that are missing
			chartData = [];
			subGroupSet.forEach(function (subGroupName) {
				var rawSubGroupObject = rawChartData[subGroupName];
				var newSubGroupObject = {
					key: subGroupName,
					values: []
				};
				chartData.push(newSubGroupObject);
				mainGroupSet.forEach(function (mainGroupName) {
					var mainGroupQuantity = rawSubGroupObject[mainGroupName];
					if (mainGroupQuantity == undefined) {
						mainGroupQuantity = 0;
					}
					newSubGroupObject.values.push({
						label: mainGroupName,
						value: mainGroupQuantity,
						percentage: mainGroupQuantity / totalsForEachMainGroup[mainGroupName]
					});
				});
				//end mainGroups foreach
			});
			//end subGroupSet forEach
			callback();
		});
		//end d3.csv
	}; //end readInData
	function setDataSpecificDOM() {
		d3.selectAll(".grouped-barchart-main-group").html(mainGroupColumn);
		d3.selectAll(".grouped-barchart-sub-group").html(subGroupColumn);
		d3.selectAll(".grouped-barchart-sub-group-example").html(chartData[0].key);
	}
	//end setDataSpecificDOM
	function updateChart(callback) {
		"use strict";
		updateChartNVD3(callback);
	}

	function updateChartNVD3(callback) {
		"use strict";
		//poll every 150ms for up to two seconds waiting for chart
		abmviz_utilities.poll(function () {
			return extNvd3Chart != undefined;
		}, function () {
			svgChart.datum(chartData).call(extNvd3Chart);
			//create a rectangle over the chart covering the entire y-axis and to the left of x-axis to include mainGroup labels
			//first check if
			barsWrap = svgChart.select(".nv-barsWrap.nvd3-svg");
			if (barsWrap[0].length == 0) {
				throw ("did not find expected part of chart")
			}
			//if first time (enter() selection) create rect
			//nv-barsWrap nvd3-svg
			barsWrapRect = barsWrap.selectAll(barsWrapRectSelector).data([barsWrapRectId]).enter().insert("rect", ":first-child").attr("id", barsWrapRectId).attr("x", -marginLeft).attr("fill-opacity", "0.0").on("mousemove", function (event) {
				//console.log('barsWrap mousemove');
				var mouseY = d3.mouse(this)[1];
				var numMainGroups = mainGroupSet.size;
				var heightPerGroup = barsWrapRectHeight / numMainGroups;
				var mainGroupIndex = Math.floor(mouseY / heightPerGroup);
				var mainGroupObject = chartData[0].values[mainGroupIndex];
				var newMainGroup = mainGroupObject.label;
				changeCurrentMainGroup(newMainGroup);
			});
			setTimeout(updateChartMouseoverRect, 1000);
		}, function () {
			throw "something is wrong -- extNvd3Chart still doesn't exist after polling "
		});
		//end call to poll
		callback();
	}; //end updateChartNVD3
	function updateChartMouseoverRect() {
		var innerContainer = svgChart.select(".nvd3.nv-wrap.nv-multibarHorizontal");
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
		}
		//end if innerContainerNode exists
		if (tryAgain) {
			console.log('updateChartMouseoverRect called but innerContainerNode is null so will try again shortly');
			setTimeout(updateChartMouseoverRect, 500);
		}
	}
	//end updateChartMouseoverRect
	function changeCurrentMainGroup(newCurrentMainGroup) {
		if (currentMainGroup != newCurrentMainGroup) {
			console.log('changing from ' + currentMainGroup + " to " + newCurrentMainGroup);
			currentMainGroup = newCurrentMainGroup;
			var mainGroupLabels = d3.selectAll("#grouped-barchart-div .nv-x .tick text");
			mainGroupLabels.classed("selected", function (d, i) {
				var setClass = d == currentMainGroup;
				return setClass;
			});
			//end classed of group rect
		}
		//end if mainGroup is changing
	}; //end change currentMainGroup
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
						return showPercentages ? d.percentage : d.value;
					}).color(function (d, i) {
						var color = colorScale(i);
						//console.log('barColor i=' + i + ' columnsColorIndex=' + columnsColorIndex + ' columns=' + d.key + ' mainGroup=' + d.label + ' count=' + d.value + ' color=' + color);
						return color;
					}).duration(250).margin({
						left: marginLeft,
						right: marginRight,
						top: marginTop,
						bottom: marginBottom
					}).id("grouped-barchart-multiBarHorizontalChart").stacked(false).showControls(true);
					nvd3Chart.yAxis.tickFormat(showPercentages	 ?  d3.format('.0%') : d3.format(',.2f'));
					nvd3Chart.yAxis.axisLabel(quantityColumn);
					//this is actually for xAxis since basically a sideways column chart
					nvd3Chart.xAxis.axisLabel(mainGroupColumn).axisLabelDistance(marginLeft - 100);
					//this is actually for yAxis
					nv.utils.windowResize(function () {
						//reset marginTop in case legend has gotten less tall
						nvd3Chart.margin({
							top: marginTop
						});
						updateChart(function () {
							console.log('updateChart callback after windowResize');
						});
					});
					nvd3Chart.multibar.dispatch.on("elementMouseover", function (d, i) {
						var mainGroupUnderMouse = d.value;
						changeCurrentMainGroup(mainGroupUnderMouse);
					});
					//furious has colored boxes with checkmarks
					//nvd3Chart.legend.vers('furious');
					return nvd3Chart;
				} //end generate
				,
			callback: function (newGraph) {
					console.log("nv.addGraph callback called");
					extNvd3Chart = newGraph;
					updateChart(function () {
						console.log("updateChart callback during after the nvd3 callback called");
					});
				} //end callback function
		});
		//end nv.addGraph
	}; //end createEmptyChart

	//WARNING -- this canbe called more than once because of PIVOT reload kluge
	function initializeMuchOfUI() {
		//use off() to remove existing click handleres
		$("#grouped-barchart-stacked").off().click(function () {
			extNvd3Chart.stacked(this.checked);
			extNvd3Chart.update();
		});
		$("#grouped-barchart-pivot-axes").off().click(function () {
			console.log("changing pivotData from " + pivotData + " to " + !pivotData);
			pivotData = !pivotData;
			//klugey -- destroy everything and re-create. 
			$(chartSelector).empty();
			readInData(readInDataCallback);
		});
		$("#grouped-barchart-toggle-percentage").off().click(function () {
			console.log("changing showPercentages from " + showPercentages + " to " + !showPercentages);
			showPercentages = !showPercentages;
			//klugey -- destroy everything and re-create. 
			$(chartSelector).empty();
			readInData(readInDataCallback);
		});

	}; //end initializeMuchOfUI
	//return only the parts that need to be global
	return {};
}());
//end encapsulating IIFE
