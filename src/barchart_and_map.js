//encapsulate all code within a IIFE (Immediately-invoked-function-expression) to avoid polluting global namespace
//global object barchart_and_map will contain functions and variables that must be accessible from elsewhere
var BarChartMap = {
  barchart_and_map: function barchart_and_map(id, indx) {
    "use strict";

    /**
     * Hack workaround for a bug where going to a different tab, resizing the
     * window, and coming back to this one breaks the Leaflet map until the
     * window is resized again on this tab. Long-term solution is to introduce
     * a 3rd party client=side routing library and retire the home-grown
     * implementation.
     */
    window.dispatchEvent(new Event("resize"));

    var naColor = "White";
    var highlightColor = "Yellow";
    var focusColor = "Yellow";
    var bubbleColor = "rgba(255, 120, 0, 0.5)";
    var colors = ["red", "red", "red", "red"];
    //these will be replaced by default palette/ramp colors
    var selectedColorRampIndex = 0;
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
    //slider
    var handlers = [25, 50, 75];
    var map;
    var zoneData;
    var dataItems = [];
    var currentCounty = "";
    var modes;
    var circleMarkers;
    var countiesSet;
    var enabledCounties;
    var circlesLayerGroup;
    var chartData = null;
    //use Map instead of vanilla object because wish to preserve insertion order
    var modeData = new Map([]);
    var quantityColumn;
    var countyColumn;
    var zoneColumn;
    var modeColumn;
    var scenarioPolyFile;
    var scenario = abmviz_utilities.GetURLParameter("scenario");
    var region = abmviz_utilities.GetURLParameter("region");
    var dataLocation = localStorage.getItem(region);
    var url = dataLocation + scenario; // + "/BarChartAndMapData.csv"
    var fileName = "BarChartAndMapData.csv";
    var barChartTabSelector = '#' + id + '_id';
    var chartSelector = "#" + id + "-chart";
    var thisTab = $("#" + id + "_id");
    var stackChartsCheckbox = $("#" + id + "-stacked");
    var bubbleSizeDropdown = $("#" + id + "-bubble-size");
    var pageTitle = $(barChartTabSelector + " #page-title");
    var svgChart;
    var extNvd3Chart;
    var minBarWidth = 1;
    var minBarSpacing = 1;
    var marginTop = 0;
    var marginBottom = 50;
    var marginLeft = 110;
    var marginRight = 50;
    var CSS_UPDATE_PAUSE = 150;
    //milliseconds to pause before redrawing map
    var interval;
    var currentCycleModeIndex = 0;
    var cycleGoing = false;
    var breakUp;
    var currentTripModeZone;
    var currentTripModeBubble;
    var bubblesShowing = false;
    var zonesShowing = true;
    var showOutline = false;
    var maxFeature;
    var zoneDataLayer;
    var countyLayer;
    var focusLayer;
    var controlLayer;
    var barsWrap;
    var barsWrapRect;
    var barsWrapRectHeight;
    var barsWrapRectId = id + "-barsWrapRectRSG";
    var barsWrapRectSelector = "#" + barsWrapRectId;
    var paletteRamps = d3.selectAll("#" + id + "-div .ramp");
    var zonefilters = {};
    var zonefilterlabel = "";
    var ZONE_FILTER_LOC = "";
    var zoneFilterData;
    var zonefiles;
    var zoneheaders = [];
    var circleStyle = {
      stroke: false,
      fillColor: "set by updateBubbles",
      fillOpacity: 1.0
    };
    //config file options
    var COUNTY_FILE = "";
    var ZONE_FILE_LOC = "";
    var CENTER_LOC = [];
    var SCENARIO_FOCUS = false;
    var ROTATELABEL = 0;
    var BARSPACING = 0.2;
    var DEFAULT_MAP_DISPLAY = "zones";
    var MAP_DISPLAY_OPTIONS = {
      bubbles: "bubbles",
      zones: "zones"
    };
    var AGGREGATION_METHOD_OPTIONS = {
      sum: "sum",
      average: "average"
    };
    var AGGREGATION_METHOD = AGGREGATION_METHOD_OPTIONS.sum;

    /**
     * Grouped bar charts are sortable in two ways.
     * 1. Alphabetically by the labels of the major groups.
     * 2. Quantitatively by the values of the first bar in each group.
     */
    var BAR_GROUP_SORT_METHOD_OPTIONS = {
      alphabetical: "alphabetical",
      firstBar: "firstBar"
    };
    var BAR_GROUP_SORT_METHOD = BAR_GROUP_SORT_METHOD_OPTIONS.alphabetical;

    var STACK_CHARTS_BY_DEFAULT = true;
    var showCycleTools = true;
    var highlightLayer;
    var maxLabelLength = 0;
    var buildChart = $("#" + id + "-chart").children().length == 0;
    var zoneFilterFeatureCollections = {};
    var zoneFilterLayers = {};

    toggleZoneControls(true);

    //start off chain of initialization by reading in the data
    function readInDataCallback() {
      createMap(function() {
        console.log("createMap callback");
      });
      setDataSpecificDOM();
      svgChart = d3.select(chartSelector);
      updateCurrentTripModeOrClassification();
      createEmptyChart();
      initializeMuchOfUI();
    } //end readInDataCallback
    //start off chain of initialization by reading in the data
    getConfigSettings(function() {
      readInFilterData(function() {
        readInData(function() {
          readInDataCallback();
        });
      });
    });

    function getConfigSettings(callback) {
      if (buildChart) {
        $.getJSON(dataLocation + "region.json", function(data) {
          var configName = "Default";
          if (data["scenarios"][scenario].visualizations != undefined) {
            var thisBarMap =
              data["scenarios"][scenario].visualizations["BarMap"][indx];

            if (thisBarMap.file) {
              fileName = thisBarMap.file;
            }
            if (thisBarMap.config) {
              configName = thisBarMap.config;
            }
            if (thisBarMap.info) {
              var infoBox;
              infoBox = thisBarMap.info;
              $("#" + id + "-div span.glyphicon-info-sign").attr(
                "title",
                infoBox
              );
              $("#" + id + '-div [data-toggle="tooltip"]').tooltip();
            }
            if (thisBarMap.datafilecolumns) {
              var datacols = thisBarMap.datafilecolumns;
              $.each(datacols, function(key, value) {
                $("#" + id + "-datatable-columns").append(
                  "<p>" + key + ": " + value + "</p>"
                );
              });
            }
            if (thisBarMap.aggregationMethod) {
              AGGREGATION_METHOD = thisBarMap.aggregationMethod;
            }
            if (thisBarMap.barGroupSortMethod) {
              BAR_GROUP_SORT_METHOD = thisBarMap.barGroupSortMethod;
            }
            if (thisBarMap.title) {
              pageTitle.html(thisBarMap.title);
            }
          }

          //GO THROUGH region level configuration settings
          $.each(data, function(key, val) {
            if (key == "CountyFile") COUNTY_FILE = val;
            if (key == "ZoneFile") ZONE_FILE_LOC = val;
            if (key == "CenterMap") CENTER_LOC = val;
            if (key == "DefaultFocusColor") focusColor = val;
            if (key == "DefaultHighlightColor") highlightColor = val;
          });
          //go through scenario config level settings

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
            }
          }
          var configSettings = data["BarMap"][configName];
          if (configSettings != undefined) {
            $.each(configSettings, function(opt, value) {
              if (opt == "ZoneFile") {
                ZONE_FILE_LOC = value;
              }
              if (opt == "ZoneFilterFile") {
                ZONE_FILTER_LOC = value;
              }
              if (opt == "ZoneFilterLabel") {
                zonefilterlabel = value;
              }
              if (opt == "ZoneFilterColor") {
                zoneFilterColor = value;
              }
              if (opt == "ZoneFilters") {
                $.each(value, function(filtercolumn, filtername) {
                  zonefilters[filtercolumn] = filtername;
                });
              }
              if (opt == "RotateLabels") {
                ROTATELABEL = value;
              }
              if (opt == "BarSpacing") {
                BARSPACING = value;
              }
              if (opt == "CycleMapTools") {
                showCycleTools = value;
              }
              if (opt == "NoValueColor") {
                naColor = value;
              }
              if (opt == "DefaultMapDisplay") {
                DEFAULT_MAP_DISPLAY = value;
              }
              if (opt == "DefaultBubbleSize") {
                bubbleSizeDropdown.val(value);
              }
              if (opt == "StackAllChartsByDefault") {
                STACK_CHARTS_BY_DEFAULT = value;
                stackChartsCheckbox.prop("checked", value);
              }
            });
          }
        }).complete(function() {
          if (url.indexOf(fileName) == -1) {
            url += "/" + fileName;
          }
          callback();
        });
      }
    }

    function redrawMap() {
      "use strict";
      zoneDataLayer.setStyle(styleZoneGeoJSONLayer);
      if (Object.keys(zonefilters).length > 1) {
        // highlightLayer.setStyle(styleZoneHightlightLayer);
      }
      if (scenarioPolyFile != undefined) {
        focusLayer.setStyle(styleFocusGeoJSONLayer);
        focusLayer.bringToBack();
      }
      if (map.hasLayer(circlesLayerGroup)) {
        updateBubbleSize();
      }
    }

    function readInFilterData(callback) {
      if (Object.keys(zonefilters).length > 1 && ZONE_FILTER_LOC != "") {
        var zonecsv;
        d3.text(dataLocation + scenario + "/" + ZONE_FILTER_LOC, function(
          error,
          filterdata
        ) {
          zonecsv = d3.csv.parseRows(filterdata).slice(1);
          zoneheaders = d3.csv.parseRows(filterdata)[0];
          zoneFilterData = d3
            .nest()
            .key(function(d) {
              return "filters";
            })
            .map(zonecsv);
        });
        callback();
      } else {
        callback();
      }
    }

    function readInData(callback) {
      "use strict";

      d3.csv(url, function(error, data) {
        "use strict";
        if (error) {
          $("#" + id + "-div").html(
            "<div class='container'><h3><span class='alert alert-danger'>Error: An error occurred while loading the Barchart and Map data.</span></h3></div>"
          );
          throw error;
        }
        //expected data should have columns similar to: ZONE,COUNTY,TRIP_MODE_NAME,QUANTITY
        var headers = d3.keys(data[0]);
        zoneColumn = headers[0];
        countyColumn = headers[1];
        if (countyColumn == undefined) {
          $("#" + id + "-div").html(
            "<div class='container'><h3><span class='alert alert-danger'>Error: An error occurred while loading the Barchart and Map data.</span></h3></div>"
          );
          return;
        }
        if (!$.fn.DataTable.isDataTable("#" + id + "-datatable-table")) {
          var columnsDT = [];
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
        modeColumn = headers[2];
        quantityColumn = headers[3];
        var rawChartData = new Map([]);
        //run through data. Filter out 'total' pseudo-mode, convert quantity to int, create zoneData

        // Keep track of the lengths of the nested series
        // in order to calculate averages.
        var seriesLengths = {};
        zoneData = {};
        countiesSet = new Set();

        data.forEach(function(d) {
          var modeName = d[modeColumn];
          var keepThisObject = modeName != "TOTAL";
          if (keepThisObject) {
            var zoneName = d[zoneColumn];
            var countyName = d[countyColumn];
            var quantity = parseInt(d[quantityColumn]);
            if (countyName != "Total") {
              if (zoneData[zoneName] == undefined) {
                zoneData[zoneName] = {
                  FILTERS: {}
                };
              }
              zoneData[zoneName][modeName] = {
                COUNTY: countyName,
                QUANTITY: quantity
              };
              //zoneData[zoneName] = {
              //   FILTERS:{}
              //};
              if (Object.keys(zonefilters).length > 1) {
                for (var i in zonefilters) {
                  zoneData[zoneName].FILTERS[i] =
                    zoneFilterData.filters[zoneName - 1][
                      zoneheaders.indexOf(i)
                    ];
                }
              }
            }

            if (rawChartData[countyName] == undefined) {
              rawChartData[countyName] = {};
              countiesSet.add(countyName);
              seriesLengths[countyName] = {};
              maxLabelLength = Math.max(countyName.length, maxLabelLength);
            }

            if (rawChartData[countyName][modeName] == undefined) {
              rawChartData[countyName][modeName] = 0;
              seriesLengths[countyName][modeName] = 0;
              //keep track of counts for each mode
              //don't actually care about counts but this also implicitly keeps a list of all modes
              //in the order they were encountered because properties are ordered
              if (modeData[modeName] == undefined) {
                modeData[modeName] = {
                  enabled: true,
                  serie: []
                };
              }
            }

            modeData[modeName].serie.push(quantity);
            rawChartData[countyName][modeName] += quantity;
            seriesLengths[countyName][modeName] += 1;
          }
          //end if keeping this object
          return keepThisObject;
        });

        if (AGGREGATION_METHOD === AGGREGATION_METHOD_OPTIONS.average) {
          for (var majorGroup in rawChartData) {
            for (var minorGroup in rawChartData[majorGroup]) {
              var average =
                rawChartData[majorGroup][minorGroup] /
                seriesLengths[majorGroup][minorGroup];
              rawChartData[majorGroup][minorGroup] = average;
            }
          }
        }

        modes = Object.keys(modeData);
        data = null;
        zoneFilterData = null;

        //allow GC to reclaim memory
        //need to run through rawChartData and put modes in order and insert ones that are missing
        chartData = [];
        countiesSet.forEach(function(countyName) {
          var rawCountyObject = rawChartData[countyName];
          var newCountyObject = {
            groupLabel: countyName,
            subgroups: [],
            enabled: true
          };
          chartData.push(newCountyObject);

          modes.forEach(function(modeName) {
            var countyModeTotalQuantity = rawCountyObject[modeName];
            if (countyModeTotalQuantity == undefined) {
              countyModeTotalQuantity = 0;
            }
            newCountyObject.subgroups.push({
              subgroupLabel: modeName,
              value: countyModeTotalQuantity
            });
          });
          //end modes foreach
        });

        if (BAR_GROUP_SORT_METHOD === BAR_GROUP_SORT_METHOD_OPTIONS.firstBar) {
          chartData.sort(compareFirstBar);
        }

        function compareFirstBar(groupA, groupB) {
          // If the groups don't have correct data format, don't sort them.
          for (let group of [groupA, groupB]) {
            if (
              !group.subgroups ||
              !group.subgroups.length ||
              group.subgroups[0].value === undefined
            ) {
              return 0;
            }
          }

          if (groupA.subgroups[0].value < groupB.subgroups[0].value) {
            return 1;
          } else if (groupA.subgroups[0].value > groupB.subgroups[0].value) {
            return -1;
          } else {
            return 0;
          }
        }

        //end countiesSet forEach
        rawChartData = null;
        //allow GC to reclaim memory
        callback();
      });
      //end d3.csv
    } //end readInData
    function setDataSpecificDOM() {
      d3.selectAll("#" + id + "-div .mode-share-by-county-area-type").html(
        countyColumn
      );
      d3.selectAll(
        "#" + id + "-div .mode-share-by-county-trip-mode-zones"
      ).html("Zones");
      d3.selectAll("#" + id + "-div .mode-share-by-county-trip-mode").html(
        modeColumn
      );
      d3.selectAll(
        "#" + id + "-div .mode-share-by-county-trip-mode-bubbles"
      ).html("Bubbles");
      d3.selectAll(
        "#" + id + "-div .mode-share-by-county-trip-mode-example"
      ).html(modes[0]);
      modes.forEach(function(modeName) {
        $("#" + id + "-current-trip-mode-zones").append(
          "<option>" + modeName + "</option>"
        );
        $("#" + id + "-current-trip-mode-bubbles").append(
          "<option>" + modeName + "</option>"
        );
      });
      // 		chartData.forEach(function (chartObject) {
      // 			$("#mode-share-by-county-chart-selection").append("<option>" + chartObject.groupLabel + "</option>");
      // 		});
      // 		$("#mode-share-by-county-chart-selection").chosen();
    }

    //end setDataSpecificDOM
    function updateChart(callback) {
      "use strict";
      updateChartNVD3(callback);
    }

    function updateChartNVD3(callback) {
      "use strict";
      //nvd3 expects data in the opposite hierarchy than rest of code so need to create
      //but can also filter out counties at same time
      //NOTE: ability to enable/disable counties  removed from UI so currently never used.
      enabledCounties = chartData.filter(function(countyObject) {
        return countyObject.enabled;
      });

      var hierarchicalData = [];
      modes.forEach(function(modeName, modeIndex) {
        var subgroups = [];
        var modeObject = {
          key: modeName,
          values: subgroups
        };
        hierarchicalData.push(modeObject);
        enabledCounties.forEach(function(countyWithModesObject) {
          var simpleModeObject = countyWithModesObject.subgroups[modeIndex];
          var retrievedModeName = simpleModeObject.subgroupLabel;
          if (retrievedModeName != modeName) {
            throw "SOMETHING IS WRONG. Mode is not as expected. Expected mode: " +
              modeName +
              ", found modeName: " +
              retrievedModeName;
          }
          var simpleCountyObject = {
            label: countyWithModesObject.groupLabel,
            value: simpleModeObject.value
          };
          subgroups.push(simpleCountyObject);
        });
        //end loop over chartData countyObjects
      });
      //end loop over modes
      //poll every 150ms for up to two seconds waiting for chart
      abmviz_utilities.poll(
        function() {
          return extNvd3Chart != undefined;
        },
        function() {
          svgChart.datum(hierarchicalData).call(extNvd3Chart);
          //create a rectangle over the chart covering the entire y-axis and to the left of x-axis to include county labels
          //first check if
          $("#" + id + "-div .nv-x .nv-axis text")
            .not(".nv-axislabel")
            .css("transform", "rotate(" + ROTATELABEL + "deg)");
          barsWrap = svgChart.select(".nv-barsWrap.nvd3-svg");
          if (barsWrap[0].length == 0) {
            throw "did not find expected part of chart";
          }
          //if first time (enter() selection) create rect
          //nv-barsWrap nvd3-svg
          barsWrapRect = barsWrap
            .selectAll(barsWrapRectSelector)
            .data([barsWrapRectId])
            .enter()
            .insert("rect", ":first-child")
            .attr("id", barsWrapRectId)
            .attr("x", -marginLeft)
            .attr("fill-opacity", "0.0")
            .on("mousemove", function(event) {
              var mouseY = d3.mouse(this)[1];
              var numCounties = enabledCounties.length;
              var heightPerGroup = barsWrapRectHeight / numCounties;
              var countyIndex = Math.floor(mouseY / heightPerGroup);
              var countyObject = enabledCounties[countyIndex];
              var newCounty = countyObject.groupLabel;
              changeCurrentCounty(newCounty);
            });
          setTimeout(updateChartMouseoverRect, 1000);
        },
        function() {
          throw "something is wrong -- extNvd3Chart still doesn't exist after polling ";
        }
      );
      //end call to poll
      callback();
    } //end updateChartNVD3

    function updateChartMouseoverRect() {
      if (thisTab.is(":visible")) {
        var innerContainer = svgChart.select(
          ".nvd3.nv-wrap.nv-multibarHorizontal"
        );
        var innerContainerNode = innerContainer.node();
        var tryAgain = true;
        if (innerContainerNode != undefined) {
          var bounds = innerContainerNode.getBBox();
          var width = bounds.width + marginLeft;
          barsWrapRectHeight = bounds.height;
          if (barsWrapRectHeight > 0) {
            barsWrap
              .select(barsWrapRectSelector)
              .attr("width", width)
              .attr("height", 20);
            tryAgain = false;
          }
        }
        //end if innerContainerNode exists
        if (tryAgain) {
          setTimeout(updateChartMouseoverRect, 500);
        }
      }
    }

    //end updateChartMouseoverRect
    function changeCurrentCounty(newCurrentCounty) {
      if (currentCounty != newCurrentCounty) {
        currentCounty = newCurrentCounty;
        var countyLabels = d3.selectAll(
          ".nvd3.nv-multiBarHorizontalChart .nv-x text "
        );
        countyLabels.classed(
          "mode-share-by-county-trip-mode-current-county",
          function(d, i) {
            var setClass = d == currentCounty;
            return setClass;
          }
        );
        //end classed of group rect
        countyLayer.setStyle(function(feature) {
          var style = {};
          if (feature.properties.NAME == currentCounty) {
            style.weight = 4;
          } else {
            style.weight = 1;
          }
          return style;
        });
        //end setStyle function
        //add delay to redrawMap so that text has chance to bold
        //setTimeout(redrawMap, CSS_UPDATE_PAUSE);
      }
      //end if county is changing
    } //end change currentCounty
    function createEmptyChart() {
      nv.addGraph({
        generate: function chartGenerator() {
          var colorScale = d3.scale.category20();
          var nvd3Chart = nv.models.multiBarHorizontalChart();
          if (stackChartsCheckbox.is(":checked")) {
            nvd3Chart = nv.models
              .multiBarHorizontalChart()
              .groupSpacing(BARSPACING);
          } else {
            nvd3Chart = nv.models.multiBarHorizontalChart();
          }

          nvd3Chart
            .x(function(d, i) {
              return d.label;
            })
            .y(function(d) {
              return d.value;
            })
            .color(function(d, i) {
              var color = colorScale(i);
              return color;
            })
            .duration(250)
            .margin({
              left: Math.max(110, marginLeft + (maxLabelLength - 5) * 5),
              right: marginRight,
              top: marginTop,
              bottom: marginBottom
            })
            .id(id + "-multiBarHorizontalChart")
            .stacked(STACK_CHARTS_BY_DEFAULT)
            .showControls(false);
          marginLeft = Math.max(110 + (maxLabelLength - 5) * 5, 110);
          nvd3Chart.yAxis.tickFormat(d3.format(",.0f"));
          nvd3Chart.yAxis.axisLabel(quantityColumn);
          //this is actually for xAxis since basically a sideways column chart
          nvd3Chart.xAxis
            .axisLabel(countyColumn)
            .axisLabelDistance(maxLabelLength * 6);
          //this is actually for yAxis

          nv.utils.windowResize(function() {
            if (!thisTab.is(":visible")) {
              return;
            }
            //reset marginTop in case legend has gotten less tall
            nvd3Chart.margin({
              top: marginTop
            });
            updateChart(function() {
              console.log("updateChart callback after windowResize");
            });
          });
          nvd3Chart.legend.dispatch.on("legendDblclick", function(event) {
            var newTripMode = event.key;
            $("#" + id + "-current-trip-mode-zones").val(newTripMode);
            updateCurrentTripModeOrClassification();
            redrawMap();
          });
          nvd3Chart.multibar.dispatch.on("elementMouseover", function(d, i) {
            var countyUnderMouse = d.value;
            changeCurrentCounty(countyUnderMouse);
          });
          //furious has colored boxes with checkmarks
          //nvd3Chart.legend.vers('furious');
          return nvd3Chart;
        }, //end generate
        callback: function(newGraph) {
          extNvd3Chart = newGraph;

          updateChart(function() {
            console.log(
              "updateChart callback during after the nvd3 callback called"
            );
          });
        } //end callback function
      });
      //end nv.addGraph
    } //end createEmptyChart
    function styleZoneGeoJSONLayer(feature) {
      var color = naColor;
      var isZoneVisible = true;
      if (feature.zoneData != undefined) {
        var zoneDataFeature = feature.zoneData[currentTripModeZone];
        //possible that even if data for zone exists, could be missing this particular trip mode
        if (zoneDataFeature != undefined) {
          var quantity = zoneDataFeature.QUANTITY;
          if (zoneDataFeature.QUANTITY == undefined) {
            throw "Something is wrong. zoneDataFeature.QUANTITY is undefined. " +
              JSON.stringify(zoneDataFeature);
          }
          if (quantity >= breakUp[3]) {
            color = colors[3];
          } else if (quantity >= breakUp[2]) {
            color = colors[2];
          } else if (quantity >= breakUp[1]) {
            color = colors[1];
          } else {
            color = colors[0];
          }
        }
      }

      //end if we have data for this zone
      //the allowed options are described here: http://leafletjs.com/reference.html#path-options
      var returnStyle = {
        //all SVG styles allowed
        fillColor: color,
        fillOpacity: isZoneVisible ? 0.5 : 0.0,
        weight: 1,
        color: "darkGrey",
        strokeOpacity: 0.05,
        stroke: showOutline
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

    //end styleCountyGeoJSONLayer function
    function createMap(callback) {
      //var latlngcenter = JSON.parse(CENTER_LOC);
      //var lat=latlngcenter[0];
      //var lng=latlngcenter[1];
      if (map != undefined) {
        return;
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
      map = L.map(id + "-map", {
        minZoom: 7,
        layers: [tonerLayer]
      }).setView(CENTER_LOC, 9);
      //centered at Atlanta
      map.on("zoomend", function(type, target) {
        var zoomLevel = map.getZoom();
        var zoomScale = map.getZoomScale();
      });

      $.getJSON(dataLocation + ZONE_FILE_LOC, function(zoneTiles) {
        "use strict";
        //there should be at least as many zones as the number we have data for.

        if (zoneTiles.features.length < Object.keys(zoneData).length) {
          throw "Something is wrong! zoneTiles.features.length(" +
            zoneTiles.features.length +
            ") < Object.keys(zoneData).length(" +
            Object.keys(zoneData).length +
            ").";
        }

        circleMarkers = [];
        //create circle markers for each zone centroid
        for (var feature of zoneTiles.features) {
          var featureZoneData = zoneData[feature.properties.id];

          if (featureZoneData == undefined) {
            continue;
          }

          //WARNING: center coordinates seem to have lat and lng reversed!
          var centroid = L.latLngBounds(
            abmviz_utilities.flatByOne(feature.geometry.coordinates)
          ).getCenter();
          //REORDER lat and lng
          var circleMarker = L.circleMarker(
            L.latLng(centroid.lng, centroid.lat),
            circleStyle
          );
          circleMarker.zoneData = featureZoneData;
          feature.zoneData = featureZoneData;

          // This loop will turn zoneFilterFeatures into an object
          // where each key corresponds to the filters in the data
          // and each value is an array of features for that filter.
          if (featureZoneData.FILTERS) {
            for (let filterKey in featureZoneData.FILTERS) {
              // FILTERS value will be "0" if false, "1" if true
              // so we need to parseInt here to interpret 0 as
              // falsy. If it's falsy, skip to next filter.
              if (!parseInt(featureZoneData.FILTERS[filterKey])) {
                continue;
              }

              // If the object does not yet contain a key with the filter
              // key value, add it to the object.
              if (!zoneFilterFeatureCollections[filterKey]) {
                zoneFilterFeatureCollections[filterKey] = {
                  type: "FeatureCollection",
                  features: [feature]
                };
                continue;
              }

              // If the object already has a property with the name of the
              // filter key, push to that array.
              if (zoneFilterFeatureCollections[filterKey]) {
                zoneFilterFeatureCollections[filterKey].features.push(feature);
              }
            }
          }

          circleMarkers.push(circleMarker);
        }

        for (let collectionKey in zoneFilterFeatureCollections) {
          let layer = L.geoJson(zoneFilterFeatureCollections[collectionKey], {
            reuseTiles: true,
            style: {
              //all SVG styles allowed
              fill: false,
              fillOpacity: 0.0,
              stroke: true,
              weight: 0.5,
              strokeOpacity: 0.5,
              color: highlightColor
            }
          });

          for (let zoneheader of zoneheaders) {
            if (!(zoneheader in zonefilters) || zoneheader !== collectionKey)
              continue;
            controlLayer.addOverlay(layer, zonefilters[zoneheader]);
          }

          zoneFilterLayers[collectionKey + "_zone"] = layer;
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

        //var stamenTileLayer = new L.StamenTileLayer("toner-lite"); //B&W stylized background map
        //map.addLayer(stamenTileLayer);

        $.getJSON(dataLocation + COUNTY_FILE, function(countyTiles) {
          "use strict";
          //http://leafletjs.com/reference.html#tilelayer
          countyLayer = L.geoJson(countyTiles, {
            //keep only counties that we have data for
            filter: function(feature) {
              return countiesSet.has(feature.properties.NAME);
            },
            updateWhenIdle: true,
            unloadInvisibleFiles: true,
            reuseTiles: true,
            opacity: 1.0,
            style: styleCountyGeoJSONLayer,
            onEachFeature: onEachCounty
          });

          var allCountyBounds = countyLayer.getBounds();
          if (!SCENARIO_FOCUS && countyLayer.getBounds().isValid())
            map.fitBounds(allCountyBounds);
          updateBubbleColor();
          updateBubbleSize();
          zoneDataLayer.addTo(map);
          countyLayer.addTo(map);
          // highlightLayer.addTo(map);
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
            controlLayer.addOverlay(countyLayer, "Counties");

            var mapZoneToggleButtons = document.querySelectorAll(
              "#mapZoneToggleButton"
            );
            var mapBubbleToggleButtons = document.querySelectorAll(
              "#mapBubbleToggleButton"
            );

            applyToNodeList(mapZoneToggleButtons, button => button.addEventListener('click', activateZones))
            applyToNodeList(mapBubbleToggleButtons, button => button.addEventListener('click', activateBubbles))

            function activateZones() {
              zoneDataLayer.addTo(map);
              circlesLayerGroup.removeFrom(map);
              applyToNodeList(mapZoneToggleButtons, button => button.classList.add("btn-primary"))
              applyToNodeList(mapBubbleToggleButtons, button => button.classList.remove("btn-primary"));
              toggleZoneControls(true);
            }

            function activateBubbles() {
              zoneDataLayer.removeFrom(map);
              circlesLayerGroup.addTo(map);
              applyToNodeList(mapBubbleToggleButtons, button => button.classList.add("btn-primary"));
              applyToNodeList(mapZoneToggleButtons, button => button.classList.remove("btn-primary"))
              toggleBubbleControls(true);
            }

            if (DEFAULT_MAP_DISPLAY === MAP_DISPLAY_OPTIONS.bubbles) {
              activateBubbles();
            } else {
              activateZones();
            }
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

        //end if we have data for this trip mode
      });

      if (scenarioPolyFile != undefined) {
        $.getJSON(dataLocation + scenario + "/" + scenarioPolyFile, function(
          scenarioTiles
        ) {
          "use strict";
          focusLayer = L.geoJSON(scenarioTiles, {
            style: styleFocusGeoJSONLayer
          });
        }).complete(function(d) {
          controlLayer.addOverlay(focusLayer, "Focus");
        });
      } //end geoJson of zone layer
      var baseMaps = {
        Grayscale: tonerLayer,
        Aerial: Esri_WorldImagery
      };

      controlLayer = L.control.layers(baseMaps).addTo(map);
    } //end createMap

    function styleFocusGeoJSONLayer(feature) {
      var returnStyle = {
        //all SVG styles allowed
        stroke: true,
        weight: 5,
        color: focusColor
      };
      return returnStyle;
    }

    function updateColors(values, themax) {
      "use strict";
      var colorStops = colors[0] + ", ";
      // start left with the first color
      for (var i = 0; i < values.length; i++) {
        colorStops += colors[i] + " " + values[i] / (themax / 100.0) + "%,";
        colorStops += colors[i + 1] + " " + values[i] / (themax / 100.0) + "%,";
      }
      // end with the last color to the right
      colorStops += colors[colors.length - 1];
      var css = "";
      if (navigator.userAgent.toLowerCase().indexOf("firefox") > -1) {
        //mozilla
        css = "-moz-linear-gradient(left," + colorStops + ")";
      } else if (
        navigator.userAgent.toLowerCase().indexOf("chrome") > -1 ||
        navigator.userAgent.toLowerCase().indexOf("safari") > -1
      ) {
        // Safari 5.1, Chrome 10+
        css = "-webkit-linear-gradient(left," + colorStops + ")";
      } else {
        //ie
        css = "-ms-linear-gradient(left," + colorStops + ")";
      }
      $("#" + id + "-slider").css("background-image", css);
    }

    function setColorPalette(clickedIndex) {
      selectedColorRampIndex = clickedIndex;
      var currentPalette = paletteRamps[0][selectedColorRampIndex];
      var rects = d3.select(currentPalette).selectAll("rect");
      rects.each(function(d, i) {
        var paletteColor = d3.rgb(d3.select(this).attr("fill"));
        colors[i] = paletteColor;
      });
      d3.selectAll("#" + id + "-div .ramp").classed("selected", function(
        d,
        tempColorRampIndex
      ) {
        return tempColorRampIndex == selectedColorRampIndex;
      });
    } //end setColorPalette
    function initializeMuchOfUI() {
      stackChartsCheckbox.click(function() {
        extNvd3Chart.stacked(this.checked);
        var test = extNvd3Chart.groupSpacing();
        if (this.checked) {
          extNvd3Chart.groupSpacing(BARSPACING);
        } else {
          extNvd3Chart.groupSpacing(0.2);
        }
        extNvd3Chart.update();
      });
      $("#" + id + "-stroke").click(function() {
        updateOutline();
      });
      $("#" + id + "-zones").click(function() {
        // updateMapUI();
      });
      $("#" + id + "-bubbles").click(function() {
        //updateMapUI();
      });

      function updateMapUI() {
        bubblesShowing = $("#" + id + "-bubbles").is(":checked");
        zonesShowing = $("#" + id + "-zones").is(":checked");
        bubbleSizeDropdown.spectrum(
          bubblesShowing ? "enable" : "disable",
          true
        );
        bubbleSizeDropdown.prop("disabled", !bubblesShowing);
        if (bubblesShowing) {
          updateBubbleColor();
          updateBubbleSize();
        }
      }

      if (showCycleTools == false) {
        $("#" + id + "-slider").hide();
        $("#" + id + "-start-cycle-map").hide();
        $("#" + id + "-cycle-frequency")
          .closest("div")
          .hide();
      }
      bubbleSizeDropdown.change(updateBubbleSize);
      $("#" + id + "-legend-type").click(function() {
        extNvd3Chart.legend.vers(this.checked ? "classic" : "furious");
        extNvd3Chart.update();
      });
      var colorRamps = paletteRamps.on("click", function(d, i) {
        setColorPalette(i);
        updateColors($("#" + id + "-slider").slider("values"));
        //add delay to redrawMap so css has change to updates
        setTimeout(redrawMap, CSS_UPDATE_PAUSE);
      });

      //end on click for ramp/palette
      if ($("#" + id + "-classification").val() == "custom") {
        $("#" + id + "-update-map").css("display", "inline");
        $("#" + id + "-slider").show();
      }
      if (
        $("#" + id + "-classification").val() != "custom" &&
        showCycleTools == false
      ) {
        $("#" + id + "-slider").hide();
      }
      //Logic for cycling through the maps
      $("#" + id + "-start-cycle-map").click(function() {
        $("#" + id + "-stop-cycle-map").css("display", "inline");
        $("#" + id + "-start-cycle-map").css("display", "none");
        cycleGoing = true;
        currentCycleModeIndex = 0;
        cycleTripMode();
      });
      $("#" + id + "-stop-cycle-map").click(function() {
        cycleGoing = false;
        $("#" + id + "-stop-cycle-map").css("display", "none");
        $("#" + id + "-start-cycle-map").css("display", "inline");
      });

      function cycleTripMode() {
        var newTripMode = modes[currentCycleModeIndex];
        if (map.hasLayer(zoneDataLayer)) {
          $("#" + id + "-current-trip-mode-zones").val(newTripMode);
        }
        if (map.hasLayer(circlesLayerGroup)) {
          $("#" + id + "-current-trip-mode-bubbles").val(newTripMode);
        }
        updateCurrentTripModeOrClassification();
        redrawMap();
        currentCycleModeIndex++;
        if (
          currentCycleModeIndex >=
          $("#" + id + "-current-trip-mode-zones option").size()
        ) {
          currentCycleModeIndex = 0;
        }
        if (cycleGoing) {
          var timeInterval =
            parseInt($("#" + id + "-cycle-frequency").val()) * 1000;
          setTimeout(cycleTripMode, timeInterval);
        }
        //end if cycleGoing
      }

      //end cycleTripMode
      $("#" + id + "-cycle-frequency").change(function() {
        //no need to do anything since cycleTripMode always reads the current #cycle-frequency
      });
      $("#" + id + "-update-map").click(function() {
        var sliderValues = $("#" + id + "-slider").slider("values");
        breakUp[1] = sliderValues[0];
        breakUp[2] = sliderValues[1];
        breakUp[3] = sliderValues[2];
        redrawMap();
      });
      //value slider
      $("#" + id + "-slider").slider({
        range: false,
        disabled: $("#" + id + "-classification").val() != "custom",
        min: 0,
        max: 100,
        values: handlers,
        create: function(event, ui) {
          $("#" + id + "-div .ui-slider-handle:first").html(
            '<div class="tooltip top slider-tip"><div class="tooltip-arrow"></div><div class="tooltip-inner">' +
              handlers[0] +
              "</div></div>"
          );
          $("#" + id + "-div .ui-slider-handle:eq(1)").html(
            '<div class="tooltip top slider-tip"><div class="tooltip-arrow"></div><div class="tooltip-inner">' +
              handlers[1] +
              "</div></div>"
          );
          $("#" + id + "-div .ui-slider-handle:last").html(
            '<div class="tooltip top slider-tip"><div class="tooltip-arrow"></div><div class="tooltip-inner">' +
              handlers[2] +
              "</div></div>"
          );
        },
        slide: function(event, ui) {
          var themax = $("#mode-share-by-county-slider").slider(
            "option",
            "max"
          );
          updateColors(ui.values, themax);
          $("#" + id + "-div .ui-slider-handle:first").html(
            '<div class="tooltip top slider-tip"><div class="tooltip-arrow"></div><div class="tooltip-inner">' +
              ui.values[0] +
              "</div></div>"
          );
          $("#" + id + "-div .ui-slider-handle:eq(1)").html(
            '<div class="tooltip top slider-tip"><div class="tooltip-arrow"></div><div class="tooltip-inner">' +
              ui.values[1] +
              "</div></div>"
          );
          $("#" + id + "-div .ui-slider-handle:last").html(
            '<div class="tooltip top slider-tip"><div class="tooltip-arrow"></div><div class="tooltip-inner">' +
              ui.values[2] +
              "</div></div>"
          );
        }
      });
      updateColors(handlers, $("#" + id + "-slider").slider("option", "max"));
      $("#" + id + "-current-trip-mode-zones").change(function() {
        updateCurrentTripModeOrClassification();
        redrawMap();
      });
      $("#" + id + "-current-trip-mode-bubbles").change(function() {
        updateCurrentTripModeOrClassification();
        redrawMap();
      });

      $("#" + id + "-classification").change(function() {
        updateCurrentTripModeOrClassification();
        redrawMap();
      });
      $("#" + id + "-naColor").spectrum({
        color: naColor,
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
          naColor = color;
          redrawMap();
          updateColors($("#" + id + "-slider").slider("values"));
        }
      });
      $("#" + id + "-bubble-color").spectrum({
        color: bubbleColor,
        showInput: true,
        className: "full-spectrum",
        showInitial: true,
        showPalette: true,
        showAlpha: true,
        showSelectionPalette: true,
        maxSelectionSize: 10,
        preferredFormat: "hex",
        localStorageKey: "spectrum.demo",
        clickoutFiresChange: true,
        palette: palette,
        // 			change: function (color) {
        // 				//BUG this gets called when user still clicking in color chooser (despite docs) See
        // 				//https://github.com/bgrins/spectrum/issues/289
        // 				bubbleColor = color;
        // 				updateBubbleColor();
        // 			},
        hide: function(color) {
          if (color != bubbleColor) {
            bubbleColor = color;
            updateBubbleColor();
          }
        },
        //move is called for all color changes within picker
        move: function(color) {
          if (color != bubbleColor) {
            bubbleColor = color;
            updateBubbleColor();
          }
        }
      });
      //initialize the map palette
      setColorPalette(selectedColorRampIndex);
      $("#" + id + "-checkboxes").change(function() {
        redrawMap();
      });
    }

    //end initialize much of ui
    //hex to rgb for handling transparancy
    function hexToRgb(hex) {
      "use strict";
      var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
      hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
      });
      var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
          }
        : undefined;
    }

    function updateBubbleColor() {
      "use strict";
      var styleObject = {
        fillColor: bubbleColor
      };
      circleMarkers.forEach(function(circleMarker) {
        circleMarker.setStyle(styleObject);
      });
    }

    function updateBubbleSize() {
      var mapCenter = map.getCenter();
      var eastBound = map.getBounds().getEast();
      var centerEast = L.latLng(mapCenter.lat, eastBound);
      var bubbleMultiplier = parseInt(bubbleSizeDropdown.val());
      var mapBounds = d3
        .select("#" + id + "-map")
        .node()
        .getBoundingClientRect();
      var mapRadiusInPixels = mapBounds.width / 2;
      var maxBubbleRadiusInPixels = mapRadiusInPixels / 50;
      var maxBubbleSize = bubbleMultiplier * maxBubbleRadiusInPixels;
      var serie = new geostats(modeData[currentTripModeBubble].serie);
      maxFeature = serie.max();
      var scaleSqrt = d3.scale
        .sqrt()
        .domain([0, maxFeature])
        .range([0, maxBubbleSize]);
      circleMarkers.forEach(function(circleMarker) {
        var zoneData = circleMarker.zoneData;
        var zoneTripData = zoneData[currentTripModeBubble];
        var sqrtRadius = 0;
        var isZoneVisible = true;

        if (zoneTripData != undefined && isZoneVisible) {
          var quantity = zoneTripData.QUANTITY;
          var sqrtRadius = scaleSqrt(quantity);
        }
        circleMarker.setRadius(sqrtRadius);
      });
    }

    function updateCurrentTripModeOrClassification() {
      "use strict";
      currentTripModeBubble = $("#" + id + "-current-trip-mode-bubbles").val();
      currentTripModeZone = $("#" + id + "-current-trip-mode-zones").val();
      var startTime = Date.now();
      var serie = new geostats(modeData[currentTripModeZone].serie);
      maxFeature = serie.max();
      //handle the different classifications
      var classification = $("#" + id + "-classification").val();
      $("#" + id + "-slider").slider({
        range: false,
        disabled: $("#" + id + "-classification").val() != "custom"
      });
      if (classification == "custom") {
        $("#" + id + "-update-map").css("display", "inline");
        $("#" + id + "-slider").show();
      } else {
        $("#" + id + "-update-map").css("display", "none");
        if (showCycleTools == false && classification != "custom") {
          $("#" + id + "-slider").hide();
        }
        if (classification == "even-interval") {
          breakUp = serie.getClassEqInterval(4);
        } else if (classification == "quartiles") {
          breakUp = serie.getClassQuantile(4);
        } else if (classification == "jenks") {
          breakUp = serie.getClassJenks(4);
        } else {
          throw "Unhandled classification: " + classification;
        }
        var newValues = [
          parseInt(breakUp[1]),
          parseInt(breakUp[2]),
          parseInt(breakUp[3])
        ];
        //update the slider
        $("#" + id + "-slider").slider({
          min: breakUp[0],
          max: breakUp[4],
          values: newValues,
          start: function(event, ui) {
            $("#" + id + "-div .ui-slider-handle:first").html(
              '<div class="tooltip top slider-tip"><div class="tooltip-arrow"></div><div class="tooltip-inner">' +
                newValues[0] +
                "</div></div>"
            );
            $("#" + id + "-div .ui-slider-handle:eq(1)").html(
              '<div class="tooltip top slider-tip"><div class="tooltip-arrow"></div><div class="tooltip-inner">' +
                newValues[1] +
                "</div></div>"
            );
            $("#" + id + "-div .ui-slider-handle:last").html(
              '<div class="tooltip top slider-tip"><div class="tooltip-arrow"></div><div class="tooltip-inner">' +
                newValues[2] +
                "</div></div>"
            );
          }
        });
        updateColors(newValues, breakUp[4]);
        if (bubblesShowing) {
          updateBubbleSize();
        }
      }
      //end if !custom
    } //end updateCurrentTripModeOrClassification
    function updateOutline() {
      showOutline = $("#" + id + "-stroke").is(":checked");
      redrawMap();
    }

    //return only the parts that need to be global
    return {
      updateOutline: updateOutline
    };
  }
};
//end encapsulating IIFE

var zoneControlSelectors = [
  ".zone-control",
  ".zone-control-set",
  ".form-control.zone-control",
  ".classification-label",
  ".zone-label",
  ".ramp-palette"
];

var bubbleControlSelectors = [
  ".bubble-control-label",
  ".bubble-control-set",
  ".form-control.bubble-control",
  ".bubble-control",
  // Need below because color picker replaces DOM element
  ".bar-chart-map__control-grid .sp-replacer"
];

var hideZonesStyle = document.createElement("style");
var hideBubblesStyle = document.createElement("style");

hideZonesStyle.appendChild(document.createTextNode(""))
hideBubblesStyle.appendChild(document.createTextNode(""))

document.head.appendChild(hideZonesStyle);
document.head.appendChild(hideBubblesStyle);

setUpStyleSheet(hideZonesStyle.sheet, zoneControlSelectors);
setUpStyleSheet(hideBubblesStyle.sheet, bubbleControlSelectors);

hideBubblesStyle.disabled = true;

function toggleBubbleControls(boolean) {
  // it's the same function, just flipped
  toggleZoneControls(!boolean);
}

function toggleZoneControls(boolean) {
  hideZonesStyle.disabled = boolean;
  hideBubblesStyle.disabled = !boolean;
}

function setUpStyleSheet(sheet, selectors) {
  var ruleIndex = 0;
  for (var selector of selectors) {
    sheet.insertRule(selector + " { display: none; }", ruleIndex);
    ruleIndex++;
  }

}

function applyToNodeList(nodeList, fn) {
  let i = 0; i < nodeList.length; i++
  for (let domNode of nodeList) {
    fn(domNode);
  }
}
