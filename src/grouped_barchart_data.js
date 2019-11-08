//encapsulate all code within a IIFE (Immediately-invoked-function-expression) to avoid polluting global namespace
//global object barchart will contain functions and variables that must be accessible from elsewhere
var BarChartGrp = {
barchart:
function barchart(id,indx) {
    "use strict";
    var chartData;
    var subGroupColumn;
    var mainGroupColumn;
    var quantityColumn;
    var chartColumn;
    var mainGroupSet;
    var subGroupSet;
    var pivotData;
    var showPercentages;
    var showAsVertical;
    var chartSet;
    var stackChartsByDefault;
    var ChartWidthOverride ;
    var defaultMax = 0;
	var region = abmviz_utilities.GetURLParameter("region");
	var dataLocation = localStorage.getItem(region);
	var configIndx = indx;
	var chartSelector = "#"+id+"_grouped-barchart";
    var showChartOnPage = $('#'+id+'-container').children().length==0;
    var fileName = "BarChartData.csv";
    var scenario = abmviz_utilities.GetURLParameter("scenario");
    var url = dataLocation + scenario;
    //CONFIG VARIABLES
    var numberOfCols ;
    var ROTATELABEL = 0;
	var BARSPACING = 0.2;
	var showAsStacked = false;
    var independentScale;

var chartDataContainer=[];
    function createGrouped(callback) {
        "use strict";
        chartDataContainer = [];

        if (showChartOnPage) {
            $.getJSON(dataLocation + "region.json", function (data) {
                var configName = "Default";
                $.each(data, function (key, val) {

                    if (data["scenarios"][scenario].visualizations != undefined) {
                        if (data["scenarios"][scenario].visualizations["GroupedCharts"][configIndx].file) {
                            fileName = data["scenarios"][scenario].visualizations["GroupedCharts"][configIndx].file;
                        }
                        if (data["scenarios"][scenario].visualizations["GroupedCharts"][configIndx].config) {
                            configName = data["scenarios"][scenario].visualizations["GroupedCharts"][configIndx].config;
                        }
                        if (data["scenarios"][scenario].visualizations["GroupedCharts"][indx].info) {
                            var infoBox;
                            infoBox = data["scenarios"][scenario].visualizations["GroupedCharts"][indx].info;
                            $('#' + id + '-div span.glyphicon-info-sign').attr("title", infoBox);
                            $('#' + id + '-div [data-toggle="tooltip"]').tooltip();
                        }
                        if (data["scenarios"][scenario].visualizations["GroupedCharts"][indx].datafilecolumns) {
                            var datacols = data["scenarios"][scenario].visualizations["GroupedCharts"][indx].datafilecolumns;
                            $.each(datacols, function (key, value) {
                                $('#' + id + '-datatable-columns').append("<p>" + key + ": " + value + "</p>");
                            })
                        }
                    }
                });
                var configSettings = data["GroupedCharts"][configName];


                $.each(configSettings, function (opt, value) {
                    if (opt == "NumberColsGrouped" && numberOfCols == undefined)
                        numberOfCols = value;
                    if (opt == "IndependentScale")
                        independentScale = value;
                    if (opt == "SwapLegendByDefault" && pivotData == undefined) {
                        if (value == "N/A") {
                            pivotData = false;
                            $("#" + id + "-pivot-axes").closest('li').hide();
                        }
                        else
                            pivotData = value;
                    }
                    if (opt == "ShowAsVerticalByDefault" && showAsVertical == undefined) {
                        if (value == "N/A") {
                            showAsVertical = false;
                            $("#" + id + "-toggle-horizontal").closest('li').hide();
                        }
                        else
                            showAsVertical = value;
                    }
                    if (opt == "ShowAsPercentByDefault" && showPercentages == undefined) {
                        if (value == "N/A") {
                            showPercentages = false;
                            $("#" + id + "-toggle-percentage").closest('li').hide();
                        }
                        else
                            showPercentages = value;

                    }
                    if (opt == "StackAllChartsByDefault" && stackChartsByDefault == undefined) {
                        if (value == "N/A") {
                            stackChartsByDefault = false;
                            showAsStacked = false;
                            $("#" + id + "-toggle-stacked").closest('li').hide();
                        }
                        else {
                            stackChartsByDefault = value;
                            showAsStacked = value;
                        }

                    }
                    if (opt == "ChartWidthOverride" && ChartWidthOverride == undefined)
                        if (value.length > 0)
                            ChartWidthOverride = value;
                    if (opt == "RotateLabels") {
                        ROTATELABEL = value;
                    }
                    if (opt == "BarSpacing") {
                        BARSPACING = value;
                    }
                });

            }).complete(function () {
                if (url.indexOf(fileName) == -1) {
                    url += "/" + fileName;
                }

                d3.csv(url, function (error, data) {
                    "use strict";
                    if (error) {
                        $('#' + id + '-div').html("<div class='container'><h3><span class='alert alert-danger'>Error: An error occurred while loading the grouped bar chart data.</span></h3></div>");
                        throw error;
                    }
                    //expected data should have columns similar to: ZONE,COUNTY,TRIP_MODE_NAME,QUANTITY
                    var headers = d3.keys(data[0]);
                    var numCharts = headers.slice()
            if(! $.fn.DataTable.isDataTable('#'+id+'-datatable-table')) {
                chartData = data;
                var columnsDT = [];
                $.each(headers, function (d, i) {
                    columnsDT.push({data: i});

                    $('#' + id + '-datatable-div table thead tr').append("<th>" + i + "</th>")
                });

                $('#' + id + '-datatable-table').DataTable({
                    dom: 'Bfrtip',
                    buttons: [
                        {
                            extend: 'csv',
                            text: '<span class="glyphicon glyphicon-save"></span>',
                            titleAttr:'Download CSV'
                        }
                    ],
                    data: data,
                    columns: columnsDT
                });
            }
                    mainGroupColumn = headers[0];
                    subGroupColumn = headers[1];
                    chartColumn = headers[3];
                    if (pivotData == undefined)
                        pivotData = false;
                    if (showAsVertical == undefined)
                        showAsVertical = false;
                    if (showPercentages == undefined)
                        showPercentages = false;
                    if (stackChartsByDefault == undefined)
                        stackChartsByDefault = false;
                    if (showAsStacked == undefined)
                        showAsStacked = false;
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
                    var totalsForIndependentGroups = {};
                    if (subGroupColumn == undefined) {
                        $('#' + id + '-div').html("<div class='container'><h3><span class='alert alert-danger'>Error: An error occurred while loading the grouped bar chart data.</span></h3></div>");
                        return;
                    }

                    var chartTotals = d3.nest().key(function (d) {
                        return d[chartColumn].replace(/\s+/g, '');
                    }).key(function (d) {

                        //change quantity to an int for convenience right off the bat
                        d[quantityColumn] = parseInt(d[quantityColumn]);
                        var subGroupName = d[mainGroupColumn];

                        return subGroupName;
                    }).rollup(function (objectArray) {
                        var oneRow = objectArray[0];
                        return {
                            totalpos: d3.sum(objectArray, function (e) {
                                if (e[quantityColumn] > 0) return e[quantityColumn];
                            }),
                            totalneg: d3.sum(objectArray, function (e) {
                                if (e[quantityColumn] < 0) return e[quantityColumn];
                            }),
                            min: d3.min(objectArray, function (e) {
                                return e[quantityColumn];
                            }),
                            max: d3.max(objectArray, function (e) {
                                return e[quantityColumn];
                            })
                        }
                    }).map(data);

                    var findMax = [];
                    findMax = Object.keys(chartTotals).map(function (key) {
                        var totalpos = Object.keys(chartTotals[key]).map(function (x) {
                            return chartTotals[key][x].totalpos;
                        });
                        var totalneg = Object.keys(chartTotals[key]).map(function (x) {
                            return chartTotals[key][x].totalneg;
                        })
                        return {
                            chart: key,
                            maxpos: Math.max.apply(null, totalpos),
                            minneg: Math.min.apply(null, totalneg)
                        };
                    });
                    var rawChartData = d3.nest().key(function (d) {
                        chartSet.add(d[chartColumn].replace(/\s+/g, ''));
                        return d[chartColumn].replace(/\s+/g, '');
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
                                    percentage: mainGroupQuantity / totalsForEachMainGroup[mainGroupName],
                                    groupmax: totalsForEachMainGroup[mainGroupName]
                                });
                            });
                            //end mainGroups foreach
                        });//end subGroupSet forEach


                        var completeChart = {
                            chartName: chartName,
                            data: chartData,
                            maxVal: $.grep(findMax, function (e) {
                                return e.chart === chartName
                            })[0].maxpos,
                            minVal: $.grep(findMax, function (e) {
                                return e.chart === chartName
                            })[0].minneg,
                        };
                        chartDataContainer.push(completeChart);
                    }); //end chartSet forEach


                    readInDataCallback();
                })


            });
            //end d3.csv
        } else {
            return;
        }

        function readInDataCallback() {
            var getMax = 0;
            var getMin = 0;
            chartDataContainer.forEach(function (chart) {
                if ($.inArray(chart.chartName, independentScale) == -1) {
                    getMax = Math.max(getMax, chart.maxVal);
                    getMin = Math.min(getMin, chart.minVal);
                }
            });
            chartDataContainer.forEach(function (chart, i) {
                var widthOfEachCol = 12 / numberOfCols;
                if (ChartWidthOverride != undefined && ChartWidthOverride[i] != undefined)
                    widthOfEachCol = ChartWidthOverride[i];
                d3.select('#'+id+'-container').select("#" + chart.chartName + "_bar").remove();
                d3.select('#'+id+'-container')
                    .append('div').attr('id', chart.chartName + "_bar").style('min-height', '500px').attr('class', 'col-sm-' + widthOfEachCol).append("div").attr("class", "barcharttitle").style('padding-top', '50px').text(
                    chartDataContainer.length > 1 ? chart.chartName : ""
                );
                d3.select("#" + chart.chartName + "_bar").append("svg").attr("id", id+"_grouped-barchart");//.style('height','400px');
                //setDataSpecificDOM();

                var chartId = "#" + chart.chartName + "_bar " + " svg";
                var options = {
                    pivotData: pivotData,
                    showPercentages: showPercentages,
                    showAsVertical: showAsVertical,
                    mainGrpSet: mainGroupSet,
                    subGrpSet: subGroupSet,
                    mainGrpCol: mainGroupColumn,
                    quantCol: quantityColumn,
                    subGrpCol: subGroupColumn,
                    showAsGrped: showAsStacked,
                    rotateLabel: ROTATELABEL,
                    barSpacing: BARSPACING,
                    chartWidth: widthOfEachCol//,
                    //maxVal: independentScale != undefined && $.inArray(chart.chartName,independentScale)==-1 ? getMax:chart.maxVal,
                    // minVal: independentScale != undefined && $.inArray(chart.chartName,independentScale)==-1? getMin:chart.minVal
                };
                grouped_barchart(chartId, chart.data, options,id);
                //createEmptyChart(chart);
                initializeMuchOfUI(chart);

                setDataSpecificDOM();
            });
        }        //end readInDataCallback

        function initializeMuchOfUI() {
            //use off() to remove existing click handleres
            $("#"+id+"-stacked").off().click(function () {
                extNvd3Chart.stacked(this.checked);
                extNvd3Chart.update();
            });
            $("#"+id+"-pivot-axes").off().click(function () {
                console.log("changing pivotData from " + pivotData + " to " + !pivotData);
                pivotData = !pivotData;

                $(chartSelector).empty();
                createGrouped();
            });
            $("#"+id+"-toggle-percentage").off().click(function () {
                console.log("changing showPercentages from " + showPercentages + " to " + !showPercentages);
                showPercentages = !showPercentages;

                $(chartSelector).empty();
                createGrouped();
            });
            $("#"+id+"-toggle-horizontal").off().click(function () {
                console.log("changing showAsVertical from " + showAsVertical + " to " + !showAsVertical);
                showAsVertical = !showAsVertical;
                $(chartSelector).empty();
                createGrouped();
            });

            $("#"+id+"-toggle-stacked").off().click(function () {
                console.log("changing showAsStacked from " + showAsStacked + " to " + !showAsStacked);
                showAsStacked = !showAsStacked;
                $(chartSelector).empty();
                createGrouped();
            });
            $("#"+id+"-pivot-axes").prop('checked', pivotData);
            $("#"+id+"-toggle-horizontal").prop('checked', showAsVertical);
            $("#"+id+"-toggle-percentage").prop('checked', showPercentages);
            $("#"+id+"-toggle-stacked").prop('checked', showAsStacked);

        }

        function setDataSpecificDOM() {
            d3.selectAll("#"+id+"-div .grouped-barchart-main-group").html(mainGroupColumn);
            d3.selectAll("#"+id+"-div .grouped-barchart-sub-group").html(subGroupColumn);
            d3.selectAll("#"+id+"-div .grouped-barchart-sub-group-example").html(chartData[0].key);
        }
    } //end createGrouped
    createGrouped();
    window.addEventListener("resize", function () {
        console.log("Got resize event. Calling grouped");
        createGrouped();
    });
    return {};
} };//end encapsulating IIFEE