//encapsulate all code within a IIFE (Immediately-invoked-function-expression) to avoid polluting global namespace
//global object radar will contain functions and variables that must be accessible from elsewhere
var radar = (function () {
	"use strict";
	var chartData;
	var chartColor = "#0000FF"; //blue
	var AXIS_COLUMN = 0;
	var QUANTITY_COLUMN = 1;
	var CHART_COLUMN = 2;
	var opacityScaleRange = [0.3, 0.9];

	function createRadar() {
		//read in data and create radar when finished
		if (chartData === undefined) {
			d3.text("../data/" + abmviz_utilities.GetURLParameter("scenario") + "/RadarChartsData.csv", function (error, data) {
				"use strict";
				if (error) throw error; //expected data should have columns similar to: AXIS	QUANTITY CHART
				var csv = d3.csv.parseRows(data).slice(1);
				data = null; //allow memory to be GC'ed
				var rolledUpMap = d3.nest().key(function (d) {
						//convert quantity to a number
						d[QUANTITY_COLUMN] = +d[QUANTITY_COLUMN];
						var chartName = d[CHART_COLUMN];
						return chartName; //group by CHART
					}).key(function (d) {
						var radarAxis = d[AXIS_COLUMN];
						return radarAxis; //secondary group by AXIS
					})
					//.key(function (d) {
					//return d[QUANTITY_COLUMN]; //by including quantity, eliminates array of fields in data structure.
					//})
					.rollup(function (d) {
						return {
							axis: d[0][AXIS_COLUMN],
							value: d[0][QUANTITY_COLUMN]
						};
					}).map(csv);
				//get max and min values for each axis
				var axesInfo = d3.nest().key(function (d) {
					var radarAxis = d[AXIS_COLUMN];
					return radarAxis; //secondary group by AXIS
				}).rollup(function (leaves) {
					return {
						name: leaves[0][AXIS_COLUMN],
						min: d3.min(leaves, function (d) {
							return d[QUANTITY_COLUMN];
						}),
						max: d3.max(leaves, function (d) {
							return d[QUANTITY_COLUMN];
						})
					};
				}).map(csv);
				//scale each axis to range of 0 to 1 so can report as percentage across best/worst of all charts
				Object.keys(axesInfo).forEach(function (key) {
					var axisInfo = axesInfo[key];
					axisInfo.percentageScale = d3.scale.linear().domain([axisInfo.min, axisInfo.max]).range([0, 1]);
				});
				csv = null; //allow memory to be GC'ed
				//convert data to format nvd3 expects it
				//populate drop down of all person -types
				chartData = [];
				var minSumPercentages = 10000;
				var maxSumPercentages = -10000;
				var chartId = 1;
				Object.keys(rolledUpMap).forEach(function (chartName) {
					var axesData = [];
					var chartDatumObject = {
						chartId: chartId++,
						chartName: chartName,
						axes: axesData,
						sumPercentages: 0
					}
					chartData.push(chartDatumObject);
					var rolledUpChartNameMap = rolledUpMap[chartName];
					var axisOpacityScale = d3.scale.linear().domain([0, 1]).range(opacityScaleRange);
					//must make sure data has all radarAxes since wish each chart to look similar
					Object.keys(axesInfo).forEach(function (key) {
						var axisInfo = axesInfo[key];
						var radarAxisDataObject = rolledUpChartNameMap[axisInfo.name];
						//if radarAxis missing from data, create it
						if (radarAxisDataObject == undefined) {
							radarAxisDataObject = {
								axis: key,
								originalValue: NaN,
								value: 0
							};
							console.log('Chart name "' + chartName + '" missing data for radarAxis: ' + key);
						} else {
							radarAxisDataObject.originalValue = radarAxisDataObject.value
							radarAxisDataObject.value = axisInfo.percentageScale(radarAxisDataObject.originalValue);
						}
						//at this point 'value' has been overwritten by percent value and original copied to originalValue
						radarAxisDataObject.scaledOpacity = axisOpacityScale(radarAxisDataObject.value);
						chartDatumObject.sumPercentages += radarAxisDataObject.value;
						axesData.push(radarAxisDataObject);
					}); //end loop over radarAxes
					minSumPercentages = Math.min(minSumPercentages, chartDatumObject.sumPercentages);
					maxSumPercentages = Math.max(maxSumPercentages, chartDatumObject.sumPercentages);
					//end loop over charts
				});
				//now calculate color as scaled value of the max and min sumPercentages
				var summedIdentityScale = d3.scale.linear().domain([minSumPercentages, maxSumPercentages]).range([0, 1]);
				var summedOpacityScale = d3.scale.linear().domain([minSumPercentages, maxSumPercentages]).range(opacityScaleRange);
				chartData.forEach(function (chartDatum) {
					chartDatum.percentageBestChart = summedIdentityScale(chartDatum.sumPercentages);
					chartDatum.scaledOpacity = summedOpacityScale(chartDatum.sumPercentages);
				});
				console.log('radar finished reading and processing data');
				createCharts();
			}); //end d3.text
		} //end if chartData === undefined
		else {
			//if just a window resize, don't re-read data
			//createEmptyChart(updateChart);
		}

		function createCharts() {
			var radarChartContainer = d3.select("#radar-chart-container");
			//need to create columns and then fill each column with portlets
			//tricky because (AFAIK) I need to attach the data to each column separately
			var numColumns = 3;
			var radarChartOptions = {
				w: 180,
				h: 150,
				margin: {
					top: 40,
					right: 60,
					bottom: 55,
					left: 60
				},
				tooltipFormatValue: abmviz_utilities.numberWithCommas,
				strokeWidth: 0,
				maxValue: 1.0,
				levels: 3,
				wrapWidth: 70,
				labelFactor: 1.3,
				roundStrokes: true,
				strokeWidth: 0,
				color: function () {
					return chartColor;
				},
				tooltipFormatValue: abmviz_utilities.numberWithCommas
			};
			var chartId = 1;
			for (var columnIndex = 0; columnIndex < numColumns; ++columnIndex) {
				radarChartContainer.append("div").attr("class", "radar-column");
			} //end loop over columns
			var columns = radarChartContainer.selectAll(".radar-column");
			columns[0].forEach(function (d, columnIndex) {
					var everyThirdDataItem = chartData.filter(function (chartDatum, chartDatumIndex) {
						return (chartDatumIndex % numColumns) == columnIndex;
					});
					var columnPortlets = d3.select(d).selectAll(".radar-portlet").data(everyThirdDataItem).enter().append("div").attr("class", "radar-portlet")
					columnPortlets.append("div").attr("class", "radar-portlet-header").text(function (d) {
						return d.chartName;
					});

					function getChartId(d) {
						var id = "radar-" + d.chartId;
						return id;
					}
					var chartSvgs = columnPortlets.append("div").attr("class", "radar-portlet-content").attr("id", getChartId);
					chartSvgs.each(function (d) {
						RadarChart('#' + getChartId(d), [d], radarChartOptions);
					}); //end each svg
				}) //end each column
			$(function () {
				$(".radar-column").sortable({
					connectWith: ".radar-column",
					handle: ".radar-portlet-header",
					cancel: ".radar-portlet-toggle",
					placeholder: "radar-portlet-placeholder ui-corner-all"
				});
				$(".radar-portlet").addClass("ui-widget ui-widget-content ui-helper-clearfix ui-corner-all").find(".radar-portlet-header").addClass("ui-widget-header ui-corner-all").prepend("<span class='ui-icon ui-icon-minusthick radar-portlet-toggle'></span>");
				$(".radar-portlet-toggle").on("click", function () {
					var icon = $(this);
					icon.toggleClass("ui-icon-minusthick ui-icon-plusthick");
					icon.closest(".radar-portlet").find(".radar-portlet-content").toggle();
				});
			});
			//end createCharts
		}
		//end createRadar
	};
	createRadar();
	window.addEventListener("resize", function () {
		console.log("Got resize event. Calling radar");
		createRadar();
	});
	//return only the parts that need to be global
	return {};
}()); //end encapsulating IIFEE
