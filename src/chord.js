//encapsulate all code within a IIFE (Immediately-invoked-function-expression) to avoid polluting global namespace
//global object chord will contain functions and variables that must be accessible from elsewhere

var chord = (function() {
    "use strict";
    var url = "../data/" + abmviz_utilities.GetURLParameter("region") + "/" + abmviz_utilities.GetURLParameter("scenario") + "/ChordData.csv";
    var mainGroupColumnName;
    var subGroupColumnName;
    var quantityColumn;
    var countiesSet;
    var width = 720,
        height = 720;
    var outerRadius = width / 2,
        innerRadius = outerRadius - 130;
    var json = null;
    var originalNodeData;
    var naColor = "White";
    var CSS_UPDATE_PAUSE = 150;
    var currentDistrict = "";
    var currentDestDistrict = "";
    var colors = {}; //will be filled in to map keys to colors
    var map;
    var zonefilters = {};
    var zonefilterlabel = "";
    var ZONE_FILTER_LOC = "";
    var zoneFilterData;
    var zonefiles;
    var zoneheaders = [];
    var circleStyle = {
        "stroke": false,
        "fillColor": "set by updateBubbles",
        "fillOpacity": 1.0
    };
    var indexByName = {};
    var nameByIndex = {};
    var zoneData;
    var circleMarkers;
//config file options
    var COUNTY_FILE = "";
    var ZONE_FILE_LOC = "";
    var CENTER_LOC = [];
    var labelSize = 10;
    var showCycleTools = true;
    var zoneDataLayer;
    var destZoneDataLayer;
    var countyLayer;
    var fill = d3.scale.category20();
    var showChartOnPage = abmviz_utilities.GetURLParameter("visuals").indexOf('c') > -1;
    var circlesLayerGroup;
    var formatPercent = d3.format(".1%");
    var showGrpPercent = false;
    var showWholePercent = true;
    var wholeDataTotal = 0;
    function getConfigSettings(callback) {
        if (showChartOnPage) {
            $.getJSON("../data/" + abmviz_utilities.GetURLParameter("region") + "/" + "region.json", function (data) {
                $.each(data, function (key, val) {
                    if (key == "CountyFile")
                        COUNTY_FILE = val;
                    if (key == "ZoneFile")
                        ZONE_FILE_LOC = val;
                    if (key == "CenterMap")
                        CENTER_LOC = val;
                    if (key == "Chord") {

                        $.each(val, function (opt, value) {
                            if (opt == "ZoneFilterFile") {
                                ZONE_FILTER_LOC = value;
                            }
                            if (opt == "LabelSize") {
                                labelSize = value;
                            }
                        })
                    }
                });
                callback();
            });
            ZONE_FILTER_LOC = ZONE_FILTER_LOC;
            $("#chord-grouppercent").off().click(function () {
			showGrpPercent = !showGrpPercent;
			createChord();
		});
		$("#chord-wholepercent").off().click(function () {
			showWholePercent = !showWholePercent;
			createChord();
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
        var datamatrix = [];
        //read in data and create chord when finished

        d3.csv(url, function (error, data) {
            "use strict";
            var headers = d3.keys(data[0]);
            //var csv = d3.csv.parseRows(data).slice(1);
            //var headers = d3.keys(data[0]);
            var quantities = headers.slice(2);
            if ($('#chord-data-select option').length == 0) {
                quantities.forEach(function (e) {
                    $('#chord-data-select').append($("<option></option>").attr("value", e).text(e));
                });
                $('.chord-chart-maingroup').text($('#chord-data-select').val());
            }

            $('#chord-data-select').on('change', function (d) {
                $('.chord-chart-maingroup').text($('#chord-data-select').val());
                createChord();
            });
            mainGroupColumnName = headers[0];
            subGroupColumnName = headers[1];
            quantityColumn = $('#chord-data-select').val();

            indexByName = {};
            nameByIndex = {};
            var outerRadius = width / 2,
                innerRadius = outerRadius - 130;


            var r1 = height / 2, r0 = r1 - 110;
            var chord = d3.layout.chord()
                .padding(.02)
                .sortSubgroups(d3.descending)
                .sortChords(d3.descending);

            var arc = d3.svg.arc()
                .innerRadius(innerRadius)
                .outerRadius(innerRadius + 20);
            var windwidth = $('#chord-chart-container').width();
            d3.select('#chord-chart-container').select("svg").remove();
            var svg = d3.select("#chord-chart-container").append("svg:svg")
                .attr("width", windwidth - 20)
                .attr("height", height)
                .style("padding-left", "3%")
                .style("padding-right", "5%")
                .append("svg:g")
                .attr("id", "circle")
                .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
            svg.append("circle")
                .attr("r", r0 + 20);
            var n = 0;
            wholeDataTotal = 0;
            data.forEach(function (d) {
                if (!(d[mainGroupColumnName] in indexByName)) {
                    nameByIndex[n] = {
                        name: d[mainGroupColumnName],
                        col: d[mainGroupColumnName],
                        index: n,
                        grptotal: Number.parseFloat(d[quantityColumn])
                    };

                    indexByName[d[mainGroupColumnName]] = {
                        index: n++,
                        name: d[mainGroupColumnName],
                        grptotal: Number.parseFloat(d[quantityColumn])
                    };

                } else {
                    indexByName[d[mainGroupColumnName]].grptotal += Number.parseFloat(d[quantityColumn]);
                    nameByIndex[indexByName[d[mainGroupColumnName]].index].grptotal += Number.parseFloat(d[quantityColumn]);
                }
                wholeDataTotal += Number.parseFloat(d[quantityColumn]);
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
                var value = d[quantityColumn];

                datamatrix[indexByName[mainGrp].index][indexByName[subGrp].index] = (Number.parseFloat(value));
            });
            var matrixmap = chordMpr(data);
            matrixmap.addValuesToMap("FROM")
                .setFilter(function (row, a, b) {
                    return (row.FROM === a.name && row.TO === b.name)
                }).setAccessor(function (recs, a, b) {
                if (!recs[0]) return 0;
                return +recs[0].count;
            });

            var rdr = chordRdr(matrixmap.getMatrix(), matrixmap.getMap());
            chord.matrix(datamatrix);

            var g = svg.selectAll("g.group")
                .data(chord.groups())
                .enter().append("g")
                .attr("class", "group")
                .on("mouseover", mouseover)
                .on("mouseout", function (d) {
                    d3.select('#chord-tooltip').style("visibility", "hidden")
                });

         var groupPath =   g.append("path")
                .style("fill", function (d) {
                    return fill(d.index);
                })
                .style("stroke", function (d) {
                    return fill(d.index);
                })
                .attr("d", arc);

         var groupText=   g.append("text")
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
  groupText.filter(function(d, i) {
      var check= groupPath[0][i];
      console.log("Group name:" + groupPath[0][i].nextSibling.innerHTML + " length:" + indexByName[groupPath[0][i].nextSibling.innerHTML].grptotal );
      return (indexByName[groupPath[0][i].nextSibling.innerHTML].grptotal / wholeDataTotal *100) < 1.5 })
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
                    d3.select("#chord-tooltip")
                        .style("visibility", "visible")
                        .html(chordTip(rdr(d)))
                        .style("top", function () {
                            return (d3.event.pageY - 100) + "px"
                        })
                        .style("left", function () {
                            if (d3.event.pageX + 100 > 500) {
                                return 500 + "px";
                            }
                            return (d3.event.pageX + 100) + "px";
                        })

                })
                .on("mouseout", function (d) {
                    d3.select("#chord-tooltip").style("visibility", "hidden")
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
                d3.select("#chord-tooltip")
                    .style("visibility", "visible")
                    .html(groupTip(rdr(d)))
                    .style("top", function () {
                        return (d3.event.pageY - 80) + "px"
                    })
                    .style("left", function () {
                        if ((d3.event.pageX - 50) > 0 || (d3.event.pageX - 50) > 600) {
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
        });   //end d3.csv

    }

    function readInFilterData(callback) {
        if (ZONE_FILTER_LOC != '') {
            var zonecsv;
            try {
                d3.csv("../data/" + abmviz_utilities.GetURLParameter("region") + "/" + abmviz_utilities.GetURLParameter("scenario") + "/" + ZONE_FILTER_LOC, function (error, filterdata) {
                    //zonecsv = d3.csv.parseRows(filterdata).slice(1);
                    zoneheaders = d3.keys(filterdata[0]);
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

    function changeCurrentDistrict(newCurrentDistrict,destinationDistrict) {
        if (currentDistrict != newCurrentDistrict) {
            console.log('changing from ' + currentDistrict + " to " + newCurrentDistrict);
            currentDistrict = newCurrentDistrict;
            if(destinationDistrict!=null) {
                currentDestDistrict = destinationDistrict;
            }
            else {
                currentDestDistrict = null;
            }

            setTimeout(redrawMap, CSS_UPDATE_PAUSE);
        }
        else {
            if(destinationDistrict != currentDestDistrict){
                currentDestDistrict = destinationDistrict;
            }
            setTimeout(redrawMap, CSS_UPDATE_PAUSE);
        }

    }

    function redrawMap() {
        "use strict";
        zoneDataLayer.setStyle(styleZoneGeoJSONLayer);
        destZoneDataLayer.setStyle(styleDestZoneGeoJSONLayer);
    }

    function createMap(callback) {
        //var latlngcenter = JSON.parse(CENTER_LOC);
        //var lat=latlngcenter[0];
        //var lng=latlngcenter[1];
        map = L.map("chord-by-district-map", {
            minZoom: 7
        }).setView(CENTER_LOC, 12);
        //centered at Atlanta
        map.on('zoomend', function (type, target) {
            var zoomLevel = map.getZoom();
            var zoomScale = map.getZoomScale();
            console.log('zoomLevel: ', zoomLevel, ' zoomScale: ', zoomScale);
        });
        countiesSet = new Set();


        $.getJSON("../data/" + abmviz_utilities.GetURLParameter("region") + "/" + ZONE_FILE_LOC, function (zoneTiles) {
            "use strict";
            //there should be at least as many zones as the number we have data for.

            var zoneData = zoneFilterData.filters.filter(function(el){ return el.ID <= zoneTiles.features.length;});


            if (zoneTiles.features.length < Object.keys(zoneData).length) {
                throw ("Something is wrong! zoneTiles.features.length(" + zoneTiles.features.length + ") < Object.keys(zoneData).length(" + Object.keys(zoneData).length + ").");
            }
            circleMarkers = [];
            //create circle markers for each zone centroid
            for (var i = 0; i < zoneTiles.features.length; i++) {
                var feature = zoneTiles.features[i];
                var zoneFiltered = zoneData.filter(function(d){ return d.ID == feature.properties.id;  });
                var featureZoneData = undefined;
                if(zoneFiltered.length > 0){
                    featureZoneData = zoneFiltered[0];
                }


                if (featureZoneData == undefined) { //missing data for this zone
                } else {
                    //WARNING: center coordinates seem to have lat and lng reversed!
                    var centroid = L.latLngBounds(feature.geometry.coordinates[0]).getCenter();
                    //REORDER lat and lng
                    var circleMarker = L.circleMarker(L.latLng(centroid.lng, centroid.lat), circleStyle);
                    circleMarker.zoneData = featureZoneData;
                    feature.zoneData = featureZoneData;
                    circleMarkers.push(circleMarker);
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
            if(currentDestDistrict != null) {
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
            var underlyingMapLayer = L.tileLayer('//stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}.png', {
                updateWhenIdle: true,
                unloadInvisibleFiles: true,
                reuseTiles: true,
                opacity: 1.0
            });
            underlyingMapLayer.addTo(map);
            $.getJSON("../data/" + abmviz_utilities.GetURLParameter("region") + "/" + COUNTY_FILE, function (countyTiles) {
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
                map.fitBounds(allCountyBounds);
                map.setMaxBounds(allCountyBounds);
                if(destZoneDataLayer !=null){
                    destZoneDataLayer.addTo(map);
                }
                else {
                    map.removeLayer(destZoneDataLayer);
                }
                zoneDataLayer.addTo(map);
                countyLayer.addTo(map);
            }).success(function () {
                console.log(COUNTY_FILE + " second success");
            }).error(function (jqXHR, textStatus, errorThrown) {
                console.log(COUNTY_FILE + " textStatus " + textStatus);
                console.log(COUNTY_FILE + " errorThrown" + errorThrown);
                console.log(COUNTY_FILE + " responseText (incoming?)" + jqXHR.responseText);
            }).complete(function () {
                console.log(COUNTY_FILE + " complete");
            });

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
        });
        //end geoJson of zone layer
        callback();
    }; //end createMap
    //createChord();
}()); //end encapsulating IIFE