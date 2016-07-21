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
	var modesInEncounterOrder = []
	var countiesNestFunctions = d3.nest().key(function (d) {
		return d[countyColumn];
	}).key(function (d) {
		var mode = d[modeColumn];
		//keep set for quick checking of whether we saw before
		if (!uniqueModes.has(mode)) {
		uniqueModes.add(mode);
		//but also wish to retain order for display
				modesInEncounterOrder.push(mode);	
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
	countiesNest.forEach(function (countiesObject) {
		for (var i = countiesObject.values.length - 1; i--;) {
			if (countiesObject.values[i].key === "TOTAL") {
				//delete from array
				countiesObject.values.splice(i, 1);
			}
		}
	});
	countiesNest.forEach(function (d) {
		d.values = d.values.map(function (countyObject) {
			var returnObject = {
				label: countyObject.key
				, value: countyObject.values.county_mode_total
			};
			return returnObject;
		});
	});
	var selector = "#chart_peter svg";
	var hierarchicalData = countiesNest;
	//hierarchicalData = long_short_data;
	var chart;
	nv.addGraph(function chartGenerator() {
		chart = nv.models.multiBarHorizontalChart().x(function (d) {
			return d.label
		}).y(function (d) {
			return d.value
		}).yErr(function (d) {
			return [-Math.abs(d.value * Math.random() * 0.3), Math.abs(d.value * Math.random() * 0.3)]
		}).barColor(d3.scale.category20().range()).duration(250).margin({
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

    var long_short_data = [
        {
            key: 'Series1',
            values: [
                {
                    "label" : "Group A" ,
                    "value" : -1.8746444827653
                } ,
                {
                    "label" : "Group B" ,
                    "value" : -8.0961543492239
                } ,
                {
                    "label" : "Group C" ,
                    "value" : -0.57072943117674
                } ,
                {
                    "label" : "Group D" ,
                    "value" : -2.4174010336624
                } ,
                {
                    "label" : "Group E" ,
                    "value" : -0.72009071426284
                } ,
                {
                    "label" : "Group F" ,
                    "value" : -2.77154485523777
                } ,
                {
                    "label" : "Group G" ,
                    "value" : -9.90152097798131
                } ,
                {
                    "label" : "Group H" ,
                    "value" : 14.91445417330854
                } ,
                {
                    "label" : "Group I" ,
                    "value" : -3.055746319141851
                }
            ]
        },
        {
            key: 'Series2',
            values: [
                {
                    "label" : "Group A" ,
                    "value" : 25.307646510375
                } ,
                {
                    "label" : "Group B" ,
                    "value" : 16.756779544553
                } ,
                {
                    "label" : "Group C" ,
                    "value" : 18.451534877007
                } ,
                {
                    "label" : "Group D" ,
                    "value" : 8.6142352811805
                } ,
                {
                    "label" : "Group E" ,
                    "value" : 7.8082472075876
                } ,
                {
                    "label" : "Group F" ,
                    "value" : 5.259101026956
                } ,
                {
                    "label" : "Group G" ,
                    "value" : 7.0947953487127
                } ,
                {
                    "label" : "Group H" ,
                    "value" : 8
                } ,
                {
                    "label" : "Group I" ,
                    "value" : 21
                }
            ]
        },
        {
            key: 'Series3',
            values: [
                {
                    "label" : "Group A" ,
                    "value" : -14.307646510375
                } ,
                {
                    "label" : "Group B" ,
                    "value" : 16.756779544553
                } ,
                {
                    "label" : "Group C" ,
                    "value" : -18.451534877007
                } ,
                {
                    "label" : "Group D" ,
                    "value" : 8.6142352811805
                } ,
                {
                    "label" : "Group E" ,
                    "value" : -7.8082472075876
                } ,
                {
                    "label" : "Group F" ,
                    "value" : 15.259101026956
                } ,
                {
                    "label" : "Group G" ,
                    "value" : -0.30947953487127
                } ,
                {
                    "label" : "Group H" ,
                    "value" : 0
                } ,
                {
                    "label" : "Group I" ,
                    "value" : 0
                }
            ]
        }
    ];
