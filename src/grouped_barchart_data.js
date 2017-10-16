//encapsulate all code within a IIFE (Immediately-invoked-function-expression) to avoid polluting global namespace
//global object barchart will contain functions and variables that must be accessible from elsewhere
var barchart = (function () {
    "use strict";
    var chartData;
    var subGroupColumn;
    var mainGroupColumn;
    var quantityColumn;
    var mainGroupSet;
    var subGroupSet;
    var pivotData = false;
    var showPercentages = false;
    var showAsVertical = false;
    var chartSet;
    var chartSelector = "#grouped-barchart";
    var showChartOnPage = abmviz_utilities.GetURLParameter("visuals").indexOf('g') > -1;
    var url = "../data/" + abmviz_utilities.GetURLParameter("region") + "/" + abmviz_utilities.GetURLParameter("scenario") + "/BarChartData.csv"
var chartDataContainer=[];
    function createGrouped(callback) {
        "use strict";
        if (showChartOnPage) {

            d3.csv(url, function (error, data) {
                "use strict";
                if (error)
                    throw error;
                //expected data should have columns similar to: ZONE,COUNTY,TRIP_MODE_NAME,QUANTITY
                var headers = d3.keys(data[0]);
                var numCharts = headers.slice()
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
                chartSet = new Set();
                //note NVD3 multiBarChart expects data in what seemlike an inverted hierarchy subGroups at top level, containing mainGroups
                var totalsForEachMainGroup = {};
                var rawChartData = d3.nest().key(function (d) {
                    chartSet.add(d["CHART"]);
                    return d["CHART"];
                }).key(function (d) {
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
                //chartData = [];
                chartSet.forEach(function (chartName) {
                    chartData = [];

                    subGroupSet.forEach(function (subGroupName) {
                        var rawSubGroupObject = rawChartData[chartName][subGroupName];
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
                    });//end subGroupSet forEach
                    var completeChart = {
                        chartName: chartName,
                        data: chartData
                    };
                    chartDataContainer.push(completeChart);
                }); //end chartSet forEach


                readInDataCallback();
            });
            //end d3.csv
        }

        function readInDataCallback() {

            chartDataContainer.forEach(function (chart) {
                 d3.select('#grouped-bar-container').select("#"+chart.chartName).remove();
                d3.select('#grouped-bar-container')
                    .append('div').attr('id', chart.chartName).attr('class','col-xs-6').append("svg").attr("id", "grouped-barchart");
                //setDataSpecificDOM();
                var chartId = "#" + chart.chartName + " svg";
                var options = {
                    pivotData : pivotData,
                    showPercentages : showPercentages,
                    showAsVertical : showAsVertical
                };
                grouped_barchart(chartId, chart.data,options);
                //createEmptyChart(chart);
                initializeMuchOfUI(chart);
            });
        }        //end readInDataCallback

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
			createGrouped();
		});
		$("#grouped-barchart-toggle-percentage").off().click(function () {
			console.log("changing showPercentages from " + showPercentages + " to " + !showPercentages);
			showPercentages = !showPercentages;
			//klugey -- destroy everything and re-create.
			$(chartSelector).empty();
			createGrouped();
		});
		$("#grouped-barchart-toggle-horizontal").off().click(function(){
			console.log("changing showAsVertical from " + showAsVertical + " to " + !showAsVertical);
			showAsVertical = !showAsVertical;
			$(chartSelector).empty();
			createGrouped();
		});

	}
    } //end createGrouped
    createGrouped();
    window.addEventListener("resize", function () {
        console.log("Got resize event. Calling radar");
        createGrouped();
    });
    return {};
}());//end encapsulating IIFEE