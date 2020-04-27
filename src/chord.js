//encapsulate all code within a IIFE (Immediately-invoked-function-expression) to avoid polluting global namespace
//global object chord will contain functions and variables that must be accessible from elsewhere
var ChordChart = {
  chord: function chord(id, indx) {
    "use strict";
    var region = abmviz_utilities.GetURLParameter("region");
    var dataLocation = localStorage.getItem(region);
    var fileName = "ChordData.csv";
    var url = dataLocation + abmviz_utilities.GetURLParameter("scenario");
    var scenario = abmviz_utilities.GetURLParameter("scenario");
    var mainGroupColumnName;
    var subGroupColumnName;
    var csvData;
    var quantityColumn;
    var countiesSet;
    var zoneFilterNameCol;
    var maxLabelLength = 0;
    var json = null;
    var palette = [
      [
        "rgb(0, 0, 0)",
        "rgb(67, 67, 67)",
        "rgb(102, 102, 102)",
        "rgb(204, 204, 204)",
        "rgb(217, 217, 217)",
        "rgb(255, 255, 255)"
      ],
      [
        "rgb(152, 0, 0)",
        "rgb(255, 0, 0)",
        "rgb(255, 153, 0)",
        "rgb(255, 255, 0)",
        "rgb(0, 255, 0)",
        "rgb(0, 255, 255)",
        "rgb(74, 134, 232)",
        "rgb(0, 0, 255)",
        "rgb(153, 0, 255)",
        "rgb(255, 0, 255)"
      ],
      [
        "rgb(230, 184, 175)",
        "rgb(244, 204, 204)",
        "rgb(252, 229, 205)",
        "rgb(255, 242, 204)",
        "rgb(217, 234, 211)",
        "rgb(208, 224, 227)",
        "rgb(201, 218, 248)",
        "rgb(207, 226, 243)",
        "rgb(217, 210, 233)",
        "rgb(234, 209, 220)",
        "rgb(221, 126, 107)",
        "rgb(234, 153, 153)",
        "rgb(249, 203, 156)",
        "rgb(255, 229, 153)",
        "rgb(182, 215, 168)",
        "rgb(162, 196, 201)",
        "rgb(164, 194, 244)",
        "rgb(159, 197, 232)",
        "rgb(180, 167, 214)",
        "rgb(213, 166, 189)",
        "rgb(204, 65, 37)",
        "rgb(224, 102, 102)",
        "rgb(246, 178, 107)",
        "rgb(255, 217, 102)",
        "rgb(147, 196, 125)",
        "rgb(118, 165, 175)",
        "rgb(109, 158, 235)",
        "rgb(111, 168, 220)",
        "rgb(142, 124, 195)",
        "rgb(194, 123, 160)",
        "rgb(166, 28, 0)",
        "rgb(204, 0, 0)",
        "rgb(230, 145, 56)",
        "rgb(241, 194, 50)",
        "rgb(106, 168, 79)",
        "rgb(69, 129, 142)",
        "rgb(60, 120, 216)",
        "rgb(61, 133, 198)",
        "rgb(103, 78, 167)",
        "rgb(166, 77, 121)",
        "rgb(91, 15, 0)",
        "rgb(102, 0, 0)",
        "rgb(120, 63, 4)",
        "rgb(127, 96, 0)",
        "rgb(39, 78, 19)",
        "rgb(12, 52, 61)",
        "rgb(28, 69, 135)",
        "rgb(7, 55, 99)",
        "rgb(32, 18, 77)",
        "rgb(76, 17, 48)"
      ]
    ];
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
      stroke: false,
      fillColor: "set by updateBubbles",
      fillOpacity: 1.0
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
    var chartOnPage = $("#" + id + "_circle").length == 0;
    var chordTabSelector = "#" + id + "_id";
    var pageTitle = $(chordTabSelector + ' #page-title')
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
    var chartContainerSelector = "#" + id + "-chart-container";

    function getConfigSettings(callback) {
      if (chartOnPage) {
        $.getJSON(dataLocation + "region.json", function(data) {
          var configName = "Default";
          if (data["scenarios"][scenario].visualizations != undefined) {
            if (
              data["scenarios"][scenario].visualizations["Chord"][indx].file
            ) {
              fileName =
                data["scenarios"][scenario].visualizations["Chord"][indx].file;
            }
            var infoBox;
            if (
              data["scenarios"][scenario].visualizations["Chord"][indx].info
            ) {
              infoBox =
                data["scenarios"][scenario].visualizations["Chord"][indx].info;
              $("#" + id + "-div span.glyphicon-info-sign").attr(
                "title",
                infoBox
              );
              $("#" + id + '-div [data-toggle="tooltip"]').tooltip();
            }
            if (
              data["scenarios"][scenario].visualizations["Chord"][indx].config
            ) {
              configName =
                data["scenarios"][scenario].visualizations["Chord"][indx]
                  .config;
            }

            if (
              data["scenarios"][scenario].visualizations["Chord"][indx]
                .datafilecolumns
            ) {
              var datacols =
                data["scenarios"][scenario].visualizations["Chord"][indx]
                  .datafilecolumns;
              $.each(datacols, function(key, value) {
                $("#" + id + "-datatable-columns").append(
                  "<p>" + key + ": " + value + "</p>"
                );
              });
            }

            var chordTitle =
              data["scenarios"][scenario].visualizations["Chord"][indx].title;
            if (chordTitle) {
              pageTitle.html(chordTitle);
            }
          }
          url += "/" + fileName;

          //GO THROUGH region level configuration settings
          $.each(data, function(key, val) {
            if (key == "CountyFile") COUNTY_FILE = val;
            if (key == "ZoneFile") ZONE_FILE_LOC = val;
            if (key == "CenterMap" && CENTER_LOC.length == 0) CENTER_LOC = val;
            if (key == "DefaultFocusColor") focusColor = val;
          });

          if (
            data["scenarios"] != undefined &&
            data["scenarios"][scenario] != undefined
          ) {
            if (data["scenarios"][scenario]["CenterMap"] != undefined) {
              CENTER_LOC = data["scenarios"][scenario]["CenterMap"];
            }
            if (data["scenarios"][scenario]["ScenarioFocus"] != undefined) {
              SCENARIO_FOCUS = true;
              scenarioPolyFile = data["scenarios"][scenario]["ScenarioFocus"];
              $("#" + id + "-by-district-map").before(
                " <span class=\"control-label\">Focus Color</span> <input type='text' id='" +
                  id +
                  "-focus-color' style='display: none;' >  "
              );
            }
          }
          var configSettings = data["Chord"][configName];

          if (configSettings != undefined) {
            $.each(configSettings, function(opt, value) {
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
        }).complete(function() {
          callback();
          ZONE_FILTER_LOC = ZONE_FILTER_LOC;
          $("#chord-grouppercent")
            .off()
            .click(function() {
              showGrpPercent = !showGrpPercent;
              goThroughChordData();
            });
          $("#chord-wholepercent")
            .off()
            .click(function() {
              showWholePercent = !showWholePercent;
              goThroughChordData();
            });
        });
      } else {
        return;
      }
    }

    getConfigSettings(function() {
      readInData(function() {});
    });

    function readInData(callback) {
      readInFilterData(function() {
        createMap(function() {
          goThroughChordData();
        });
      });
    }

    function goThroughChordData() {
      $("#" + id + "-chart-container svg").remove();
      $("#" + id + "-chart-container div").remove();
      chartData = [];
      datamatrix = [];
      //read in data and create chord when finished
      wholeDataTotal = 0;

      if (csvData) {
        getAndProcessCsvData(null, csvData);
        return;
      }

      d3.csv(url, getAndProcessCsvData);
      function getAndProcessCsvData(error, data) {
        "use strict";
        if (error) {
          $("#chord").html(
            "<div class='container'><h3><span class='alert alert-danger'>Error: An error occurred while loading the chord data.</span></h3></div>"
          );
          throw error;
        }
        var headers = d3.keys(data[0]);
        var columnsDT = [];
        if (!$.fn.DataTable.isDataTable("#" + id + "-datatable-table")) {
          $.each(headers, function(d, i) {
            columnsDT.push({ data: i });
            $("#" + id + "-datatable-div table thead tr").append(
              "<th>" + i + "</th>"
            );
          });

          $("#" + id + "-datatable-table").DataTable({
            dom: "Bfrtip",
            buttons: {
              dom: {
                button: {
                  tag: "button",
                  className: ""
                }
              },

              buttons: [
                {
                  extend: "csv",
                  className: "btn",
                  text: '<span class="glyphicon glyphicon-save"></span>',
                  titleAttr: "Download CSV"
                }
              ]
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
          $("#chord").html(
            "<div class='container'><h3><span class='alert alert-danger'>Error: An error occurred while loading the chord data.</span></h3></div>"
          );
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
        data.forEach(function(d) {
          if (!(d[mainGroupColumnName] in indexByName)) {
            nameByIndex[n] = {
              name: d[mainGroupColumnName],
              col: d[mainGroupColumnName],
              index: n
              // grptotal: excludeSameOD && d[mainGroupColumnName] == d[subGroupColumnName] ? 0 : Number.parseFloat(total),
              //  chartvalues:{}
            };

            indexByName[d[mainGroupColumnName]] = {
              index: n++,
              name: d[mainGroupColumnName]
              // grptotal: excludeSameOD && d[mainGroupColumnName] == d[subGroupColumnName] ? 0 : Number.parseFloat(total),
              // chartvalues:{}
            };
          }

          //end else
        }); //end data foreach
        //create our chart objects
        var chartDataObject = {};
        let chartidx = 0;
        $.each(legendHeadersShowHide, function(header, val) {
          if (val) {
            datamatrix = [];
            //initialize matrix
            for (var i = 0; i < _.size(indexByName); i++) {
              datamatrix[i] = [];
              //datamatrix2[i] = [];
              for (var j = 0; j < _.size(indexByName); j++) {
                datamatrix[i][j] = 0;
                //datamatrix2[i][j] = 0;
              } //end for
            } //end for
            chartDataObject = {};
            matrixmap = undefined;
            matrixmap = chordMpr(data);
            matrixmap
              .addValuesToMap(mainGroupColumnName)
              .setFilter(function(row, a, b) {
                return (
                  row[mainGroupColumnName] === a.name &&
                  row[subGroupColumnName] === b.name
                );
              })
              .setAccessor(function(recs, a, b) {
                if (!recs[0]) return 0;
                return recs[0][header];
              });
            let rdr = chordRdr(matrixmap.getMatrix(), matrixmap.getMap());
            chartDataObject = {
              chartId: id + "_" + "chordchart" + chartidx++,
              chartName: header,
              dataMatrix: datamatrix,
              dataRdr: rdr,
              chartTotal: 0
            };
            chartData.push(chartDataObject);
          }
        });

        //fill up our chart data matrices
        $.each(legendHeadersShowHide, function(header, val) {
          if (val) {
            var indx = chartData.findIndex(x => x.chartName == header);

            data.forEach(function(d) {
              if (
                excludeSameOD &&
                d[mainGroupColumnName] == d[subGroupColumnName]
              ) {
                //do nothing we don't want to use the same O/D data points if it's disabled.
              } else {
                var mainGrp = d[mainGroupColumnName];
                var subGrp = d[subGroupColumnName];
                chartData[indx].chartTotal += +d[header];
                chartData[indx].dataMatrix[indexByName[mainGrp].index][
                  indexByName[subGrp].index
                ] = +d[header];
              }
            });
          }
        });

        $(".chord-chart-maingroup").text(legendText);
        var size = _.size(legendHeadersShowHide);
        if (showLegendHead && size > 1) {
          $("#" + id + "-dropdown-div").html("");

          var legendWidth = $("#" + id + "-chart-container").width();
          var columns = Math.floor(legendWidth / 165);
          var lines = Number.parseInt(Math.ceil(size / columns));
          var legheight = 30 * lines;
          var container = d3
            .select("#" + id + "-dropdown-div")
            .append("svg")
            .attr("width", legendWidth)
            .attr("height", legheight)
            .style("padding-top", "10px");
          if (!SCENARIO_FOCUS) {
            $("#" + id + "-chart-map").css(
              "margin-top",
              $("#" + id + "-dropdown-div").height() / 2 + "px"
            );
          }
          var dataL = 0;
          var offset = 100;
          var prevLegendLength = 0;
          var xOff, yOff;

          var legendOrdinal = container
            .selectAll(".chordLegend")
            .data(legendHead)
            .enter()
            .append("g")
            .attr("class", "chordLegend")
            .attr("transform", function(d, i) {
              var calcX = (i % legendRows) * (legendWidth / columns);
              xOff = (i % legendRows) * 185;
              yOff = Math.floor(i / legendRows) * 20;
              // if (prevLegendLength != 0) {
              //   xOff = xOff + (prevLegendLength - 9);
              // }
              prevLegendLength = d.length;
              return "translate(" + xOff + "," + yOff + ")";
            });

          var circles = legendOrdinal
            .append("circle")
            .attr("cx", 10)
            .attr("cy", 7)
            .attr("r", 5)
            .style("stroke", "black")
            .style("fill", function(d, i) {
              return legendHeadersShowHide[d] ? "black" : "white";
            });

          var texts = legendOrdinal
            .append("text")
            .attr("x", 20)
            .attr("y", 12)
            .text(function(d, i) {
              return d;
            })
            .attr("class", "textselected")
            .style("text-anchor", "start")
            .style("font-size", 15);

          circles.on("click", function(d) {
            showHideBlobs(d);
          });
          texts.on("click", function(d) {
            showHideBlobs(d);
          });
        }

        csvData = data;
        $.each(chartData, function(indx, chart) {
          CreateChord(id, data, chart);
        });
      }
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
        change: function(color) {
          focusColor = color;
          redrawMap();
        }
      });
    }

    function CreateChord(id, data, chart, maxTextHeightOrWidth = 0) {
      var MINIMUM_RADIUS = 35;
      // clean up any existing elements
      if ($("#" + chart.chartId + "_svg").length > 0)
        $("#" + chart.chartId + "_svg").remove();

      if ($("#" + chart.chartId + "-tooltip").length > 0)
        $("#" + chart.chartId + "-tooltip").remove();

      var chartContainer = $(chartContainerSelector);
      var chartContainerSelection = d3.select(chartContainerSelector);
      var chartTooltipId = chart.chartId + "-tooltip";
      var chartTooltipSelector = "#" + chartTooltipId;
      var widthPerChart = chartContainer.width() / numberChordPerRow - 10;
      var height = chartContainer.height();
      var r0 = height / 4;
      var halfOfChart = widthPerChart / 2;

      // radius of entire chord diagram
      var outerRadius = maxTextHeightOrWidth
        ? (widthPerChart - 2 * maxTextHeightOrWidth) / 2
        : widthPerChart / 2 - 55;

      // The smallest it's going to get should be 30.
      // Otherwise the chord diagrams filp in on themselves.
      outerRadius = Math.max(outerRadius, MINIMUM_RADIUS);

      // radius of inner circle, on which chords will be drawn
      var innerRadius = outerRadius - 10;

      chartContainer.css("min-height", widthPerChart);
      height = chartContainer.height();
      var chord = d3.layout.chord().padding(0.02);
      chord.matrix(chart.dataMatrix);

      var arc = d3.svg
        .arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius);

      var chartTooltip = d3
        .select(chordTabSelector)
        .append("div")
        .attr("id", chartTooltipId)
        .attr("class", "chord-tooltip")
        .attr("chartidx", chartData.indexOf(chart));

      var svg = d3
        .select(chartContainerSelector)
        .append("svg:svg")
        .attr("width", widthPerChart)
        .attr("height", height)
        .attr("chartIdx", chartData.indexOf(chart))
        .attr("id", chart.chartId + "_svg");

      var circle = svg
        .append("svg:g")
        .attr("id", chart.chartId + "_circle")
        .attr("selector", "chordcircle")
        .attr("transform", "translate(" + halfOfChart + "," + height / 2 + ")");

      circle.append("circle").attr("r", r0);

      // Add Chord Diagram Titles for side-by-side layout
      if (sidebyside) {
        var titleFontSize = "19";
        var chartTitle = svg
          .append("text")
          .text(chart.chartName)
          .style("font-size", titleFontSize)
          .style("font-weight", "bold")
          .style("text-align", "center");

        var titleWidth = maxHeightOrWidth(chartTitle);
        var offsetToCenterTitle = widthPerChart / 2 - titleWidth / 2;
        chartTitle.attr(
          "transform",
          "translate(" + offsetToCenterTitle + "," + titleFontSize + ")"
        );

        createToolTipTable(chart, chartData.indexOf(chart));
      }

      function getOdSum(chartDataMartix, index) {}

      var chordGroups = circle
        .selectAll("#" + chart.chartId + "_circle g.group")
        .data(chord.groups())
        .enter()
        .append("g")
        .attr("class", "group")
        .on("mouseover", function(d, i) {
          // pointer position relative to the SVG
          var mousePosition = d3.mouse(
            d3.select(chartTooltipSelector)[0][0].parentNode
          );

          if (nameByIndex != undefined) {
            changeCurrentDistrict(nameByIndex[i].col);
          }

          var allChordPaths = d3.selectAll(
            "#" + id + "-chart-container .chord"
          );

          $('g[selector="chordcircle"]').toggleClass("hover");

          d3.select(chartTooltipSelector)
            .style("visibility", function(d, i) {
              var chartIdx = $(this).attr("chartIdx");
              var eventTarget = d3.event.currentTarget.ownerSVGElement.getAttribute(
                "chartIdx"
              );
              if (eventTarget == chartIdx) {
                return "visible";
              }
            })
            .html(function(idx) {
              let chartIdx = $(this).attr("chartIdx");
              let eventTarget = d3.event.currentTarget.ownerSVGElement.getAttribute(
                "chartIdx"
              );
              var destinationsArray =
                chartData[$(this).attr("chartIdx")].dataMatrix[i];
              var sum = d3.sum(destinationsArray);
              if (sidebyside) {
                for (var chartDataObject of chartData) {
                  var destArrayInOtherChart = chartDataObject.dataMatrix[i];
                  var sumForOtherTable = d3.sum(destArrayInOtherChart);
                  addGroupToolTipTable(chartDataObject, d, sumForOtherTable);
                }
              }
              if (eventTarget == chartIdx) {
                return groupTip(
                  chartData[$(this).attr("chartIdx")].dataRdr(d),
                  sum,
                  chartData[$(this).attr("chartIdx")].chartTotal
                );
              } else {
                return "";
              }
            })
            .style("left", mousePosition[0])
            .style("top", mousePosition[1] + 10);

          allChordPaths.classed("faded", function(p) {
            return p.source.index != i && p.target.index != i;
          });
        })
        .on("mouseout", function(d) {
          d3.select(chartTooltipSelector).style("visibility", "hidden");
          $('g[selector="chordcircle"]').toggleClass("hover");
        });

      var groupPath = chordGroups
        .append("path")
        .style("fill", function(d) {
          return fill(d.index);
        })
        .style("stroke", function(d) {
          return fill(d.index);
        })
        .attr("d", arc);

      var groupText = chordGroups
        .append("text")
        .each(function(d) {
          d.angle = (d.startAngle + d.endAngle) / 2;
        })
        .attr("dy", ".35em")
        .style("text-anchor", function(d) {
          return d.angle > Math.PI ? "end" : null;
        })
        .style("font-size", labelSize + "px")
        .text(function(d) {
          return nameByIndex[d.index].name;
        });

      groupText.filter(labelsThatDontFit).remove();

      if (!maxTextHeightOrWidth) {
        maxTextHeightOrWidth = maxHeightOrWidth(groupText);
        // Still need to check, since this could be zero, which results in infinite recursion
        if (maxTextHeightOrWidth) {
          if (sidebyside) maxTextHeightOrWidth += 19; // for title offset
          CreateChord(id, data, chart, maxTextHeightOrWidth);
        }
      }

      groupText.attr("transform", rotateLabels);

      function rotateLabels(d) {
        return (
          "rotate(" +
          ((d.angle * 180) / Math.PI - 90) +
          ")" +
          "translate(" +
          (outerRadius + 2) +
          ")" +
          (d.angle > Math.PI ? "rotate(180)" : "")
        );
      }

      function labelsThatDontFit(d, i) {
        let idx = indexByName[groupPath[0][i].nextSibling.innerHTML].index;
        let sum = chart.dataMatrix[idx].reduce(function(acc, val) {
          return acc + val;
        }, 0);
        // sum of origins and destinations is less than 1.5% of matrix total
        return (sum / chart.chartTotal) * 100 < 1.5;
      }

      var chordPaths = circle
        .selectAll("#" + chart.chartId + "_circle .chord")
        .data(chord.chords)
        .enter()
        .append("svg:path")
        .attr("class", "chord")
        .style("stroke", function(d) {
          return d3.rgb(fill(d.source.index)).darker();
        })
        .style("fill", function(d) {
          return fill(d.source.index);
        })
        .attr("d", d3.svg.chord().radius(innerRadius))
        .on("mouseover", function(d, i) {
          var mousePosition = d3.mouse(
            d3.select(chartTooltipSelector)[0][0].parentNode
          );

          d3.select(chartTooltipSelector)
            .style("visibility", function() {
              var chartIdx = $(this).attr("chartIdx");
              var eventTarget = d3.event.currentTarget.ownerSVGElement.getAttribute(
                "chartIdx"
              );
              if (eventTarget == chartIdx) {
                return "visible";
              }
            })
            .html(function() {
              var chartIdx = $(this).attr("chartIdx");
              var chartDataForThisChart = chartData[chartIdx];
              var chartDataMatrix = chartDataForThisChart.dataMatrix;
              var sourceVal = chartDataMatrix[d.source.index][d.target.index];

              var targetVal =
                chartData[$(this).attr("chartIdx")].dataMatrix[d.target.index][
                  d.source.index
                ];

              let chart = chartData[$(this).attr("chartIdx")];
              if (sidebyside) {
                // Update tooltip tables for all charts on hover
                for (var chartDataObject of chartData) {
                  var chartDataMatrixForOtherChart = chartDataObject.dataMatrix;
                  var sourceValInOtherChart =
                    chartDataMatrixForOtherChart[d.source.index][
                      d.target.index
                    ];
                  var targetValInOtherChart =
                    chartDataMatrixForOtherChart[d.target.index][
                      d.source.index
                    ];
                  addPathToolTipTable(
                    sourceValInOtherChart,
                    targetValInOtherChart,
                    chart.dataRdr(d),
                    chartDataObject
                  );
                }
              }
              return chordTip(
                sourceVal,
                targetVal,
                chart.dataRdr(d),
                chart.chartTotal
              );
            })
            .style("top", mousePosition[1] + 10)
            .style("left", mousePosition[0]);

          $('g[selector="chordcircle"]').toggleClass("hover");
        })
        .on("mouseout", function(d) {
          $('g[selector="chordcircle"]').toggleClass("hover");
          d3.select(chartTooltipSelector).style("visibility", "hidden");
        });

      function chordTip(sourceVal, targetVal, d, chartTotal) {
        var otherdist = indexByName[d.sname];
        if (currentDistrict != d.tname) {
          changeCurrentDistrict(d.sname, d.tname);
        } else {
          changeCurrentDistrict(d.tname, d.sname);
        }
        var p = d3.format(".2%"),
          q = d3.format(",.0f");
        var sourcePct = sourceVal;
        var targetPct = targetVal;
        if (showWholePercent) {
          sourcePct = p(sourceVal / chartTotal);
          targetPct = p(targetVal / chartTotal);
          return (
            "" +
            indexByName[d.sname].name +
            " → " +
            indexByName[d.tname].name +
            ": " +
            q(sourceVal) +
            " (" +
            sourcePct +
            ")<br/>" +
            indexByName[d.tname].name +
            " → " +
            indexByName[d.sname].name +
            ": " +
            q(targetVal) +
            " (" +
            targetPct +
            ")<br/>"
          );
        } else {
          return (
            "" +
            indexByName[d.sname].name +
            " → " +
            indexByName[d.tname].name +
            ": " +
            sourceVal +
            "<br/>" +
            indexByName[d.tname].name +
            " → " +
            indexByName[d.sname].name +
            ": " +
            targetVal +
            "<br/>"
          );
        }
      }

      function addGroupToolTipTable(thisChart, d, sum) {
        var p = d3.format(".2%"),
          q = d3.format(",.0f");
        let chartId = thisChart.chartId;
        let dataStf = thisChart.dataRdr(d);
        $("#" + chartId + "_tooltiptable table tbody").html("");
        $("#" + chartId + "_tooltiptable table tbody").append(
          "<tr>" +
            "<td>" +
            indexByName[dataStf.gname].name +
            "</td>" +
            "<td>" +
            "Total" +
            "</td>" +
            "<td>" +
            q(sum) +
            " (" +
            p(sum / thisChart.chartTotal) +
            ")" +
            "</td>" +
            "</tr>"
        );
      }

      function addPathToolTipTable(sourceVal, destVal, dataObj, thisChart) {
        var formatPercent = d3.format(".2%"),
          formatFloat = d3.format(",.0f");
        let chartId = thisChart.chartId;
        $("#" + chartId + "_tooltiptable table tbody").html("");
        $("#" + chartId + "_tooltiptable table tbody").append(
          "<tr>" +
            "<td>" +
            indexByName[dataObj.sname].name +
            "</td>" +
            "<td>" +
            indexByName[dataObj.tname].name +
            "</td>" +
            "<td>" +
            formatFloat(sourceVal) +
            " (" +
            formatPercent(sourceVal / thisChart.chartTotal) +
            ")" +
            "</td>" +
            "</tr>"
        );
        $("#" + chartId + "_tooltiptable table tbody").append(
          "<tr>" +
            "<td>" +
            indexByName[dataObj.tname].name +
            "</td>" +
            "<td>" +
            indexByName[dataObj.sname].name +
            "</td>" +
            "<td>" +
            formatFloat(destVal) +
            " (" +
            formatPercent(destVal / thisChart.chartTotal) +
            ")" +
            "</td>" +
            "</tr>"
        );
      }

      function groupTip(d, total, chartTotal) {
        var p = d3.format(".2%"),
          q = d3.format(",.0f");
        var value = d.gvalue;
        if (showWholePercent) {
          return (
            "" +
            indexByName[d.gname].name +
            " : " +
            q(total) +
            " (" +
            p(total / chartTotal) +
            ") <br/>"
          );
        } else {
          return "" + indexByName[d.gname].name + " : " + q(total) + "<br/>";
        }
      }

      function createToolTipTable(chart, chartIdx) {
        if ($("#" + id + "-tooltiptablediv").length == 0) {
          $("#" + id + "-div").append(
            "<div id='" +
              id +
              "-tooltiptablediv' class='tooltip-table-container'  ></div>"
          );
        }

        if ($("#" + chart.chartId + "_tooltiptable").length == 0) {
          $("#" + id + "-tooltiptablediv").append(
            "<div id='" +
              chart.chartId +
              "_tooltiptable' class='chord-tooltiptablediv' ></div>"
          );
          var mydiv = $("#" + chart.chartId + "_tooltiptable");
          $("#" + chart.chartId + "_tooltiptable").append(
            "<table class='table-condensed table-bordered chord-tooltiptable'><thead><tr><th style='width:30%'>ORIGIN</th><th style='width:30%'>DESTINATION</th><th style='width:30%'>DATA</th></tr></thead>" +
              "<tbody></tbody>" +
              "</table>"
          );

          if (chartData.length == 2 && chartIdx == 1) {
            $("#" + chart.chartId + "_tooltiptable table").css(
              "margin-left",
              "12%"
            );
          }
        }
      }

      data = null;

      function changeCurrentDistrict(newCurrentDistrict, destinationDistrict) {
        if (currentDistrict != newCurrentDistrict) {
          currentDistrict = newCurrentDistrict;
          if (destinationDistrict != null) {
            currentDestDistrict = destinationDistrict;
          } else {
            currentDestDistrict = null;
          }

          setTimeout(redrawMap, CSS_UPDATE_PAUSE);
        } else {
          if (destinationDistrict != currentDestDistrict) {
            currentDestDistrict = destinationDistrict;
          }
          setTimeout(redrawMap, CSS_UPDATE_PAUSE);
        }
      }
    }

    function readInFilterData(callback) {
      if (ZONE_FILTER_LOC != "") {
        var zonecsv;
        try {
          d3.csv(
            dataLocation +
              abmviz_utilities.GetURLParameter("scenario") +
              "/" +
              ZONE_FILTER_LOC,
            function(error, filterdata) {
              //zonecsv = d3.csv.parseRows(filterdata).slice(1);
              if (error) {
                $("#chord").html(
                  "<div class='container'><h3><span class='alert alert-danger'>Error: An error occurred while loading the chord data.</span></h3></div>"
                );
                throw error;
              }
              zoneheaders = d3.keys(filterdata[0]);
              zoneFilterNameCol = zoneheaders[1];
              zoneFilterData = d3
                .nest()
                .key(function(d) {
                  return "filters";
                })
                .map(filterdata);
              callback();
            }
          );
        } catch (error) {
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

        var findDistrict = currentDistrict; //.replace(/\s/g, ".");
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
      return returnStyle;
    }

    function styleDestZoneGeoJSONLayer(feature) {
      var color = naColor;
      var isZoneVisible = false;
      if (
        feature.properties.NAME != undefined &&
        currentDestDistrict != undefined &&
        currentDestDistrict != ""
      ) {
        var zoneDataFeature = feature.properties.NAME;
        //possible that even if data for zone exists, could be missing this particular trip mode

        isZoneVisible = zoneDataFeature == currentDestDistrict;

        var findDistrict = currentDestDistrict; //.replace(/\s/g, ".");
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
      return returnStyle;
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
      return returnStyle;
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
      desireLines.forEach(function(desireLine) {
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

            featureValue =
              chartData[0].dataMatrix[indexByName[origDist].index][
                indexByName[destDist].index
              ]; // + datamatrix[indexByName[destDist].index][indexByName[origDist].index];
          }
          if (zoneDataFeatureOrigin != undefined && findDistrict != "") {
            if (currentDestDistrict != null) {
              isZoneVisible =
                zoneDataFeatureOrigin == findDistrict &&
                zoneDataFeatureDest == currentDestDistrict;
            } else {
              isZoneVisible = zoneDataFeatureOrigin == findDistrict;
            }
            if (featureValue == 0) {
              isZoneVisible = false;
            }
            color = fill(indexByName[findDistrict].index);
            let sum = chartData[0].dataMatrix[
              indexByName[findDistrict].index
            ].reduce(function(acc, val) {
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
          };
        } else {
          returnStyle = {
            //all SVG styles allowed
            // fillColor: color,

            weight: 0,
            color: color,
            strokeOpacity: 0,
            stroke: false
          };
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
      return returnStyle;
    }

    function createMap(callback) {
      //var latlngcenter = JSON.parse(CENTER_LOC);
      //var lat=latlngcenter[0];
      //var lng=latlngcenter[1];
      if (sidebyside) {
        $("#" + id + "-chart-map").remove();
        $("#" + id + "-div .chordchartdiv").removeClass("right-border");
        callback();
        return;
      } else {
        $("#" + id + "-div .chordchartdiv").addClass("col-sm-6");
        $("#" + id + "-datatable-div").css("margin-top", "-1%");
      }
      if ($("#" + id + "-by-district-map").children().length > 0) {
        $("#" + id + "-by-district-map").html("");
        $("#" + id + "-by-district-map").removeClass();
        $("#" + id + "-by-district-map").addClass("col-xs-12");
      }
      var tonerLayer = L.tileLayer(
        "//stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}.png",
        {
          id: id + "-by-district-map.toner",
          updateWhenIdle: true,
          unloadInvisibleFiles: true,
          reuseTiles: true,
          opacity: 1.0
        }
      );
      var Esri_WorldImagery = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          id: id + "-by-district-map.aerial",
          attribution:
            "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
        }
      );

      var container = L.DomUtil.get(id + "-by-district-map");
      if (container != null) {
        container._leaflet_id = null;
      }
      map = new L.map(id + "-by-district-map", {
        minZoom: 6,
        layers: [tonerLayer]
      }).setView(CENTER_LOC, 9);
      var baseMaps = {
        Grayscale: tonerLayer,
        Aerial: Esri_WorldImagery
      };
      controlLayer = L.control.layers(baseMaps).addTo(map);
      //centered at Atlanta
      map.on("zoomend", function(type, target) {
        var zoomLevel = map.getZoom();
        var zoomScale = map.getZoomScale();
        console.log("zoomLevel: ", zoomLevel, " zoomScale: ", zoomScale);
      });
      countiesSet = new Set();
      $.getJSON(dataLocation + ZONE_FILE_LOC, function(zoneTiles) {
        "use strict";
        circleMarkers = [];
        for (var i = 0; i < zoneTiles.features.length; i++) {
          var feature = zoneTiles.features[i];

          if (!feature.geometry.coordinates) continue;

          var centroid = L.latLngBounds(
            abmviz_utilities.flatByOne(feature.geometry.coordinates)
          ).getCenter();

          var circleMarker = L.circleMarker(
            L.latLng(centroid.lng, centroid.lat),
            circleStyle
          );
          circleMarker.properties = { NAME: feature.properties.NAME };
          if (
            feature.properties.NAME != undefined &&
            feature.properties.NAME != ""
          ) {
            circleMarkers.push(circleMarker);
          }
        }

        desireLines = [];
        for (var i = 0; i < circleMarkers.length; i++) {
          var origLat = circleMarkers[i]["_latlng"];
          var origDist = circleMarkers[i].properties.NAME; //circleMarkers[i]["zoneData"].ID;

          $.each(circleMarkers, function(idx, marker) {
            var destDist = marker["properties"].NAME;
            var destLatLng = marker["_latlng"];
            var latlngs = [];
            latlngs.push(origLat, destLatLng);
            var desireLine = L.polyline(latlngs);
            //desireLine.zoneData = zoneData;
            desireLine.properties = {
              o: origDist,
              d: destDist
            };
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
          $.getJSON(
            dataLocation +
              abmviz_utilities.GetURLParameter("scenario") +
              "/" +
              scenarioPolyFile,
            function(scenarioTiles) {
              "use strict";
              focusLayer = L.geoJSON(scenarioTiles, {
                style: styleFocusGeoJSONLayer
              });
            }
          ).complete(function(d) {
            controlLayer.addOverlay(focusLayer, "Focus");
          });
        }
        //underlyingMapLayer.addTo(map);
        $.getJSON(dataLocation + COUNTY_FILE, function(countyTiles) {
          "use strict";
          console.log(COUNTY_FILE + " success");
          //http://leafletjs.com/reference.html#tilelayer
          countyLayer = L.geoJson(countyTiles, {
            //keep only counties that we have data for
            filter: function(feature) {
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
          if (!SCENARIO_FOCUS) map.fitBounds(allCountyBounds);
          map.setMaxBounds(allCountyBounds);

          countyLayer.addTo(map);
        })
          .success(function() {
            console.log(COUNTY_FILE + " second success");
          })
          .error(function(jqXHR, textStatus, errorThrown) {
            console.log(COUNTY_FILE + " textStatus " + textStatus);
            console.log(COUNTY_FILE + " errorThrown" + errorThrown);
            console.log(
              COUNTY_FILE + " responseText (incoming?)" + jqXHR.responseText
            );
          })
          .complete(function() {
            console.log(COUNTY_FILE + " complete");
            controlLayer.addOverlay(countyLayer, "Counties");
            controlLayer.addOverlay(desireLineLayerGroup, "Desire Lines");
            if (DESIRELINESONDEFAULT) {
              desireLineLayerGroup.addTo(map);
            }
            updateDesireLines();
          });
        if (!SCENARIO_FOCUS) {
          $("#" + id + "-chart-map").css(
            "margin-top",
            $("#" + id + "-dropdown-div").height() / 2 + "px"
          );
        }
      }).complete(function() {
        if (!DESIRELINESONDEFAULT) {
          zoneDataLayer.addTo(map);
        }
        controlLayer.addOverlay(zoneDataLayer, "Zones");
      });

      //end geoJson of zone layer
      callback();
    } //end createMap

    function resizeListener() {
      console.log("Got resize event. Calling goThroughChordData");
      goThroughChordData();
    }

    window.addEventListener(
      "resize",
      abmviz_utilities.debounce(resizeListener, 250, true)
    );

    function redrawMap() {
      "use strict";
      if (sidebyside) {
        return;
      }
      if (map == undefined) {
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
      if (focusLayer && scenarioPolyFile) {
        focusLayer.setStyle(styleFocusGeoJSONLayer);
        focusLayer.bringToBack();
      }
      if (!SCENARIO_FOCUS) {
        $("#" + id + "-chart-map").css(
          "margin-top",
          $("#" + id + "-dropdown-div").height() / 2 + "px"
        );
      }
    }

    /**
     * Takes a d3 selection, iterates over the elements in the selection, and
     * returns an object with the max height and width of any elements in the
     * selection
     */
    function maxHeightOrWidth(selection) {
      var maxDimenstion = 0;
      selection.each(function() {
        var textRectangle = this.getBoundingClientRect();
        maxDimenstion = Math.max(
          maxDimenstion,
          textRectangle.width,
          textRectangle.height
        );
      });
      return maxDimenstion;
    }
  }
};
