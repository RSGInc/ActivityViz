//encapsulate all code within a IIFE (Immediately-invoked-function-expression) to avoid polluting global namespace
//global object chord will contain functions and variables that must be accessible from elsewhere
var ChordChart = {

chord:
function chord (id,indx) {
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
    var chartData;
    var outerRadius = width / 2,
        innerRadius = outerRadius - 130;
    var json = null;
    var palette = [["rgb(0, 0, 0)", "rgb(67, 67, 67)", "rgb(102, 102, 102)", "rgb(204, 204, 204)", "rgb(217, 217, 217)", "rgb(255, 255, 255)"], ["rgb(152, 0, 0)", "rgb(255, 0, 0)", "rgb(255, 153, 0)", "rgb(255, 255, 0)", "rgb(0, 255, 0)", "rgb(0, 255, 255)", "rgb(74, 134, 232)", "rgb(0, 0, 255)", "rgb(153, 0, 255)", "rgb(255, 0, 255)"], ["rgb(230, 184, 175)", "rgb(244, 204, 204)", "rgb(252, 229, 205)", "rgb(255, 242, 204)", "rgb(217, 234, 211)", "rgb(208, 224, 227)", "rgb(201, 218, 248)", "rgb(207, 226, 243)", "rgb(217, 210, 233)", "rgb(234, 209, 220)", "rgb(221, 126, 107)", "rgb(234, 153, 153)", "rgb(249, 203, 156)", "rgb(255, 229, 153)", "rgb(182, 215, 168)", "rgb(162, 196, 201)", "rgb(164, 194, 244)", "rgb(159, 197, 232)", "rgb(180, 167, 214)", "rgb(213, 166, 189)", "rgb(204, 65, 37)", "rgb(224, 102, 102)", "rgb(246, 178, 107)", "rgb(255, 217, 102)", "rgb(147, 196, 125)", "rgb(118, 165, 175)", "rgb(109, 158, 235)", "rgb(111, 168, 220)", "rgb(142, 124, 195)", "rgb(194, 123, 160)", "rgb(166, 28, 0)", "rgb(204, 0, 0)", "rgb(230, 145, 56)", "rgb(241, 194, 50)", "rgb(106, 168, 79)", "rgb(69, 129, 142)", "rgb(60, 120, 216)", "rgb(61, 133, 198)", "rgb(103, 78, 167)", "rgb(166, 77, 121)", "rgb(91, 15, 0)", "rgb(102, 0, 0)", "rgb(120, 63, 4)", "rgb(127, 96, 0)", "rgb(39, 78, 19)", "rgb(12, 52, 61)", "rgb(28, 69, 135)", "rgb(7, 55, 99)", "rgb(32, 18, 77)", "rgb(76, 17, 48)"]];
    var originalNodeData;
    var naColor = "White";
    var focusColor = "Yellow";
    var CSS_UPDATE_PAUSE = 150;
    var currentDistrict = "";
    var currentDestDistrict = "";
    var colors = {}; //will be filled in to map keys to colors
    var map;
    var DESIRELINE_FILE_LOC = "";
    var controlLayer;
    var ZONE_FILTER_LOC = "";
    var zoneFilterData;

    var showDesireLines = false;
    var zoneheaders = [];
    var circleStyle = {
        "stroke": false,
        "fillColor": "set by updateBubbles",
        "fillOpacity": 1.0
    };
    var indexByName = {};
    var nameByIndex = {};
    var rawData;
    var legendHeadersShowHide = {};
    var zoneData;
    var circleMarkers;
    var legendRows = 4;
//config file options
    var COUNTY_FILE = "";
    var ZONE_FILE_LOC = "";
    var CENTER_LOC = [];
    var labelSize = 10;
    var showCycleTools = true;
    var zoneDataLayer;
    var destZoneDataLayer;
    var desireLineDataLayer;
    var countyLayer;
    var focusLayer;
    var SCENARIO_FOCUS = false;
    var scenarioPolyFile;
    var fill = d3.scale.category20();
    var chartOnPage = $('#' + id + '_circle').length == 0;
    var circlesLayerGroup;
    var formatPercent = d3.format(".1%");
    var showGrpPercent = false;
    var showWholePercent = true;
    var wholeDataTotal = 0;
    var legendText = "Legend";
    var datamatrix;
    function getConfigSettings(callback) {
        if (chartOnPage) {
            $.getJSON(dataLocation + "region.json", function (data) {
                var configName = "Default";
                if (data["scenarios"][scenario].visualizations != undefined) {
                    if (data["scenarios"][scenario].visualizations["Chord"][indx].file) {
                        fileName = data["scenarios"][scenario].visualizations["Chord"][indx].file;
                        var infoBox;
                        if (data["scenarios"][scenario].visualizations["Chord"][indx].info) {
                            infoBox = data["scenarios"][scenario].visualizations["Chord"][indx].info;
                            $('#' + id + '-div span.glyphicon-info-sign').attr("title", infoBox);
                            $('#' + id + '-div [data-toggle="tooltip"]').tooltip();
                        }
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
                        if(opt =="ZoneFile") {
                            ZONE_FILE_LOC = value;
                        }
                        if(opt =="DesireLines"){
                            DESIRELINE_FILE_LOC = value;
                        }

                    });
                }
            }).complete(function () {

                callback();
                ZONE_FILTER_LOC = ZONE_FILTER_LOC;
                $("#chord-grouppercent").off().click(function () {
                    showGrpPercent = !showGrpPercent;
                    createChord();
                });
                $("#chord-wholepercent").off().click(function () {
                    showWholePercent = !showWholePercent;
                    createChord();
                });
            });


        }
    }

    getConfigSettings(function () {
        readInData(function () {

        })
    });

    function readInData(callback) {
        readInFilterData(function () {
            createMap(function () {
                createChord();
            })
        })

    }
    function createChord() {
        datamatrix = [];
        //read in data and create chord when finished

        d3.csv(url, function (error, data) {
            var excludeSameOD = true;
            "use strict";
            if (error) {
                $('#chord').html("<div class='container'><h3><span class='alert alert-danger'>Error: An error occurred while loading the chord data.</span></h3></div>");
                throw error;
            }
            var headers = d3.keys(data[0]);
            var columnsDT=[];
            if(! $.fn.DataTable.isDataTable('#'+id+'-datatable-table')) {
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
            //var csv = d3.csv.parseRows(data).slice(1);
            //var headers = d3.keys(data[0]);
            var quantities = headers.slice(2);
            var legendHead = headers.slice(2, headers.len);
            var showLegendHead = true;
            if (_.size(legendHeadersShowHide) == 0) {
                for (var i = 0; i < legendHead.length; i++) {
                    legendHeadersShowHide[legendHead[i]] = showLegendHead;
                    showLegendHead = false;
                }
            }
            $('.chord-chart-maingroup').text(legendText);

            mainGroupColumnName = headers[0];
            subGroupColumnName = headers[1];
            if (subGroupColumnName == undefined) {
                $('#chord').html("<div class='container'><h3><span class='alert alert-danger'>Error: An error occurred while loading the chord data.</span></h3></div>");
                return;
            }
            quantityColumn = 3;

            indexByName = {};
            nameByIndex = {};
            var totalContainerWidth = $('#' + id + '-chart-container').width() - ($('#' + id + '-chart-container').width() * 0.2);
            var outerRadius = totalContainerWidth / 2,
                innerRadius = outerRadius - 130;
            height = totalContainerWidth - 50;
            width = totalContainerWidth - 50;


            var r1 = height / 2, r0 = r1 / 2;
            var chord = d3.layout.chord()
                .padding(.02)
                .sortSubgroups(d3.descending)
                .sortChords(d3.descending);

            var arc = d3.svg.arc()
                .innerRadius(innerRadius)
                .outerRadius(innerRadius + 20);
            var windwidth = totalContainerWidth;
            d3.select('#' + id + '-chart-container').select("svg").remove();
            d3.select('#' + id + '-dropdown-div').select("svg").remove();
            var transForm = ($('#' + id + '-chart-container').width() / 2);
            var svg = d3.select("#" + id + "-chart-container").append("svg:svg")
                .attr("width", $('#' + id + '-chart-container').width())
                .attr("height", height)
                //.style("padding-left", "3%")
                //style("padding-right", "3%")
                .append("svg:g")
                .attr("id", id + "_circle")
                .attr("selector", "chordcircle")
                .attr("transform", "translate(" + transForm + "," + height / 2 + ")");
            svg.append("circle")
                .attr("r", r0 + 20);
            var n = 0;
            wholeDataTotal = 0;

            data.forEach(function (d) {
                var total = 0;
                var grpTotal = 0;
                if (excludeSameOD && d[mainGroupColumnName] == d[subGroupColumnName]) {
                    //do nothing we don't want the same O/D data
                } else {


                    for (var i = 0; i < _.size(legendHeadersShowHide); i++) {
                        if (legendHeadersShowHide[legendHead[i]]) {
                            var value = Number.parseFloat(d[legendHead[i]]);
                            total += value;
                            grpTotal += value;
                        }
                    }
                    d.Total = (Number.parseFloat(total));
                    if (!(d[mainGroupColumnName] in indexByName)) {
                        var uniqueRec = zoneFilterData.filters.find(x => x[zoneheaders[1]] == d[mainGroupColumnName]);
                        if(uniqueRec)
                            uniqueRec = uniqueRec.ID;
                        else
                            uniqueRec = 0;
                        nameByIndex[n] = {
                            name: d[mainGroupColumnName],
                            col: d[mainGroupColumnName],
                            index: n,
                            grptotal: Number.parseFloat(total),
                            uniqueid: uniqueRec
                    }
                        ;

                        indexByName[d[mainGroupColumnName]] = {
                            index: n++,
                            name: d[mainGroupColumnName],
                            grptotal: Number.parseFloat(total),
                            uniqueid: uniqueRec
                    }
                        ;

                    } else {
                        indexByName[d[mainGroupColumnName]].grptotal += Number.parseFloat(total);
                        nameByIndex[indexByName[d[mainGroupColumnName]].index].grptotal += Number.parseFloat(total);
                    }
                    wholeDataTotal += total;
                }
            });
            //initialize matrix
            for (var i = 0; i < _.size(indexByName); i++) {
                datamatrix[i] = [];
                for (var j = 0; j < _.size(indexByName); j++) {
                    datamatrix[i][j] = 0;
                }
            }

            //populate matrices
            data.forEach(function (d) {
                var mainGrp = d[mainGroupColumnName];
                var subGrp = d[subGroupColumnName];

                if (excludeSameOD && mainGrp == subGrp) {

                } else {
                    datamatrix[indexByName[mainGrp].index][indexByName[subGrp].index] = d.Total;
                }
            });
            var matrixmap = chordMpr(data);
            matrixmap.addValuesToMap("FROM")
                .setFilter(function (row, a, b) {
                    return (row.FROM === a.name && row.TO === b.name)
                }).setAccessor(function (recs, a, b) {
                if (!recs[0]) return 0;
                return recs[0].Total;
            });

            function value() {
                console.log();
            }

            var rdr = chordRdr(matrixmap.getMatrix(), matrixmap.getMap());
            chord.matrix(datamatrix);

            var g = svg.selectAll("g.group")
                .data(chord.groups())
                .enter().append("g")
                .attr("class", "group")
                .on("mouseover", mouseover)
                .on("mouseout", function (d) {
                    d3.select('#' + id + '-tooltip').style("visibility", "hidden")
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
                console.log("Group name:" + groupPath[0][i].nextSibling.innerHTML + " length:" + indexByName[groupPath[0][i].nextSibling.innerHTML].grptotal);
                return (indexByName[groupPath[0][i].nextSibling.innerHTML].grptotal / wholeDataTotal * 100) < 1.5
            })
                .remove();

            //svg.selectAll('.group text').call(wrap,120);
            var chordPaths = svg.selectAll(".chord")
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
                    d3.select("#" + id + "-tooltip")
                        .style("visibility", "visible")
                        .html(chordTip(rdr(d)))
                        .style("top", function () {
                            if (d3.event.pageY > height) {
                                return (height / 2) + "px";
                            }
                            return (d3.event.pageY - 100) + "px"
                        })
                        .style("left", function () {
                            if (d3.event.pageX + 100 > width / 2) {
                                return width / 2 + "px";
                            }
                            return (d3.event.pageX + 100) + "px";
                        })

                })
                .on("mouseout", function (d) {
                    d3.select("#" + id + "-tooltip").style("visibility", "hidden")
                });

            function chordTip(d, i) {
                var otherdist = indexByName[d.sname];
                if (currentDistrict != d.tname) {
                    changeCurrentDistrict(d.sname, d.tname);
                }
                else {
                    changeCurrentDistrict(d.tname, d.sname);
                }
                var p = d3.format(".2%"), q = d3.format(",.0f")
                var sourceVal = d.svalue;
                var targetVal = d.tvalue;
                if (showWholePercent) {
                    sourceVal = p(sourceVal / wholeDataTotal);
                    targetVal = p(targetVal / wholeDataTotal);
                    return ""
                        + indexByName[d.sname].name + " → " + indexByName[d.tname].name
                        + ": " + q(d.svalue) + " (" + sourceVal + ")<br/>"
                        + indexByName[d.tname].name + " → " + indexByName[d.sname].name
                        + ": " + q(d.tvalue) + " (" + targetVal + ")<br/>"
                }
                else {
                    return ""
                        + indexByName[d.sname].name + " → " + indexByName[d.tname].name
                        + ": " + sourceVal + "<br/>"
                        + indexByName[d.tname].name + " → " + indexByName[d.sname].name
                        + ": " + targetVal + "<br/>";
                }
            }

            function groupTip(d) {
                var p = d3.format(".2%"), q = d3.format(",.0f")
                var value = d.gvalue;
                if (showWholePercent) {
                    return ""
                        + indexByName[d.gname].name + " : " + q(value) + " (" + p(value / wholeDataTotal) + ") <br/>";
                } else {
                    return ""
                        + indexByName[d.gname].name + " : " + q(value) + "<br/>";
                }
            }

            function mouseover(d, i) {
                var name = nameByIndex[i].col;
                console.log("source" + nameByIndex[i].col);
                d3.select("#" + id + "-tooltip")
                    .style("visibility", "visible")
                    .html(groupTip(rdr(d)))
                    .style("top", function () {
                        if (d3.event.pageY > height) {
                            return height / 2 + "px";
                        }
                        return (d3.event.pageY - 80) + "px"
                    })
                    .style("left", function () {
                        if ((d3.event.pageX - 50) > 0 || (d3.event.pageX - 50) > width) {
                            return (d3.event.pageX - 50) + "px";
                        } else {
                            return 0 + "px";
                        }
                    })
                if (nameByIndex != undefined) {
                    changeCurrentDistrict(nameByIndex[i].col);
                }
                chordPaths.classed("faded", function (p) {
                    //console.log("source" + nameByIndex[p.source.index]);

                    return p.source.index != i
                        && p.target.index != i;
                });
            }

            data = null;

            var size = _.size(legendHeadersShowHide);
            var legendWidth = $('#' + id + '-chart-container').width();
            var columns = Math.floor(legendWidth/ 165);
            var lines = Number.parseInt(Math.ceil(size / columns));
            var legheight = 30 * lines;
            var container = d3.select("#" + id + "-dropdown-div").append("svg")

                .attr("width", legendWidth).attr("height", legheight).style('padding-top', "10px");
            if (!SCENARIO_FOCUS) {
                $('#' + id + '-chart-map').css("margin-top", $('#' + id + '-dropdown-div').height() / 2 + "px");
            }
            if(DESIRELINE_FILE_LOC){
                $('#' + id + '-chart-map').css("margin-top", $('#' + id + '-chckboxes').height() / 2 + "px");

            }
            var dataL = 0;
            var offset = 100;
            var prevLegendLength = 0;
            var xOff, yOff;

            var legendOrdinal = container.selectAll('.chordLegend').data(legendHead)
                .enter().append('g').attr('class', 'chordLegend').attr("transform", function (d, i) {
                    var calcX = (i % legendRows) * (legendWidth / columns);
                    xOff = (i % legendRows) * 165;
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
        });

        //end d3.csv

        function showHideBlobs(d) {
            if(legendHeadersShowHide[d] == false){
                legendHeadersShowHide[d] = true;
            } //if the blob is false, set it to true
            //set all others to false
            for (var i in legendHeadersShowHide) {
                if (i != d) {
                    legendHeadersShowHide[i] = false;
                }
            }


            createChord();
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
        $("#" + id + "-desirelines").click(function (e) {
            if ($("#" + id + "-desirelines").is(":checked")) {
                $("#" + id + "-chkzone").prop('checked', false);
            } else {
                $("#" + id + "-chkzone").prop('checked', true)
            }
            setTimeout(redrawMap, CSS_UPDATE_PAUSE);
        });
        $("#" + id + "-chkzone").click(function () {
            if ($("#" + id + "-chkzone").is(":checked")) {
                $("#" + id + "-desirelines").prop('checked', false);
            } else {
                $("#" + id + "-desirelines").prop('checked', true)
            }
            setTimeout(redrawMap, CSS_UPDATE_PAUSE);
        });
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
        if (feature.zoneData != undefined) {
            var zoneDataFeature = feature.zoneData[currentDistrict];
            //possible that even if data for zone exists, could be missing this particular trip mode
            if (zoneDataFeature != undefined) {
                isZoneVisible = zoneDataFeature == "1";
                if (zoneDataFeature == undefined) {
                    throw ("Something is wrong. zoneDataFeature.QUANTITY is undefined. " + JSON.stringify(zoneDataFeature));
                }
                var findDistrict = currentDistrict;//.replace(/\s/g, ".");
                var district = indexByName[findDistrict];
                color = fill(indexByName[findDistrict].index);
            }
            //end if we have data for this trip mode
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
        if (feature.zoneData != undefined) {
            var zoneDataFeature = feature.zoneData[currentDestDistrict];
            //possible that even if data for zone exists, could be missing this particular trip mode
            if (zoneDataFeature != undefined) {
                isZoneVisible = zoneDataFeature == "1";
                if (zoneDataFeature == undefined) {
                    throw ("Something is wrong. zoneDataFeature.QUANTITY is undefined. " + JSON.stringify(zoneDataFeature));
                }
                var findDistrict = currentDestDistrict;//.replace(/\s/g, ".");
                var district = indexByName[findDistrict];
                color = fill(indexByName[findDistrict].index);

            }
            //end if we have data for this trip mode

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

    function redrawMap() {
        "use strict";
        showDesireLines = $('#'+id+'-desirelines').is(':checked');

            if(map.hasLayer(zoneDataLayer)){
                console.log("zone layer on");
                 zoneDataLayer.setStyle(styleZoneGeoJSONLayer);
                         if(destZoneDataLayer !=undefined){
                destZoneDataLayer.addTo(map);
                 destZoneDataLayer.setStyle(styleDestZoneGeoJSONLayer);
            }

            }  else {
                map.removeLayer(destZoneDataLayer);
            }
            if(map.hasLayer(desireLineDataLayer)){
                  desireLineDataLayer.setStyle(styleDesireLineGeoJSONLayer);
            }
            //zoneDataLayer.addTo(map);


        if (scenarioPolyFile != undefined) {
            focusLayer.setStyle(styleFocusGeoJSONLayer);
            focusLayer.bringToBack();
        }
        if (!SCENARIO_FOCUS) {
            $('#' + id + '-chart-map').css("margin-top", $('#' + id + '-dropdown-div').height() / 2 + "px");
        }
        if(DESIRELINE_FILE_LOC){
            $('#' + id + '-chart-map').css("margin-top", $('#' + id + '-chckboxes').height() / 2 + "px");

        }
    }

    function styleDesireLineGeoJSONLayer(feature){
         var color = naColor;
        var isZoneVisible = false;
          var findDistrict = currentDistrict;
              // Create initial scales for lines on map (width and opacity)
        var w = d3.scale.linear().range([0, 50]);
        var op = d3.scale.linear().range([0, 1]);
        var featureValue = 0;
        var featureGrpTotal = 0;
        if (feature.zoneData != undefined) {
            var zoneDataFeatureOrigin = feature.properties.o;
            var zoneDataFeatureDest = feature.properties.d;
            if(datamatrix.length >0) {
                var origIdx = zoneFilterData.filters.findIndex(x=> x[zoneheaders[0]] ==zoneDataFeatureOrigin);
                var destIdx = zoneFilterData.filters.findIndex(x=> x[zoneheaders[0]] ==zoneDataFeatureDest);
                featureValue = datamatrix[origIdx][destIdx] + datamatrix[destIdx][origIdx];
            }
            //possible that even if data for zone exists, could be missing this particular trip mode
            if (zoneDataFeatureOrigin != undefined && findDistrict !="") {
                if(currentDestDistrict !=null){
                    isZoneVisible = zoneDataFeatureOrigin == indexByName[findDistrict].uniqueid && zoneDataFeatureDest == indexByName[currentDestDistrict].uniqueid;
                } else {
                    isZoneVisible = zoneDataFeatureOrigin == indexByName[findDistrict].uniqueid;
                }

                if (zoneDataFeatureOrigin == undefined) {
                    throw ("Something is wrong. zoneDataFeature.QUANTITY is undefined. " + JSON.stringify(zoneDataFeatureOrigin));
                }
                color = fill(indexByName[findDistrict].index);
                featureGrpTotal = indexByName[findDistrict].grptotal;
            }
            //end if we have data for this trip mode
        }
        //end if we have data for this zone
        //the allowed options are described here: http://leafletjs.com/reference.html#path-options
          w.domain([0, featureGrpTotal]);
          op.domain([0, featureGrpTotal]);
        if(isZoneVisible){
            console.log(color);
        }
        var returnStyle = {};
        if(DESIRELINE_FILE_LOC!=""){
            var returnStyle = {
                //all SVG styles allowed
                // fillColor: color,

                weight: w(featureValue),
                color: color,
                strokeOpacity: op(featureValue),
                stroke: isZoneVisible ? true : false
            };
        } else {
            var returnStyle = {
                //all SVG styles allowed
                // fillColor: color,
                fillOpacity: isZoneVisible ? 0.7 : 0.0,
                weight: 1,
                color: color,
                strokeOpacity: 1,
                stroke: isZoneVisible ? true : false
            };
        }
        return (returnStyle);
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
        if (map != undefined) {
            return;
        }
        var tonerLayer = L.tileLayer('//stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}.png', { id:id + "-by-district-map.toner",
                updateWhenIdle: true,
                unloadInvisibleFiles: true,
                reuseTiles: true,
                opacity: 1.0
            });
        var Esri_WorldImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {id:id + "-by-district-map.aerial",
                attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            });


        map = L.map(id + "-by-district-map", {
            minZoom: 6,
            layers:[tonerLayer]
        }).setView(CENTER_LOC, 9);
        var baseMaps = {
            "Grayscale": tonerLayer,
            "Aerial": Esri_WorldImagery

        }
      controlLayer =   L.control.layers(baseMaps).addTo(map);
        //centered at Atlanta
        map.on('zoomend', function (type, target) {
            var zoomLevel = map.getZoom();
            var zoomScale = map.getZoomScale();
            console.log('zoomLevel: ', zoomLevel, ' zoomScale: ', zoomScale);
        });
        countiesSet = new Set();
        $.getJSON(dataLocation + ZONE_FILE_LOC, function (zoneTiles) {
            "use strict";
            //there should be at least as many zones as the number we have data for.

            var zoneData = zoneFilterData.filters.filter(function (el) {
                return el[zoneheaders[0]] <= zoneTiles.features.length;
            });


            if (zoneTiles.features.length < Object.keys(zoneData).length) {
                throw ("Something is wrong! zoneTiles.features.length(" + zoneTiles.features.length + ") < Object.keys(zoneData).length(" + Object.keys(zoneData).length + ").");
            }
            circleMarkers = [];
            //create circle markers for each zone centroid
            for (var i = 0; i < zoneTiles.features.length; i++) {
                var feature = zoneTiles.features[i];
                var zoneFiltered = zoneData.filter(function (d) {
                    return d.ID == feature.properties.id;
                });
                var featureZoneData = undefined;
                if (zoneFiltered.length > 0) {
                    featureZoneData = zoneFiltered[0];
                }


                if (featureZoneData == undefined) { //missing data for this zone
                } else {                    //WARNING: center coordinates seem to have lat and lng reversed!

                        var centroid = L.latLngBounds(feature.geometry.coordinates[0]).getCenter();
                        //REORDER lat and lng
                        var circleMarker = L.circleMarker(L.latLng(centroid.lng, centroid.lat), circleStyle);
                        circleMarker.zoneData = featureZoneData;
                        circleMarkers.push(circleMarker);

                    feature.zoneData = featureZoneData;
                }
            }
            circlesLayerGroup = L.layerGroup(circleMarkers);
            //http://leafletjs.com/reference.html#tilelayer

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

            //var stamenTileLayer = new L.StamenTileLayer("toner-lite"); //B&W stylized background map
            //map.addLayer(stamenTileLayer);

            var desireLineDataTiles;
             if(DESIRELINE_FILE_LOC!="") {
                 $.getJSON(dataLocation + DESIRELINE_FILE_LOC, function (desireLineTiles) {
                     "use strict";
                     var zoneData = zoneFilterData.filters.filter(function (el) {
                         return el[zoneheaders[0]] <= desireLineTiles.features.length;
                     });

                     for (var i = 0; i < desireLineTiles.features.length; i++) {
                         var feature = desireLineTiles.features[i];
                         var zoneFiltered = zoneData.filter(function (d) {
                             if (feature.geometry.type == "LineString") {
                                 return d.ID == feature.properties.o;
                             }
                             return d.ID == feature.properties.id;
                         });
                         var featureZoneData = undefined;
                         if (zoneFiltered.length > 0) {
                             featureZoneData = zoneFiltered[0];
                         }


                         if (featureZoneData == undefined) { //missing data for this zone
                         } else {
                             //WARNING: center coordinates seem to have lat and lng reversed!

                             feature.zoneData = featureZoneData;
                         }
                     }
                     desireLineDataLayer = L.geoJson(desireLineTiles, {
                         updateWhenIdle: true,
                         unloadInvisibleFiles: true,
                         reuseTiles: true,
                         opacity: 1.0,
                         style: styleDesireLineGeoJSONLayer
                     });
                 }).complete(function(){
                      controlLayer.addOverlay(desireLineDataLayer,"Desire Lines");
                 });
             }

            if (scenarioPolyFile != undefined) {
                $.getJSON(dataLocation + abmviz_utilities.GetURLParameter("scenario") + "/" + scenarioPolyFile, function (scenarioTiles) {
                    "use strict";
                    focusLayer = L.geoJSON(scenarioTiles, {
                        style: styleFocusGeoJSONLayer
                    });

                }).complete(function(d){
                    controlLayer.addOverlay(focusLayer,"Focus");
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

               /* if (destZoneDataLayer != null) {
                    destZoneDataLayer.addTo(map);
                }
                else if(destZoneDataLayer != undefined) {
                    map.removeLayer(destZoneDataLayer);
                }
                if(showDesireLines){
                    desireLineDataLayer.addTo(map);
                } else {
                    zoneDataLayer.addTo(map);
                }*/
                countyLayer.addTo(map);
            }).success(function () {
                console.log(COUNTY_FILE + " second success");
            }).error(function (jqXHR, textStatus, errorThrown) {
                console.log(COUNTY_FILE + " textStatus " + textStatus);
                console.log(COUNTY_FILE + " errorThrown" + errorThrown);
                console.log(COUNTY_FILE + " responseText (incoming?)" + jqXHR.responseText);
            }).complete(function () {
                console.log(COUNTY_FILE + " complete");
                controlLayer.addOverlay(countyLayer,"Counties");
            });
            if (!SCENARIO_FOCUS) {
                $('#' + id + '-chart-map').css("margin-top", $('#' + id + '-dropdown-div').height() / 2 + "px");
            }
            if(DESIRELINE_FILE_LOC){
                $('#' + id + '-chart-map').css("margin-top", $('#' + id + '-chckboxes').height() / 2 + "px");

            }
            //end geoJson of county layer
            function onEachCounty(feature, layer) {
                layer.on({
                    mouseover: mouseoverCounty
                });
            }

            //end on each County
            function mouseoverCounty(e) {
                var layer = e.target;
                changeCurrentCounty(layer.feature.properties.NAME);
            }
        }).complete(function(){
            zoneDataLayer.addTo(map);
             controlLayer.addOverlay(zoneDataLayer,"Zones");
        });
         function getDesireLineLayer(){

         }
        //end geoJson of zone layer
        callback();
    }; //end createMap
    //createChord();
    window.addEventListener("resize", function () {
        console.log("Got resize event. Calling createTimeUse");
        createChord();
    });
} }; //end encapsulating IIFE