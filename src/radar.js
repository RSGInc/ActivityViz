//encapsulate all code within a IIFE (Immediately-invoked-function-expression) to avoid polluting global namespace
//global object radar will contain functions and variables that must be accessible from elsewhere
var radar = (function () {
	"use strict";
	var chartData;
	var chartColor = d3.scale.category10();
//"#0000FF"; //blue
	var AXIS_COLUMN = 0;
	var QUANTITY_COLUMN = 2;
	var CHART_COLUMN = 1;
	var opacityScaleRange = [0.3, 0.9];
	var showChartOnPage = true;
	var numberOfCols = 1;
	var convertAxesToPercent = true;
	var independentscale =[];
	 var independentAxesCharts = [];
	function createRadar() {
        //read in data and create radar when finished
        if (showChartOnPage) {
            $.getJSON("../data/" + abmviz_utilities.GetURLParameter("region") + "/" + "region.json", function (data) {
                $.each(data, function (key, val) {
                    if (key == "RadarCharts")
                        $.each(val,function(opt,value){
                            if(opt =="NumberColsRadar")
                                numberOfCols = value;
                            if(opt=="IndependentScale")
                                independentscale = value;
                            if(opt=="ConvertAxesToPercent")
                                convertAxesToPercent = value;
                        })


                });
            });
            if (chartData === undefined) {
                d3.text("../data/" + abmviz_utilities.GetURLParameter("region") + "/" + abmviz_utilities.GetURLParameter("scenario") + "/RadarChartsData.csv", function (error, data) {
                    "use strict";
				if (error) {
                    $('#radar').html("<div class='container'><h3><span class='alert alert-danger'>Error: An error occurred while loading the radar data.</span></h3></div>");
                    throw error;
                }
                    var csv = d3.csv.parseRows(data).slice(1);
                    var headers = d3.csv.parseRows(data)[0];
                    var legendHead = headers.slice(2,headers.len);
                    if(legendHead.length ==0) {
                        $('#radar').html("<div class='container'><h3><span class='alert alert-danger'>Error: An error occurred while loading the radar data.</span></h3></div>");
                        return;
                    }
                    data = null; //allow memory to be GC'ed
                    var rolledUpMaps = [];
                    var rolledUpMap;

                    for(var y=2; y < csv[0].length;y++) {
                        rolledUpMap = d3.nest().key(function (d) {
                            //convert quantity to a number
                            var len = d.length;
                            for (var i = 2; i < len; i++) {
                                d[i] = +d[i];
                            }
                            //d[QUANTITY_COLUMN] = +d[QUANTITY_COLUMN];
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
                                var vals = d[0].slice(2, d.len);
                                return {
                                    axis: d[0][AXIS_COLUMN],
                                    value: d[0][y]
                                };
                            }).map(csv);
                        rolledUpMaps.push(rolledUpMap);
                    }

                    //get max and min values for each axis, filter out the independent scales

                    var axesInfo = d3.nest().key(function (d) {
                        var radarAxis = d[AXIS_COLUMN];
                        return radarAxis; //secondary group by AXIS
                    }).rollup(function (leaves) {
                        return {
                            name: leaves[0][AXIS_COLUMN],
                            min: d3.min(leaves, function (d) {

                                return Math.min.apply(null,d.slice(2,d.len));
                            }),
                            max: d3.max(leaves, function (d) {
                                return Math.max.apply(null,d.slice(2,d.len));
                            })
                        };
                    }).map(csv.filter(function(e){return $.inArray(e[1],independentscale)==-1;}));

                    var findmin = Object.keys(axesInfo).map(function(key){return axesInfo[key].min;});
                    var overallmin = Math.min.apply(null,findmin);
                    var findmax = Object.keys(axesInfo).map(function(key){return axesInfo[key].max;});
                    var overallmax = Math.min.apply(null,findmax);

                    independentAxesCharts = [];
                    for(var i=0; i< independentscale.length;i++){
                        var scale = independentscale[i];
                        var independentAxesInfo = d3.nest().key(function (d) {
                        var radarAxis = d[AXIS_COLUMN];
                        return radarAxis; //secondary group by AXIS
                    }).rollup(function (leaves) {
                        return {
                            name: leaves[0][AXIS_COLUMN],
                            min: d3.min(leaves, function (d) {
                                return Math.min.apply(null,d.slice(2,d.len));
                            }),
                            max: d3.max(leaves, function (d) {
                                return Math.max.apply(null,d.slice(2,d.len));
                            })
                        };
                    }).map(csv.filter(function(e){return e[1] === scale;}));
                        independentAxesCharts.push({name:scale,axes:independentAxesInfo});
                    }




                    //scale each axis to range of 0 to 1 so can report as percentage across best/worst of all charts
                    Object.keys(axesInfo).forEach(function (key) {
                        var axisInfo = axesInfo[key];
                        axisInfo.percentageScale = d3.scale.linear().domain([axisInfo.min, axisInfo.max]).range([0, 1]);

                    });

                    independentAxesCharts.forEach(function(chart){

                        Object.keys(chart.axes).forEach(function (key) {
                       var axisInfo = chart.axes[key];
                         if(axisInfo.min === axisInfo.max)
                          {
                            //if the min and max are the same, set min to 0 so the single data point shows up as 100% rather than 0%
                            axisInfo.percentageScale = d3.scale.linear().domain([0, axisInfo.max]).range([0, 1]);
                          }
                          else
                          {
                                axisInfo.percentageScale = d3.scale.linear().domain([axisInfo.min, axisInfo.max]).range([0, 1]);
                          }
                    });
                    })

                    csv = null; //allow memory to be GC'ed
                    //convert data to format nvd3 expects it
                    //populate drop down of all person -types
                    chartData = [];
                    var minSumPercentages = 10000;
                    var maxSumPercentages = -10000;
                    var chartId = 1;
                    var axesData=[];
                    var chartDatumObject={};
                    for(var c = 0; c < rolledUpMaps.length;c++){
                        var currentrollupMap = rolledUpMaps[c];

                    Object.keys(currentrollupMap).forEach(function (chartName) {
                         axesData = [];
                         var existingChartId;
                         if(chartData.map(function(e){return e.chartName;}).indexOf(chartName) >-1)
                         {
                             var indx = chartData.map(function(e){return e.chartName;}).indexOf(chartName) ;
                             existingChartId = chartData[indx].chartId;
                         }else {
                             existingChartId = chartId++;
                         }
                         chartDatumObject = {
                            chartId: existingChartId,
                            chartName: chartName,
                            axes: axesData,
                            areaName: legendHead[c],
                            sumPercentages: 0,
                            active: true,
                            overallmin: overallmin,
                            overallmax: overallmax
                        }
                        chartData.push(chartDatumObject);
                        var rolledUpChartNameMap = currentrollupMap[chartName];
                        var axisOpacityScale = d3.scale.linear().domain([0, 1]).range(opacityScaleRange);
                        //must make sure data has all radarAxes since wish each chart to look similar if they belong to the same scale
                        if($.inArray(chartName,independentscale)>-1){
                            var indyChart = independentAxesCharts.filter(function(ch){ return ch.name == chartName;});
                            Object.keys(indyChart[0].axes).forEach(function (key) {
                                var axisInfo = indyChart[0].axes[key];
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
                                    if(axisInfo.max === axisInfo.min) {
                                        radarAxisDataObject.value = axisInfo.percentageScale(radarAxisDataObject.originalValue);
                                    } else {
                                        radarAxisDataObject.value = axisInfo.percentageScale(radarAxisDataObject.originalValue);
                                    }


                                }
                                //at this point 'value' has been overwritten by percent value and original copied to originalValue
                                radarAxisDataObject.scaledOpacity = axisOpacityScale(radarAxisDataObject.value);
                                chartDatumObject.sumPercentages += radarAxisDataObject.value;
                                axesData.push(radarAxisDataObject);
                            }); //end loop over radarAxes
                        } else {
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
                        }
                        minSumPercentages = Math.min(minSumPercentages, chartDatumObject.sumPercentages);
                        maxSumPercentages = Math.max(maxSumPercentages, chartDatumObject.sumPercentages);
                        //end loop over charts
                    });
                      }
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
                var labelTooltip = d3.select('#radar').append("div").attr("class", "lbltooltip").style("opacity", 0);
            }
            //end if chartData === undefined
            else {
                //if just a window resize, don't re-read data
                //createEmptyChart(updateChart);
            }
        }
            function createCharts() {
                var radarChartContainer = d3.select("#radar-chart-container");
                //need to create columns and then fill each column with portlets
                //tricky because (AFAIK) I need to attach the data to each column separately
                var heightConfig = [650,450,250,150];
                var weightConfig = [800,500,300,155];
                var marginTop =     [110,  50,40,40];
                var marginBot =     [140, 65,50,55];
                var marginLeft =    [90,  50,60,75];
                var marginRight =   [90,  50,60,75];
                var radarColCss = [320,624,443,320];
                var labelFact = [1.25,1.2,1.24,1.45];
                var axisLabelSizes = [14,13,12,11];
                var circleLabelSizes = [14,13,12,11];
                var legendFont = [18,16,14,12];
                var numCharts = 21;
                var numColumns = numberOfCols;

                var radarChartOptions = {

                    w: weightConfig[numColumns -1],
                    h: heightConfig[numColumns -1],
                    margin: {
                        top: marginTop[numColumns-1],
                        right: marginRight[numColumns-1],
                        bottom: marginBot[numColumns-1],
                        left: marginLeft[numColumns-1]
                    },
                    legendPosition: {x:25,y:25},
                    tooltipFormatValue: abmviz_utilities.numberWithCommas,
                    strokeWidth: 2,
                    maxValue: 1.0,
                    minValue: 0,
                    levels: 3,
                    wrapWidth: 70,
                    labelFactor: labelFact[numColumns-1],
                    roundStrokes: false,
                    axisLabelSizes : axisLabelSizes[numColumns-1],
                    circleLabelSizes : circleLabelSizes[numColumns-1],
                    labelFontSize : legendFont[numColumns-1],
                    convertAxesToPercent: convertAxesToPercent,
                   // strokeWidth: 0,
                    color:  chartColor
                    //,
                   // tooltipFormatValue: abmviz_utilities.numberWithCommas
                };
                var chartId = 1;
                for (var columnIndex = 0; columnIndex < numColumns; ++columnIndex) {
                    radarChartContainer.append("div").attr("class", "radar-column");
                } //end loop over columns
                var columns = radarChartContainer.selectAll(".radar-column");
                columns[0].forEach(function (d, columnIndex) {
                    var everyThirdDataItem = chartData.filter(function (chartDatum, chartDatumIndex) {

                        return (chartDatumIndex % numColumns) == columnIndex && chartDatumIndex == (chartDatum.chartId - 1)  ;//&& ;
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
                    var uniqueCharts = chartSvgs.forEach(function(d) {

                    });
                    chartSvgs.each(function (d) {
                        RadarChart('#' + getChartId(d), chartData.filter(function(chartDatum){ return chartDatum.chartId==d.chartId; }) , radarChartOptions);
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
                $('.radar-column').css('width',radarColCss[numColumns-1]+'px ')
            }

            //end createRadar
        }
        ;
        createRadar();
        window.addEventListener("resize", function () {
            console.log("Got resize event. Calling radar");
            createRadar();
        });
        //return only the parts that need to be global
        return {};

}()); //end encapsulating IIFEE
