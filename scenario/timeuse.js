//encapsulate all code within a IIFE (Immediately-invoked-function-expression) to avoid polluting global namespace
//global object timeuse will contain functions and variables that must be accessible from elsewhere
var timeuse = (function () {
	"use strict";
	var url = "../data/" + abmviz_utilities.GetURLParameter("scenario") + "/TimeUseData.csv";
	var svgSelector = "#timeuse-chart svg";
	var svgElement = d3.select(svgSelector);
	var extNvd3Chart;
	var legendBoxWidth = 150;
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
	var personTypes;
	var rolledUpMap;
	var personTypeSelector;
	var personTypeSelectorOptions;
	var origPurposesArray;
	var periods = new Set();

	function createTimeuse() {
		//read in data and create timeuse when finished
		if (rolledUpMap === undefined) {
			d3.text(url, function (error, data) {
				"use strict";
				var requiredOrigPurposesArray = ["HOME", "UNIVERSITY", "SCHOOL", "WORK"];
				var requiredOrigPurposesSet = new Set(requiredOrigPurposesArray);
				var requiredOrigPurposesFound = new Set();
				var nonRequiredOrigPurposesSet = new Set(); //js sets maintain insertion order https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set
				if (error) throw error; //expected data should have columns similar to: PERSON_TYPE	PER	ORIG_PURPOSE	QUANTITY
				var csv = d3.csv.parseRows(data).slice(1);
				data = null; //allow memory to be GC'ed
				rolledUpMap = d3.nest().key(function (d) {
					return d[0]; //group by PERSON_TYPE
				}).key(function (d) {
					return d[2]; //secondary group by ORIG_PURPOSE
				}).key(function (d) {
					return d[1];
				}).rollup(function (d) {
					var timePeriod = +d[0][1];
					periods.add(timePeriod);
					var origPurpose = d[0][2];
					if (!nonRequiredOrigPurposesSet.has(origPurpose)) {
						if (requiredOrigPurposesSet.has(origPurpose)) {
							if (!requiredOrigPurposesFound.has(origPurpose)) {
								requiredOrigPurposesFound.add(origPurpose);
							}
						}
						else { //else not a required item
							nonRequiredOrigPurposesSet.add(origPurpose);
						}
					} //else already in nonRequiredSet
					return {
						timePeriod: timePeriod
						, quantity: +d[0][3]
					};
				}).map(csv);
				csv = null; //allow memory to be GC'ed
				//cannot simply use nest.entries because there may be missing data (for example: CHILD_TOO_YOUNG_FOR_SCHOOL does not have a WORK ORIG_PURPOSE)
				//rolledUpData = makeNest.entries(csv);
				//var reorderedArray = [];
				//re-order so the starts with WORK, SCHOOL, UNIVERSITY and ends with HOME
				abmviz_utilities.assert(requiredOrigPurposesSet.size == requiredOrigPurposesFound.size, "ORIG_PURPOSE must contain WORK, SCHOOL, UNIVERSITY, and HOME but only found these ones: " + Array.from(requiredOrigPurposesFound));
				origPurposesArray = Array.from(requiredOrigPurposesArray);
				//insert non-reqired items between UNIVERSITY and HOME
				abmviz_utilities.insertArrayAt(origPurposesArray, 1, Array.from(nonRequiredOrigPurposesSet));
				var personTypes = Object.keys(rolledUpMap);
				//convert data to format nvd3 expects it
				//populate drop down of all person -types
				personTypeSelector = d3.select("#timeuse-current-person-type");
				personTypeSelectorOptions = personTypeSelector.selectAll("option").data(personTypes).enter().append("option").text(function (d) {
					return d;
				});
				personTypeSelector.on("change", setPersonType);
				console.log('timeuse finished reading data - about to call updateChart()');
				updateChart();
			}); //end d3.text
		} //end if rolledUpMap === undefined
		else {
			//if already exists don't need to read in and parse again
			updateChart();
		} //end if data already read in
		function setPersonType() {
			updateChart(function () {
				console.log("finished updateChartNVD3 from setPersonType");
			});
		};

		function getPersonTypeChartData(personType) {
			var rolledUpPersonTypeMap = rolledUpMap[personType];
			abmviz_utilities.assert(rolledUpPersonTypeMap != null, "rolledUpPersonTypeMap not found for personType: " + personType);
			var personTypeChartData = [];
			origPurposesArray.forEach(function (origPurpose) {
				var personTypesOrigPurposeArray = rolledUpPersonTypeMap[origPurpose];
				if (personTypesOrigPurposeArray == undefined) {
					//missing data (for example: CHILD_TOO_YOUNG_FOR_SCHOOL does not have a WORK ORIG_PURPOSE)
					//make an empty item to use to fill in personTypes that are missing data
					personTypesOrigPurposeArray = {};
					console.log('Person type "' + personType + '" missing data for purpose: ' + origPurpose);
				}
				var periodDataArray = [];
				//must make sure data has all periods since nvd3 picky
				periods.forEach(function (period) {
					var periodDataObject = personTypesOrigPurposeArray[period];
					if (periodDataObject == undefined) {
						periodDataObject = {
							timePeriod: period
							, quantity: 0
						};
						console.log('Person type "' + personType + '" missing data for period: ' + period);
					}
					else {
						periodDataObject = {
							timePeriod: period
							, quantity: periodDataObject.quantity
						};
					}
					periodDataArray.push(periodDataObject);
				}); //end loop over periods
				personTypeChartData.push({
					key: origPurpose
					, values: periodDataArray
				});
			}); //end loop over origPurposes 
			return personTypeChartData;
		} //end getPersonTypeChartData
		function updateChart(callback) {
			createEmptyChart(function () {
				var newPersonType = personTypeSelector[0][0].value;
				var currentPersonTypeData = getPersonTypeChartData(newPersonType);
				svgElement.datum(currentPersonTypeData).call(extNvd3Chart);
				//kluge - should not need to call nvd3 update here but occassionally in some window positions
				//the legend lays out differently after the first updateChart
				//so call immediately so user will never see the initial legend layout
				extNvd3Chart.update();
				//Way to disable toggle found in: https://github.com/novus/nvd3/issues/590 in comment by liquidpele
				extNvd3Chart.stacked.dispatch.on('areaClick.toggle', function (e) {
					console.log('ignoring chart areaClick.toggle dispatched.');
				});
				extNvd3Chart.stacked.dispatch.on('areaClick', function (e) {
					console.log('ignoring chart areaClick dispatched.');
				});
				//wish to prevent the double click in the legend from toggling off all items other than clicked
				extNvd3Chart.legend.dispatch.on('legendDblclick', function (e) {
					console.log('ignoring chart legend legendDblclick dispatched.');
					//klugey solution is to turn off stateChange and then turn it back on again as soon as possible
					extNvd3Chart.legend.updateState(false);
					setTimeout(function () {
						extNvd3Chart.legend.updateState(true);
					}, 1);
				});
				// 					extNvd3Chart.legend.dispatch.on('stateChange', function(e) {
				// 						console.log('ignoring chart legend stateChange dispatched: ' + JSON.stringify(e));
				// 					});
				if (callback) {
					callback();
				}
			});
			//end updateChart
		};

		function updateChartOLD(callback) {
			var newPersonType = personTypeSelector[0][0].value;
			var currentPersonTypeData = getPersonTypeChartData(newPersonType);
			console.log("changed person type to: " + newPersonType);
			//poll every 150ms for up to two seconds waiting for chart
			abmviz_utilities.poll(function () {
				return extNvd3Chart != undefined;
			}, function () {
				var datum = currentPersonTypeData;
				//svgElement.datum([]).call(extNvd3Chart);
				svgElement.datum(datum).call(extNvd3Chart, function () {
					console.log('does datum have a callback?');
				});
				extNvd3Chart.update();
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
						.clipEdge(true).id("timeuse-stackedAreaChart").useInteractiveGuideline(true) //Tooltips which show all data points. Very nice!
						.showControls(true).style('expand'); //Allow user to choose 'Stacked', 'Stream', 'Expanded' mode.
					//How to Remove control options from NVD3.js Stacked Area Chart
					//http://www.bainweb.com/2015/09/how-to-remove-control-options-from.html
					chart._options.controlOptions = ['Stacked', 'Expanded'];
					//Format x-axis labels with custom function. 
					chart.xAxis.tickFormat(function (d) {
						var halfHoursPast3Am = d - 1;
						//period is from 1 to 48 and is in half hours starting at 3 am
						var hours = (Math.floor(halfHoursPast3Am / 2) + 3) % 24;
						var minutes = (halfHoursPast3Am % 2) * 30; //if period is odd then add half hour
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
					nv.utils.windowResize(chart.update);
					chart.dispatch.on('changeState', function (e) {
						console.log('chart changeState dispatched: ' + JSON.stringify(e));
					});
					chart.dispatch.on('renderEnd', function (e) {
						console.log('chart renderEnd dispatched: ' + JSON.stringify(e));
					});
					chart.dispatch.on('stateChange', function (e) {
						console.log('chart stateChange dispatched: ' + JSON.stringify(e));
					});
					return chart;
				}
				, callback: function (newGraph) {
						console.log("timeuse nv.addGraph callback called");
						extNvd3Chart = newGraph;
						if (myCallback) {
							myCallback();
						}
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