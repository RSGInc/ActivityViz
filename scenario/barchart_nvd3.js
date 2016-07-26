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
			, "county_mode_total": d3.sum(leaves, function (d) {
				return +d[quantityColumn]
			})
		}
	})
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
					modeCountyTotal = countyModeObject.values.county_mode_total;
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
	nv.addGraph(function chartGenerator() {
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
	}, function () {
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
	});
});