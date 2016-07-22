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
	var selector = ".chart";
	var hierarchicalData = newData;
	//hierarchicalData = long_short_data;
	var chart;
	var colorScale = d3.scale.category20();
	nv.addGraph(function chartGenerator() {
		chart = nv.models.multiBarHorizontalChart().x(function (d) {
			return d.label
		}).y(function (d) {
			return d.value
		}).color(function(d,i) {
			var modeColorIndex = parseInt(Math.floor(i  / hierarchicalData.length));
			var color = colorScale(i);
			console.log('barColor i=' + i + ' modeColorIndex=' + modeColorIndex + ' mode=' + d.key + ' county=' + d.label + ' count=' + d.value + ' color=' + color);
			return color;
			}).duration(250).margin({
			left: 100
		}).stacked(true);
		chart.yAxis.tickFormat(d3.format(',.2f'));
		chart.yAxis.axisLabel('Y Axis');
		chart.xAxis.axisLabel('X Axis').axisLabelDistance(20);
		var svg = d3.select(selector);
		svg.datum(hierarchicalData).call(chart);
		nv.utils.windowResize(chart.update);
		chart.dispatch.on('stateChange', function (e) {
			nv.log('New State:', JSON.stringify(e));
		});
		chart.state.dispatch.on('change', function (state) {
			nv.log('state', JSON.stringify(state));
		});
		return chart;
	}, function () {
		console.log('chart generator must be finished')
	});
});

//example to shaow the format we are munging the data
var sampleMultiChartData = [
	{
		key: 'Walk'
		, values: [
			{
				"label": "Atlanta"
				, "value": 345
                }
			, {
				"label": "Miami"
				, "value": 5045
                }
            ]
        }
	, {
		key: 'Drive'
		, values: [
			{
				"label": "Atlanta"
				, "value": 8922
                }
			, {
				"label": Miami"
				, "value": 10598
                }
            ]
        }
	, {
		key: 'Series3'
		, values: [
			{
				"label": "Group A"
				, "value": -14.307646510375
                }
			, {
				"label": "Group B"
				, "value": 16.756779544553
                }
			, {
				"label": "Group C"
				, "value": -18.451534877007
                }
			, {
				"label": "Group D"
				, "value": 8.6142352811805
                }
			, {
				"label": "Group E"
				, "value": -7.8082472075876
                }
			, {
				"label": "Group F"
				, "value": 15.259101026956
                }
			, {
				"label": "Group G"
				, "value": -0.30947953487127
                }
			, {
				"label": "Group H"
				, "value": 0
                }
			, {
				"label": "Group I"
				, "value": 0
                }
            ]
        }
    ];