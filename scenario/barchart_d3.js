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
	var countiesNest = d3.nest().key(function (d) {
		return d[countyColumn];
	}).key(function (d) {
		var mode = d[modeColumn];
		uniqueModes.add(mode);
		return mode;
	}).rollup(function (leaves) {
		return {
			"length": leaves.length
			, "county_mode_total": d3.sum(leaves, function (d) {
				return +d[quantityColumn]
			})
		}
	}).entries(csv_data);
	//need to remove all 'TOTAL' modes since not needed and actually inccorrect and not a mode
	countiesNest.forEach(function (countiesObject) {
		for (var i = countiesObject.values.length - 1; i--;) {
			if (countiesObject.values[i].key === "TOTAL") {
				//delete from array
				countiesObject.values.splice(i, 1);
			}
		}
	});
	countiesNest.forEach(function (d) {
		d.subgroups = d.values.map(function (countyObject) {
			var returnObject = {
				subgroupLabel: countyObject.key
				, value: countyObject.values.county_mode_total
			};
			return returnObject;
		});
		d.groupLabel = d.key;
		var deleteResult = delete d.key;
		//console.log('d.key=' + d.key + ' deleteResult=' + deleteResult);
		deleteResult = delete d.values;
		//console.log('d.values=' + d.values + ' deleteResult=' + deleteResult);
	});
	horizontalGroupedBarGraph(countiesNest, "#barchart_d3");
});
//from https://gist.github.com/tianhuil/7936887
// data is a list of objects d
// d.groupLabel -> label for the group
// d.subgroups is a list of subgroup objects
// subgroup.subgroupLabel -> label
// subgroup.value -> value
function horizontalGroupedBarGraph(data, svgSelector) {
	var subgroupLabels = _.union.apply(this, _.map(data, function (d) {
		return _.map(d.subgroups, function (g) {
			return g.subgroupLabel;
		});
	}));
	var marginLeft = 70;
	var marginRight = 10;
	var marginTop = 30;
	var marginBottom = 50;
	var svgElement = d3.select(svgSelector);
	var parentBoundingBox = svgElement.node().parentNode.getBoundingClientRect();
	var svgWidth = parentBoundingBox.width;
	var chartWidth = svgWidth - (marginLeft + marginRight);
	console.log("barchart_and_map based on parent element of svg, setting svgWidth=" + svgWidth + ", chartWidth=" + chartWidth);
	var numGroups = data.length;
	var numSubgroups = subgroupLabels.length;
	var pixelsPerBar = 2;
	var gapBetweenGroups = 5;
	var chartHeight = numGroups * ((numSubgroups * pixelsPerBar) + gapBetweenGroups);
	var svgHeight = chartHeight + marginTop + marginBottom;

	var x = d3.scale.linear().range([0, chartWidth]);
	var y0 = d3.scale.ordinal().rangeRoundBands([chartHeight, 0], .1);
	var y1 = d3.scale.ordinal();
	var color = d3.scale.category20();
	var xAxis = d3.svg.axis().scale(x).orient("bottom").tickFormat(d3.format(".2s"));
	var yAxis = d3.svg.axis().scale(y0).orient("left");
	//set the svg to the size of entire chart + margins
	svgElement.attr("width", svgWidth).attr("height", svgHeight)
	var chartG = svgElement.append("g").attr("transform", "translate(" + marginLeft + "," + marginTop + ")");
	y0.domain(data.map(function (d) {
		return d.groupLabel;
	}));
	y1.domain(subgroupLabels).rangeRoundBands([0, y0.rangeBand()]);
	x.domain([0, d3.max(data, function (d) {
		return d3.max(d.subgroups, function (d) {
			return d.value;
		});
	})]);
	chartG.append("g").attr("class", "x axis").attr("transform", "translate(0," + chartHeight + ")").call(xAxis).append("text").attr("x", chartWidth).attr("dy", "-.71em").style("text-anchor", "end").text("Population");
	chartG.append("g").attr("class", "y axis").call(yAxis);
	var group = chartG.selectAll(".group").data(data).enter().append("g").attr("class", "g").attr("transform", function (d) {
		return "translate(0," + y0(d.groupLabel) + ")";
	});
	group.selectAll("rect").data(function (d) {
		return d.subgroups;
	}).enter().append("rect").attr("height", y1.rangeBand()).attr("x", 0).attr("y", function (d) {
		return y1(d.subgroupLabel);
	}).attr("width", function (d) {
		return x(d.value);
	}).style("fill", function (d) {
		return color(d.subgroupLabel);
	});
	var legend = chartG.selectAll(".legend").data(subgroupLabels).enter().append("g").attr("class", "legend").attr("transform", function (d, i) {
		return "translate(0," + i * 20 + ")";
	});
	var legendRectSize = 18;
	var legendRectCenter = chartWidth - (legendRectSize + 1);
	legend.append("rect").attr("x", legendRectCenter).attr("width", legendRectSize).attr("height", legendRectSize).style("fill", color);
	legend.append("text").attr("x", legendRectCenter - (legendRectSize /2) + 1).attr("y", legendRectSize/2).attr("dy", ".35em").style("text-anchor", "end").text(function (d) {
		return d;
	});
}