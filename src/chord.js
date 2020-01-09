//encapsulate all code within a IIFE (Immediately-invoked-function-expression) to avoid polluting global namespace
//global object chord will contain functions and variables that must be accessible from elsewhere
var ChordChart = {
    chord:
        function chord(id, indx) {
            "use strict";
            var region = abmviz_utilities.GetURLParameter("region");
            var dataLocation = localStorage.getItem(region);
            var fileName = "ChordData.csv";
            var url = dataLocation + abmviz_utilities.GetURLParameter("scenario");
            var scenario = abmviz_utilities.GetURLParameter("scenario");
            var mainGroupColumnName;
            var subGroupColumnName;
            var quantityColumn;
            var countiesSet;
            var zoneFilterNameCol;
            var width = 600,
                height = 600;

            var outerRadius = width / 2,
                innerRadius = outerRadius - 130;
            var json = null;
            var palette = [["rgb(0, 0, 0)", "rgb(67, 67, 67)", "rgb(102, 102, 102)", "rgb(204, 204, 204)", "rgb(217, 217, 217)", "rgb(255, 255, 255)"], ["rgb(152, 0, 0)", "rgb(255, 0, 0)", "rgb(255, 153, 0)", "rgb(255, 255, 0)", "rgb(0, 255, 0)", "rgb(0, 255, 255)", "rgb(74, 134, 232)", "rgb(0, 0, 255)", "rgb(153, 0, 255)", "rgb(255, 0, 255)"], ["rgb(230, 184, 175)", "rgb(244, 204, 204)", "rgb(252, 229, 205)", "rgb(255, 242, 204)", "rgb(217, 234, 211)", "rgb(208, 224, 227)", "rgb(201, 218, 248)", "rgb(207, 226, 243)", "rgb(217, 210, 233)", "rgb(234, 209, 220)", "rgb(221, 126, 107)", "rgb(234, 153, 153)", "rgb(249, 203, 156)", "rgb(255, 229, 153)", "rgb(182, 215, 168)", "rgb(162, 196, 201)", "rgb(164, 194, 244)", "rgb(159, 197, 232)", "rgb(180, 167, 214)", "rgb(213, 166, 189)", "rgb(204, 65, 37)", "rgb(224, 102, 102)", "rgb(246, 178, 107)", "rgb(255, 217, 102)", "rgb(147, 196, 125)", "rgb(118, 165, 175)", "rgb(109, 158, 235)", "rgb(111, 168, 220)", "rgb(142, 124, 195)", "rgb(194, 123, 160)", "rgb(166, 28, 0)", "rgb(204, 0, 0)", "rgb(230, 145, 56)", "rgb(241, 194, 50)", "rgb(106, 168, 79)", "rgb(69, 129, 142)", "rgb(60, 120, 216)", "rgb(61, 133, 198)", "rgb(103, 78, 167)", "rgb(166, 77, 121)", "rgb(91, 15, 0)", "rgb(102, 0, 0)", "rgb(120, 63, 4)", "rgb(127, 96, 0)", "rgb(39, 78, 19)", "rgb(12, 52, 61)", "rgb(28, 69, 135)", "rgb(7, 55, 99)", "rgb(32, 18, 77)", "rgb(76, 17, 48)"]];
            var originalNodeData;
            var naColor = "White";
            var focusColor = "Yellow";
            var CSS_UPDATE_PAUSE = 150;
            var colors = {}; //will be filled in to map keys to colors

            var DESIRELINESONDEFAULT = false;
            var map;
            var controlLayer;
            var zoneDataLayer;
            var destZoneDataLayer;
            var desireLineDataLayer;
            var countyLayer;
            var focusLayer;
            var ZONE_FILTER_LOC = "";
            var zoneFilterData;
            var desireLines;
            var showDesireLines = false;
            var zoneheaders = [];
            var circleStyle = {
                "stroke": false,
                "fillColor": "set by updateBubbles",
                "fillOpacity": 1.0
            };
            var currentDistrict = "";
            var currentDestDistrict = "";
            var indexByName = {};
            var nameByIndex = {};
            var rawData;
            var legendHeadersShowHide = {};
            var zoneData;
            var circleMarkers;
            var legendRows = 4;
            var numberChordPerRow = 1;
//config file options
            var COUNTY_FILE = "";
            var ZONE_FILE_LOC = "";
            var CENTER_LOC = [];
            var labelSize = 10;
            var showCycleTools = true;
            var SCENARIO_FOCUS = false;
            var scenarioPolyFile;
            var fill = d3.scale.category20();
            var chartOnPage = $('#' + id + '_circle').length == 0;
            var circlesLayerGroup;
            var desireLineLayerGroup;
            var formatPercent = d3.format(".1%");
            var showGrpPercent = false;
            var showWholePercent = true;
            var wholeDataTotal = 0;
            var chartTotals = {};
            var legendText = "Legend";
            var excludeSameOD = false;
            var showLegendHead = true;
            var datamatrix;
            var matrixmap;
            var sidebyside = false;
            var chartData = [];

            function getConfigSettings(callback) {
                if (chartOnPage) {
                    $.getJSON(dataLocation + "region.json", function (data) {
                        var configName = "Default";
                        if (data["scenarios"][scenario].visualizations != undefined) {
                            if (data["scenarios"][scenario].visualizations["Chord"][indx].file) {
                                fileName = data["scenarios"][scenario].visualizations["Chord"][indx].file;
                            }
                            var infoBox;
                            if (data["scenarios"][scenario].visualizations["Chord"][indx].info) {
                                infoBox = data["scenarios"][scenario].visualizations["Chord"][indx].info;
                                $('#' + id + '-div span.glyphicon-info-sign').attr("title", infoBox);
                                $('#' + id + '-div [data-toggle="tooltip"]').tooltip();
                            }
                            if (data["scenarios"][scenario].visualizations["Chord"][indx].config) {
                                configName = data["scenarios"][scenario].visualizations["Chord"][indx].config;
                            }

                            if (data["scenarios"][scenario].visualizations["Chord"][indx].datafilecolumns) {
                                var datacols = data["scenarios"][scenario].visualizations["Chord"][indx].datafilecolumns;
                                $.each(datacols, function (key, value) {
                                    $('#' + id + '-datatable-columns').append("<p>" + key + ": " + value + "</p>");
                                })
                            }
                        }
                        url += "/" + fileName;

                        //GO THROUGH region level configuration settings
                        $.each(data, function (key, val) {
                            if (key == "CountyFile")
                                COUNTY_FILE = val;
                            if (key == "ZoneFile")
                                ZONE_FILE_LOC = val;
                            if (key == "CenterMap" && CENTER_LOC.length == 0)
                                CENTER_LOC = val;
                            if (key == "DefaultFocusColor")
                                focusColor = val;
                        });

                        if (data["scenarios"] != undefined && data["scenarios"][scenario] != undefined) {
                            if (data["scenarios"][scenario]["CenterMap"] != undefined) {
                                CENTER_LOC = data["scenarios"][scenario]["CenterMap"];
                            }
                            if (data["scenarios"][scenario]["ScenarioFocus"] != undefined) {
                                SCENARIO_FOCUS = true;
                                scenarioPolyFile = data["scenarios"][scenario]["ScenarioFocus"];
                                $('#' + id + '-by-district-map').before(" Focus Color: <input type='text' id='" + id + "-focus-color' style='display: none;' >  ");
                            }
                        }
                        var configSettings = data["Chord"][configName];

                        if (configSettings != undefined) {
                            $.each(configSettings, function (opt, value) {
                                if (opt == "ZoneFilterFile") {
                                    ZONE_FILTER_LOC = value;
                                }
                                if (opt == "LabelSize") {
                                    labelSize = value;
                                }
                                if (opt == "LegendRows") {
                                    legendRows = value;
                                }
                                if (opt == "LegendText") {
                                    legendText = value;
                                }
                                if (opt == "ZoneFile") {
                                    ZONE_FILE_LOC = value;
                                }
                                if (opt == "DesireLinesOn") {
                                    DESIRELINESONDEFAULT = value;
                                }
                                if (opt == "ExcludeSameOD") {
                                    excludeSameOD = value;
                                }
                                if (opt == "SideBySide") {
                                    showLegendHead = !value;
                                    sidebyside = value;
                                }
                                if (opt == "ChartPerRow") {
                                    numberChordPerRow = value;
                                }

                            });
                        }
                    }).complete(function () {

                        callback();
                        ZONE_FILTER_LOC = ZONE_FILTER_LOC;
                        $("#chord-grouppercent").off().click(function () {
                            showGrpPercent = !showGrpPercent;
                            goThroughChordData();
                        });
                        $("#chord-wholepercent").off().click(function () {
                            showWholePercent = !showWholePercent;
                            goThroughChordData();
                        });
                    });


                } else {
                    return;
                }
            }

            getConfigSettings(function () {
                readInData(function () {

                })
            });

            function readInData(callback) {
                readInFilterData(function () {
                    createMap(function () {
                        goThroughChordData();
                    })
                })

            }

            function goThroughChordData() {
                $('#' + id + '-chart-container svg').remove();
                $('#' + id + '-chart-container div').remove();
                chartData = [];
                datamatrix = [];
                //read in data and create chord when finished
                wholeDataTotal = 0;
                d3.csv(url, function (error, data) {
                    "use strict";
                    if (error) {
                        $('#chord').html("<div class='container'><h3><span class='alert alert-danger'>Error: An error occurred while loading the chord data.</span></h3></div>");
                        throw error;
                    }
                    var headers = d3.keys(data[0]);
                    var columnsDT = [];
                    if (!$.fn.DataTable.isDataTable('#' + id + '-datatable-table')) {
                        $.each(headers, function (d, i) {
                            columnsDT.push({data: i});
                            $('#' + id + '-datatable-div table thead tr').append("<th>" + i + "</th>")
                        });

                        $('#' + id + '-datatable-table').DataTable({
                            dom: 'Bfrtip',
                            buttons: {
                                dom: {
                                    button: {
                                        tag: 'button',
                                        className: ''
                                    }
                                },

                                buttons: [
                                    {
                                        extend: 'csv',
                                        className: 'btn',
                                        text: '<span class="glyphicon glyphicon-save"></span>',
                                        titleAttr: 'Download CSV'
                                    }
                                ],
                            },
                            data: data,
                            columns: columnsDT
                        });
                    }
                    var quantities = headers.slice(2);
                    var legendHead = headers.slice(2, headers.len);
                    mainGroupColumnName = headers[0];
                    subGroupColumnName = headers[1];
                    if (subGroupColumnName == undefined) {
                        $('#chord').html("<div class='container'><h3><span class='alert alert-danger'>Error: An error occurred while loading the chord data.</span></h3></div>");
                        return;
                    }
                    quantityColumn = 3;
                    var selectedLegend = true;
                    if (_.size(legendHeadersShowHide) == 0) {
                        for (var i = 0; i < legendHead.length; i++) {
                            legendHeadersShowHide[legendHead[i]] = selectedLegend;
                            if (showLegendHead) {
                                selectedLegend = false;
                            }
                        }
                    }
                    var n = 0;
                    //setup lookups by name and index for our o/d names
                    data.forEach(function (d) {


                        if (!(d[mainGroupColumnName] in indexByName)) {
                            nameByIndex[n] = {
                                name: d[mainGroupColumnName],
                                col: d[mainGroupColumnName],
                                index: n,
                                // grptotal: excludeSameOD && d[mainGroupColumnName] == d[subGroupColumnName] ? 0 : Number.parseFloat(total),
                                //  chartvalues:{}
                            };

                            indexByName[d[mainGroupColumnName]] = {
                                index: n++,
                                name: d[mainGroupColumnName],
                                // grptotal: excludeSameOD && d[mainGroupColumnName] == d[subGroupColumnName] ? 0 : Number.parseFloat(total),
                                // chartvalues:{}

                            };
                        }


                        //end else
                    });//end data foreach
                    //create our chart objects
                    var chartDataObject = {};
                    let chartidx = 0;
                    $.each(legendHeadersShowHide, function (header, val) {
                        if (val) {
                            datamatrix = [];
                            //initialize matrix
                            for (var i = 0; i < _.size(indexByName); i++) {
                                datamatrix[i] = [];
                                //datamatrix2[i] = [];
                                for (var j = 0; j < _.size(indexByName); j++) {
                                    datamatrix[i][j] = 0;
                                    //datamatrix2[i][j] = 0;
                                }//end for
                            }//end for
                            chartDataObject = {};
                            matrixmap = undefined;
                            matrixmap = chordMpr(data);
                            matrixmap.addValuesToMap(mainGroupColumnName)
                                .setFilter(function (row, a, b) {
                                    return (row[mainGroupColumnName] === a.name && row[subGroupColumnName] === b.name)
                                }).setAccessor(function (recs, a, b) {
                                if (!recs[0]) return 0;
                                return recs[0][header];
                            });
                            let rdr = chordRdr(matrixmap.getMatrix(), matrixmap.getMap());
                            chartDataObject = {
                                chartId: id + '_' + "chordchart"+chartidx++,
                                chartName: header,
                                dataMatrix: datamatrix,
                                dataRdr: rdr,
                                chartTotal: 0
                            };
                            chartData.push(chartDataObject);
                        }
                    });

                    //fill up our chart data matrices
                    $.each(legendHeadersShowHide, function (header, val) {
                        if (val) {
                            var indx = chartData.findIndex(x => x.chartName == header);

                            data.forEach(function (d) {
                                if(excludeSameOD && d[mainGroupColumnName]==d[subGroupColumnName]){
                                    //do nothing we don't want to use the same O/D data points if it's disabled.
                                }
                                else {
                                    var mainGrp = d[mainGroupColumnName];
                                    var subGrp = d[subGroupColumnName];
                                    chartData[indx].chartTotal+= +d[header];
                                    chartData[indx].dataMatrix[indexByName[mainGrp].index][indexByName[subGrp].index] = +d[header];
                                }
                            });


                        }
                    });

                    $('.chord-chart-maingroup').text(legendText);
                    var size = _.size(legendHeadersShowHide);
                    if (showLegendHead  && size >1 ) {

                        $('#'+id+'-dropdown-div').html('');


                        var legendWidth = $('#' + id + '-chart-container').width();
                        var columns = Math.floor(legendWidth / 165);
                        var lines = Number.parseInt(Math.ceil(size / columns));
                        var legheight = 30 * lines;
                        var container = d3.select("#" + id + "-dropdown-div").append("svg")
                            .attr("width", legendWidth).attr("height", legheight).style('padding-top', "10px");
                        if (!SCENARIO_FOCUS) {
                            $('#' + id + '-chart-map').css("margin-top", $('#' + id + '-dropdown-div').height() / 2 + "px");
                        }
                        var dataL = 0;
                        var offset = 100;
                        var prevLegendLength = 0;
                        var xOff, yOff;

                        var legendOrdinal = container.selectAll('.chordLegend').data(legendHead)
                            .enter().append('g').attr('class', 'chordLegend').attr("transform", function (d, i) {
                                var calcX = (i % legendRows) * (legendWidth / columns);
                                xOff = (i % legendRows) * 185;
                                yOff = Math.floor(i / legendRows) * 20
                                // if (prevLegendLength != 0) {
                                //   xOff = xOff + (prevLegendLength - 9);
                                // }
                                prevLegendLength = d.length;
                                return "translate(" + xOff + "," + yOff + ")"
                            });
                        var circles = legendOrdinal.append("circle")
                            .attr("cx", 10)
                            .attr("cy", 7)
                            .attr("r", 5)
                            .style("stroke", "black")
                            .style("fill", function (d, i) {
                                return legendHeadersShowHide[d] ? "black" : "white";
                            });
                        var texts = legendOrdinal.append('text')
                            .attr("x", 20)
                            .attr("y", 12)
                            //.attr("dy", ".35em")
                            .text(function (d, i) {
                                return d
                            })
                            .attr("class", "textselected")
                            .style("text-anchor", "start")
                            .style("font-size", 15)
                        circles.on("click", function (d) {
                            showHideBlobs(d);
                        })
                        texts.on("click", function (d) {
                            showHideBlobs(d);
                        })
                    }
                    $.each(chartData, function (indx, chart) {
                        CreateChord(id, data, chart);
                    });
                });

                //end d3.csv

                function showHideBlobs(d) {
                    if (legendHeadersShowHide[d] == false) {
                        legendHeadersShowHide[d] = true;
                    } //if the blob is false, set it to true
                    //set all others to false
                    for (var i in legendHeadersShowHide) {
                        if (i != d) {
                            legendHeadersShowHide[i] = false;
                        }
                    }
                    goThroughChordData();
                }

                $("#" + id + "-focus-color").spectrum({
                    color: focusColor,
                    showInput: true,
                    className: "full-spectrum",
                    showInitial: false,
                    showPalette: true,
                    showAlpha: true,
                    showSelectionPalette: true,
                    maxSelectionSize: 10,
                    preferredFormat: "hex",
                    localStorageKey: "spectrum.demo",
                    palette: palette,
                    change: function (color) {
                        focusColor = color;
                        redrawMap();
                    }
                });
            }

            function CreateChord(id, data, chart) {

                var totalContainerWidth = ($('#' + id + '-chart-container').width() - ($('#' + id + '-chart-container').width() * 0.2)) / numberChordPerRow;
                let tformMulti = 2;
                if(numberChordPerRow ==2){
                    tformMulti = 2.5;
                }
                var outerRadius = totalContainerWidth/tformMulti,
                    innerRadius = outerRadius - 100;
                height = Math.max(600,totalContainerWidth - 50);
                if(sidebyside){
                    height = Math.min(height,600);
                }
                width = totalContainerWidth - 50;

                var r1 = height / 2, r0 = r1 / 2;

                var chord = d3.layout.chord()
                    .padding(.02);

                chord.matrix(chart.dataMatrix);
                var arc = d3.svg.arc()
                    .innerRadius(innerRadius)
                    .outerRadius(innerRadius + 20);
                var windwidth = totalContainerWidth;

                var transForm = (($('#' + id + '-chart-container').width()) / 2) / numberChordPerRow;
                let svgWidth = 100/numberChordPerRow;
                if(sidebyside){
                    svgWidth = Math.min(svgWidth,40);
                }
                if($('#'+chart.chartId + "_svg").length>0){
                    $('#'+chart.chartId + "_svg").remove();
                }
                if($('#'+chart.chartId + "-tooltip").length>0){
                    $('#'+chart.chartId + "-tooltip").remove();
                }
                d3.select("#" + id + "-chart-container").append("div").attr("id", chart.chartId + "-tooltip").attr("class", "chord-tooltip").attr("chartidx", chartData.indexOf(chart));
                var svg = d3.select("#" + id + "-chart-container").append("svg:svg")
                    .attr("width",svgWidth+"%") //($('#' + id + '-chart-container').width()) / numberChordPerRow)
                    .attr("height", height)
                    .attr("chartIdx", chartData.indexOf(chart))
                    .attr("id", chart.chartId + "_svg")
                    .append("svg:g")
                    .attr("id", chart.chartId + "_circle")
                    .attr("selector", "chordcircle")
                    .attr("transform", "translate(" + transForm + "," + height / 2 + ")");
                svg.append("circle")
                    .attr("r", r0 );

                if(sidebyside) {
                    var mySVG = d3.select("#" + chart.chartId + "_svg").append("text").text(chart.chartName)
                        .style("font-size", "19px").style("font-weight","bold")
                        .attr("transform", "translate(" + (($('#' + id + '-chart-container').width() / (numberChordPerRow * 2)) - 65) + ",14)");

                    createToolTipTable(chart, chartData.indexOf(chart))
                }
                var g = svg.selectAll("#" + chart.chartId + "_circle g.group")
                    .data(chord.groups())
                    .enter().append("g")
                    .attr("class", "group")
                    .on("mouseover", function (d, i) {
                        var name = nameByIndex[i].col;
                         if (nameByIndex != undefined) {
                        changeCurrentDistrict(nameByIndex[i].col);
                    }
                        var allChordPaths = d3.selectAll('#' + id + '-chart-container .chord');
                        $('g[selector="chordcircle"]').toggleClass("hover");
                        console.log("source" + nameByIndex[i].col);
                        d3.selectAll('#' + id + '-chart-container .chord-tooltip')
                            .style("visibility",
                                function(d,i){
                                  var chartIdx = $(this).attr('chartIdx');
                                  var eventTarget = d3.event.currentTarget.ownerSVGElement.getAttribute("chartIdx")
                                   if (eventTarget == chartIdx) {
                                       return "visible";
                                   };
                                })
                            .html(function (idx) {

                                let chartIdx = $(this).attr('chartIdx');
                                let eventTarget = d3.event.currentTarget.ownerSVGElement.getAttribute("chartIdx");
                                let sum = chartData[$(this).attr('chartIdx')].dataMatrix[i].reduce(function (acc, val) {
                                           return acc + val;
                                       }, 0);
                                if(sidebyside) {
                                    addGroupToolTipTable(chartData[$(this).attr('chartIdx')], d, sum);
                                }
                                   if (eventTarget == chartIdx) {
                                      return groupTip(chartData[$(this).attr('chartIdx')].dataRdr(d), sum,chartData[$(this).attr('chartIdx')].chartTotal);
                                   } else {
                                        return "";

                                   }
                            })
                            .style("top", function () {
                                var x, y;

                                if (d3.event.pageY > height) {
                                    return height / 2 + "px";
                                }
                                return (d3.event.pageY - 80) + "px"
                            })
                            .style("left", function (d, i) {
                                var chartIdx = $(this).attr('chartIdx');
                                var eventTarget = d3.event.currentTarget.ownerSVGElement.getAttribute("chartIdx")
                                var xpos = width / numberChordPerRow;
                                if (eventTarget == chartIdx) {
                                    if ((d3.event.pageX - 50) > 0 || (d3.event.pageX - 50) > width) {
                                        return (d3.event.pageX - 50) + "px";
                                    } else {
                                        return 0 + "px";
                                    }
                                } else {
                                    var chartNum = +chartIdx;
                                    return (($('#' + id + '-chart-container').width() / numberChordPerRow) * (chartNum + 1) - 166) + "px";
                                }
                            })

                        allChordPaths.classed("faded", function (p) {
                            return p.source.index != i
                                && p.target.index != i;
                        });
                    })
                    .on("mouseout", function (d) {
                        //d3.selectAll('#' + id + '-div .chord-tooltiptablediv').style("visibility", "hidden").style('height','0px');
                        d3.select('#' + chart.chartId + '-tooltip').style("visibility", "hidden");
                        $('g[selector="chordcircle"]').toggleClass("hover");
                    });

                var groupPath = g.append("path")
                    .style("fill", function (d) {
                        return fill(d.index);
                    })
                    .style("stroke", function (d) {
                        return fill(d.index);
                    })
                    .attr("d", arc);

                var groupText = g.append("text")
                    .each(function (d) {
                        d.angle = (d.startAngle + d.endAngle) / 2;
                    })
                    .attr("dy", ".35em")
                    .attr("transform", function (d) {
                        return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
                            + "translate(" + (innerRadius + 26) + ")"
                            + (d.angle > Math.PI ? "rotate(180)" : "");
                    })
                    .style("text-anchor", function (d) {
                        return d.angle > Math.PI ? "end" : null;
                    })
                    .style("font-size", labelSize + "px")
                    .text(function (d) {
                        return nameByIndex[d.index].name;
                    });
                // Remove the labels that don't fit. :(
                groupText.filter(function (d, i) {
                    var check = groupPath[0][i];
                    //console.log("Group name:" + groupPath[0][i].nextSibling.innerHTML + " length:" + indexByName[groupPath[0][i].nextSibling.innerHTML].grptotal);
                    let idx = indexByName[groupPath[0][i].nextSibling.innerHTML].index;
                    let sum = chart.dataMatrix[idx].reduce(function (acc, val) {
                                           return acc + val;
                                       }, 0);
                    return (sum / chart.chartTotal * 100) < 1.5
                }).remove();

                var chordPaths = svg.selectAll("#" + chart.chartId + "_circle .chord")
                    .data(chord.chords)
                    .enter().append("svg:path")
                    .attr("class", "chord")
                    .style("stroke", function (d) {
                        return d3.rgb(fill(d.source.index)).darker();
                    })
                    .style("fill", function (d) {
                        return fill(d.source.index);
                    })
                    .attr("d", d3.svg.chord().radius(innerRadius)).on("mouseover", function (d) {

                        d3.selectAll('#' + id + '-chart-container .chord-tooltip')
                            .style("visibility", function(){
                                var chartIdx = $(this).attr('chartIdx');
                                var eventTarget = d3.event.currentTarget.ownerSVGElement.getAttribute("chartIdx")
                                if (eventTarget == chartIdx) {
                                    return "visible";
                                }
                            } )
                            .html(function () {
                                var sourceVal = chartData[$(this).attr('chartIdx')].dataMatrix[d.source.index][d.target.index];
                                var targetVal = chartData[$(this).attr('chartIdx')].dataMatrix[d.target.index][d.source.index];
                                let chart = chartData[$(this).attr('chartIdx')];
                                if(sidebyside) {
                                    addPathToolTipTable(sourceVal, targetVal, chart.dataRdr(d), chart);
                                }
                                return chordTip(sourceVal, targetVal, chart.dataRdr(d),chart.chartTotal)
                            })
                            .style("top", function () {
                                if (d3.event.pageY > height) {
                                    return height / 2 + "px";
                                }
                                return (d3.event.pageY - 80) + "px"
                            })
                            .style("left", function () {
                                var chartIdx = $(this).attr('chartIdx');
                                var eventTarget = d3.event.currentTarget.ownerSVGElement.getAttribute("chartIdx")
                                if (eventTarget == chartIdx) {
                                    if ((d3.event.pageX - 50) > 0 || (d3.event.pageX - 50) > width) {
                                        return (d3.event.pageX - 50) + "px";
                                    } else {
                                        return 0 + "px";
                                    }
                                } else {
                                    var chartNum = +chartIdx;
                                    return (($('#' + id + '-chart-container').width() / numberChordPerRow) * (chartNum + 1) - 166) + "px";
                                }
                            })
                        $('g[selector="chordcircle"]').toggleClass("hover");
                    })
                    .on("mouseout", function (d) {
                        // d3.selectAll('#' + id + '-div .chord-tooltiptablediv').style("visibility", "hidden").style('height','0px');
                        $('g[selector="chordcircle"]').toggleClass("hover");
                        d3.select("#" + chart.chartId + "-tooltip").style("visibility", "hidden")
                    });

                function chordTip(sourceVal, targetVal, d,chartTotal) {
                    var otherdist = indexByName[d.sname];
                    if (currentDistrict != d.tname) {
                        changeCurrentDistrict(d.sname, d.tname);
                    }
                    else {
                        changeCurrentDistrict(d.tname, d.sname);
                    }
                    var p = d3.format(".2%"), q = d3.format(",.0f")
                    var sourcePct = sourceVal;
                    var targetPct = targetVal;
                    if (showWholePercent) {
                        sourcePct = p(sourceVal / chartTotal);
                        targetPct = p(targetVal / chartTotal);
                        return ""
                            + indexByName[d.sname].name + " → " + indexByName[d.tname].name
                            + ": " + q(sourceVal) + " (" + sourcePct + ")<br/>"
                            + indexByName[d.tname].name + " → " + indexByName[d.sname].name
                            + ": " + q(targetVal) + " (" + targetPct + ")<br/>"
                    }
                    else {
                        return ""
                            + indexByName[d.sname].name + " → " + indexByName[d.tname].name
                            + ": " + sourceVal + "<br/>"
                            + indexByName[d.tname].name + " → " + indexByName[d.sname].name
                            + ": " + targetVal + "<br/>";
                    }
                }

                function addGroupToolTipTable(thisChart,d,sum){
                   var p = d3.format(".2%"), q = d3.format(",.0f")
                   let chartId= thisChart.chartId;
                   let dataStf = thisChart.dataRdr(d);
                   $('#'+chartId+"_tooltiptable").css("visibility","visible").css('height',"60px");
                   $('#'+chartId+"_tooltiptable table tbody").html("");
                   $('#'+chartId+"_tooltiptable table tbody").append("<tr>" +
                      "<td>"+indexByName[dataStf.gname].name+"</td>"+
                       "<td>"+"Total"+"</td>"+
                       "<td>"+q(sum) + " (" + p(sum / thisChart.chartTotal) + ")"+"</td>"+
                       "</tr>");
                }

                function addPathToolTipTable(sourceVal,destVal,dataObj,thisChart){
                   var p = d3.format(".2%"), q = d3.format(",.0f")
                   let chartId= thisChart.chartId;
                   $('#'+chartId+"_tooltiptable").css("visibility","visible").css('height',"60px");
                   $('#'+chartId+"_tooltiptable table tbody").html("");
                   $('#'+chartId+"_tooltiptable table tbody").append("<tr>" +
                      "<td>"+indexByName[dataObj.sname].name+"</td>"+
                       "<td>"+indexByName[dataObj.tname].name+"</td>"+
                       "<td>"+q(sourceVal) + " (" + p(sourceVal / thisChart.chartTotal) + ")"+"</td>"+
                       "</tr>");
                   $('#'+chartId+"_tooltiptable table tbody").append("<tr>" +
                      "<td>"+indexByName[dataObj.tname].name+"</td>"+
                       "<td>"+indexByName[dataObj.sname].name+"</td>"+
                       "<td>"+q(destVal) + " (" + p(destVal / thisChart.chartTotal) + ")"+"</td>"+
                       "</tr>");
                }
                function groupTip(d, total,chartTotal) {
                    var p = d3.format(".2%"), q = d3.format(",.0f")
                    var value = d.gvalue;
                    if (showWholePercent) {
                        return ""
                            + indexByName[d.gname].name + " : " + q(total) + " (" + p(total / chartTotal) + ") <br/>";
                    } else {
                        return ""
                            + indexByName[d.gname].name + " : " + q(total) + "<br/>";
                    }
                }

                function createToolTipTable(chart, chartIdx) {
                    if($('#'+id+'-tooltiptablediv').length ==0){
                        $('#' + id + '-div').append("<div id='" + id+"-tooltiptablediv'   ></div>");
                    }


                    if($('#'+chart.chartId+"_tooltiptable").length ==0) {
                        $('#' + id+'-tooltiptablediv').append("<div id='" + chart.chartId + "_tooltiptable' class='chord-tooltiptablediv' ></div>");
                        var mydiv = $('#' + chart.chartId + "_tooltiptable");
                        mydiv.css("width", 98 / numberChordPerRow + "%");
                        mydiv.css("visibility","hidden");
                        mydiv.css("max-width","44%");
                        $('#' + chart.chartId + "_tooltiptable").append("<table class='table-condensed table-bordered chord-tooltiptable'><thead><tr><th style='width:30%'>ORIGIN</th><th style='width:30%'>DESTINATION</th><th style='width:30%'>DATA</th></tr></thead>" +
                            "<tbody></tbody>" +
                            "</table>");
                        //.attr("transform", "translate(" + ($('#' + id + '-chart-container').width() / (numberChordPerRow * 2) - 25) + ",14)");

                            mydiv.css("display", "inline-block");

                        if(chartData.length ==2 && chartIdx==1){
                            $('#' + chart.chartId + "_tooltiptable table").css('margin-left','12%');
                        }
                    }
                }

                data = null;

                function changeCurrentDistrict(newCurrentDistrict, destinationDistrict) {
                    if (currentDistrict != newCurrentDistrict) {
                        console.log('changing from ' + currentDistrict + " to " + newCurrentDistrict);
                        currentDistrict = newCurrentDistrict;
                        if (destinationDistrict != null) {
                            currentDestDistrict = destinationDistrict;
                        }
                        else {
                            currentDestDistrict = null;
                        }

                        setTimeout(redrawMap, CSS_UPDATE_PAUSE);
                    }
                    else {
                        if (destinationDistrict != currentDestDistrict) {
                            currentDestDistrict = destinationDistrict;
                        }
                        setTimeout(redrawMap, CSS_UPDATE_PAUSE);
                    }

                }
            }


            function readInFilterData(callback) {
                if (ZONE_FILTER_LOC != '') {
                    var zonecsv;
                    try {
                        d3.csv(dataLocation + abmviz_utilities.GetURLParameter("scenario") + "/" + ZONE_FILTER_LOC, function (error, filterdata) {
                            //zonecsv = d3.csv.parseRows(filterdata).slice(1);
                            if (error) {
                                $('#chord').html("<div class='container'><h3><span class='alert alert-danger'>Error: An error occurred while loading the chord data.</span></h3></div>");
                                throw error;
                            }
                            zoneheaders = d3.keys(filterdata[0]);
                            zoneFilterNameCol = zoneheaders[1];
                            ;
                            zoneFilterData = d3.nest().key(function (d) {

                                return "filters";
                            }).map(filterdata);
                            callback();
                        });
                    }
                    catch (error) {
                        console.log(error);
                    }
                } else {
                    callback();
                }
            }

            function styleZoneGeoJSONLayer(feature) {
                var color = naColor;
                var isZoneVisible = false;
                if (feature.properties.NAME != undefined && currentDistrict != "") {
                    var zoneDataFeature = feature.properties.NAME;


                    var findDistrict = currentDistrict;//.replace(/\s/g, ".");
                    isZoneVisible = zoneDataFeature == findDistrict;
                    var district = indexByName[findDistrict];
                    color = fill(indexByName[findDistrict].index);

                }

                //end if we have data for this zone
                //the allowed options are described here: http://leafletjs.com/reference.html#path-options
                var returnStyle = {
                    //all SVG styles allowed
                    fillColor: color,
                    fillOpacity: isZoneVisible ? 0.7 : 0.0,
                    weight: 1,
                    color: "darkGrey",
                    strokeOpacity: 0.05,
                    stroke: false
                };
                return (returnStyle);
            }

            function styleDestZoneGeoJSONLayer(feature) {
                var color = naColor;
                var isZoneVisible = false;
                if (feature.properties.NAME != undefined && currentDestDistrict != undefined && currentDestDistrict != "") {
                    var zoneDataFeature = feature.properties.NAME;
                    //possible that even if data for zone exists, could be missing this particular trip mode

                    isZoneVisible = zoneDataFeature == currentDestDistrict;

                    var findDistrict = currentDestDistrict;//.replace(/\s/g, ".");
                    var district = indexByName[findDistrict];
                    color = fill(indexByName[findDistrict].index);

                }
                //end if we have data for this trip mode

                //end if we have data for this zone
                //the allowed options are described here: http://leafletjs.com/reference.html#path-options
                var returnStyle = {
                    //all SVG styles allowed
                    fillColor: color,
                    fillOpacity: isZoneVisible ? 0.7 : 0.0,
                    weight: 1,
                    color: "darkGrey",
                    strokeOpacity: 0.05,
                    stroke: false
                };
                return (returnStyle);
            }

            //end styleZoneGeoJSONLayer function
            function styleCountyGeoJSONLayer(feature) {
                var returnStyle = {
                    //all SVG styles allowed
                    fill: true,
                    fillOpacity: 0.0,
                    stroke: true,
                    weight: 1,
                    strokeOpacity: 0.25,
                    color: "gray"
                };
                return (returnStyle);
            }

            function updateDesireLines() {
                var color = naColor;
                var isZoneVisible = false;
                var findDistrict = currentDistrict;
                // Create initial scales for lines on map (width and opacity)
                var w = d3.scale.linear().range([0, 50]);
                var op = d3.scale.linear().range([0, 1]);
                var featureValue = 0;
                var featureGrpTotal = 0;
                desireLines.forEach(function (desireLine) {
                    var zoneData = desireLine.properties.o;
                    isZoneVisible = false;
                    featureGrpTotal = 0;
                    featureValue = 0;
                    if (zoneData != undefined) {
                        var zoneDataFeatureOrigin = desireLine.properties.o;
                        var zoneDataFeatureDest = desireLine.properties.d;
                        if (datamatrix.length > 0) {
                            var origDist = zoneDataFeatureOrigin;

                            var destDist = zoneDataFeatureDest;

                            featureValue = chartData[0].dataMatrix[indexByName[origDist].index][indexByName[destDist].index];// + datamatrix[indexByName[destDist].index][indexByName[origDist].index];
                        }
                        if (zoneDataFeatureOrigin != undefined && findDistrict != "") {
                            if (currentDestDistrict != null) {
                                isZoneVisible = zoneDataFeatureOrigin == findDistrict && zoneDataFeatureDest == currentDestDistrict;
                            } else {
                                isZoneVisible = zoneDataFeatureOrigin == findDistrict;
                            }
                            if (featureValue == 0) {
                                isZoneVisible = false;
                            }
                            color = fill(indexByName[findDistrict].index);
                            let sum = chartData[0].dataMatrix[indexByName[findDistrict].index].reduce(function (acc, val) {
                                           return acc + val;
                                       }, 0);
                            featureGrpTotal = sum;

                        }
                    } //end if we have data for this zone

                    w.domain([0, featureGrpTotal]);
                    op.domain([0, featureGrpTotal]);
                    var returnStyle = {};
                    if (isZoneVisible) {
                        returnStyle = {
                            //all SVG styles allowed
                            // fillColor: color,

                            weight: w(featureValue),
                            color: color,
                            strokeOpacity: op(featureValue),
                            stroke: isZoneVisible ? true : false
                        }
                    } else {
                        returnStyle = {
                            //all SVG styles allowed
                            // fillColor: color,

                            weight: 0,
                            color: color,
                            strokeOpacity: 0,
                            stroke: false
                        }

                    }
                    desireLine.setStyle(returnStyle);
                });
            }


            function styleFocusGeoJSONLayer(feature) {
                var returnStyle = {
                    //all SVG styles allowed
                    stroke: true,
                    weight: 5,
                    color: focusColor
                };
                return (returnStyle);
            }

            function createMap(callback) {
                //var latlngcenter = JSON.parse(CENTER_LOC);
                //var lat=latlngcenter[0];
                //var lng=latlngcenter[1];
                if(sidebyside) {
                    $('#'+id+"-chart-map").remove();
                    $('#'+id+'-div .chordchartdiv').removeClass("right-border");
                    callback();
                    return;
                } else {
                    $('#'+id+'-div .chordchartdiv').addClass("col-sm-6");

                    $('#'+id+'-datatable-div').css("margin-top","-1%");

                }
                if ($('#'+id + "-by-district-map").children().length >0) {
                    $('#'+id + "-by-district-map").html('');
                    $('#'+id + "-by-district-map").removeClass();
                    $('#'+id + "-by-district-map").addClass("col-xs-12");
                }
                var tonerLayer = L.tileLayer('//stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}.png', {
                    id: id + "-by-district-map.toner",
                    updateWhenIdle: true,
                    unloadInvisibleFiles: true,
                    reuseTiles: true,
                    opacity: 1.0
                });
                var Esri_WorldImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                    id: id + "-by-district-map.aerial",
                    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                });

                var container = L.DomUtil.get(id + "-by-district-map"); if(container != null){ container._leaflet_id = null; }
                map = new L.map(id + "-by-district-map", {
                    minZoom: 6,
                    layers: [tonerLayer]
                }).setView(CENTER_LOC, 9);
                var baseMaps = {
                    "Grayscale": tonerLayer,
                    "Aerial": Esri_WorldImagery

                }
                controlLayer = L.control.layers(baseMaps).addTo(map);
                //centered at Atlanta
                map.on('zoomend', function (type, target) {
                    var zoomLevel = map.getZoom();
                    var zoomScale = map.getZoomScale();
                    console.log('zoomLevel: ', zoomLevel, ' zoomScale: ', zoomScale);
                });
                countiesSet = new Set();
                $.getJSON(dataLocation + ZONE_FILE_LOC, function (zoneTiles) {
                    "use strict";
                    circleMarkers = [];
                    for (var i = 0; i < zoneTiles.features.length; i++) {
                        var feature = zoneTiles.features[i];

                        var centroid = L.latLngBounds(feature.geometry.coordinates[0]).getCenter();


                        var circleMarker = L.circleMarker(L.latLng(centroid.lng, centroid.lat), circleStyle);
                        circleMarker.properties = {"NAME": feature.properties.NAME};
                        if (feature.properties.NAME != undefined && feature.properties.NAME != "") {
                            circleMarkers.push(circleMarker);
                        }
                    }

                    desireLines = [];
                    for (var i = 0; i < circleMarkers.length; i++) {
                        var origLat = circleMarkers[i]["_latlng"];
                        var origDist = circleMarkers[i].properties.NAME;//circleMarkers[i]["zoneData"].ID;

                        $.each(circleMarkers, function (idx, marker) {
                            var destDist = marker["properties"].NAME;
                            var destLatLng = marker["_latlng"];
                            var latlngs = [];
                            latlngs.push(origLat, destLatLng);
                            var desireLine = L.polyline(latlngs);
                            //desireLine.zoneData = zoneData;
                            desireLine.properties = {
                                o: origDist,
                                d: destDist
                            }
                            desireLines.push(desireLine);
                        });

                    }
                    desireLineLayerGroup = L.layerGroup(desireLines);
                    circlesLayerGroup = L.layerGroup(circleMarkers);



                    zoneDataLayer = L.geoJson(zoneTiles, {
                        updateWhenIdle: true,
                        unloadInvisibleFiles: true,
                        reuseTiles: true,
                        opacity: 1.0,
                        style: styleZoneGeoJSONLayer
                    });
                    if (currentDestDistrict != null) {
                        destZoneDataLayer = L.geoJson(zoneTiles, {
                            updateWhenIdle: true,
                            unloadInvisibleFiles: true,
                            reuseTiles: true,
                            opacity: 1.0,
                            style: styleDestZoneGeoJSONLayer
                        });
                    }


                    if (scenarioPolyFile != undefined) {
                        $.getJSON(dataLocation + abmviz_utilities.GetURLParameter("scenario") + "/" + scenarioPolyFile, function (scenarioTiles) {
                            "use strict";
                            focusLayer = L.geoJSON(scenarioTiles, {
                                style: styleFocusGeoJSONLayer
                            });

                        }).complete(function (d) {
                            controlLayer.addOverlay(focusLayer, "Focus");
                        });
                    }
                    //underlyingMapLayer.addTo(map);
                    $.getJSON(dataLocation + COUNTY_FILE, function (countyTiles) {
                        "use strict";
                        console.log(COUNTY_FILE + " success");
                        //http://leafletjs.com/reference.html#tilelayer
                        countyLayer = L.geoJson(countyTiles, {
                            //keep only counties that we have data for
                            filter: function (feature) {
                                console.log(feature.properties.NAME);
                                //  console.log( countiesSet.has(feature.properties.NAME));
                                return true;
                            },
                            updateWhenIdle: true,
                            unloadInvisibleFiles: true,
                            reuseTiles: true,
                            opacity: 1.0,
                            style: styleCountyGeoJSONLayer
                            //onEachFeature: onEachCounty
                        });
                        var allCountyBounds = countyLayer.getBounds();
                        //		console.log(allCountyBounds);
                        if (!SCENARIO_FOCUS)
                            map.fitBounds(allCountyBounds);
                        map.setMaxBounds(allCountyBounds);

                        countyLayer.addTo(map);
                    }).success(function () {
                        console.log(COUNTY_FILE + " second success");
                    }).error(function (jqXHR, textStatus, errorThrown) {
                        console.log(COUNTY_FILE + " textStatus " + textStatus);
                        console.log(COUNTY_FILE + " errorThrown" + errorThrown);
                        console.log(COUNTY_FILE + " responseText (incoming?)" + jqXHR.responseText);
                    }).complete(function () {
                        console.log(COUNTY_FILE + " complete");
                        controlLayer.addOverlay(countyLayer, "Counties");
                        controlLayer.addOverlay(desireLineLayerGroup, "Desire Lines");
                        if(DESIRELINESONDEFAULT) {
                            desireLineLayerGroup.addTo(map);
                        }
                        updateDesireLines();
                    });
                    if (!SCENARIO_FOCUS) {
                        $('#' + id + '-chart-map').css("margin-top", $('#' + id + '-dropdown-div').height() / 2 + "px");
                    }

                }).complete(function () {
                    if(!DESIRELINESONDEFAULT) {
                        zoneDataLayer.addTo(map);
                    }
                    controlLayer.addOverlay(zoneDataLayer, "Zones");
                });

                function getDesireLineLayer() {
                }

                //end geoJson of zone layer
                callback();
            }; //end createMap
            //goThroughChordData();
            window.addEventListener("resize", function () {
                console.log("Got resize event. Calling createTimeUse");
                goThroughChordData();
            });

            function redrawMap() {
                "use strict";
                if(sidebyside){
                    return;
                }
                if(map == undefined){
                    createMap();

                }
                if (map.hasLayer(zoneDataLayer)) {
                    console.log("zone layer on");
                    zoneDataLayer.setStyle(styleZoneGeoJSONLayer);
                    if (destZoneDataLayer != undefined) {
                        destZoneDataLayer.addTo(map);
                        destZoneDataLayer.setStyle(styleDestZoneGeoJSONLayer);
                    }
                } else {
                    map.removeLayer(destZoneDataLayer);
                }
                if (map.hasLayer(desireLineLayerGroup)) {
                    updateDesireLines();
                }
                //zoneDataLayer.addTo(map);
                if (scenarioPolyFile != undefined) {
                    focusLayer.setStyle(styleFocusGeoJSONLayer);
                    focusLayer.bringToBack();
                }
                if (!SCENARIO_FOCUS) {
                    $('#' + id + '-chart-map').css("margin-top", $('#' + id + '-dropdown-div').height() / 2 + "px");
                }

            }
        }
};