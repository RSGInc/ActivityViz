//encapsulate all code within a IIFE (Immediately-invoked-function-expression) to avoid polluting global namespace
//global object barchart_and_map will contain functions and variables that must be accessible from elsewhere
var POIMap = {
  pointofinterest_and_map: function pointofinterest_and_map(id, indx) {
    "use strict";
    var map;
    var circleStyle = {
      stroke: false,
      fillColor: "set by updateBubbles",
      fillOpacity: 1.0
    };
    var chartData = null;
    var region = abmviz_utilities.GetURLParameter("region");
    var dataLocation = localStorage.getItem(region);
    var url = dataLocation + abmviz_utilities.GetURLParameter("scenario");

    /**
     * TODO
     * In the commit where I add this comment I realized that "scenario" is being
     * set globally, since it was undefined in this file but the tab still
     * worked. In the future, this global should be removed, but that would mean
     * going through the whole site and finding every place it is used, which is
     * out of scope for this change. The least I can do here is make its definition
     * explicit in this file.
     */
    var scenario = abmviz_utilities.GetURLParameter("scenario");

    var fileName = "PointofInterest.csv";
    var chartSelector = "#" + id + "-chart";
    var svgChart;
    var showChartOnPage = true;
    var CENTER_LOC = [];
    var SCENARIO_FOCUS = false;
    var focusColor = "black";
    var ROTATELABEL = 0;
    var BARSPACING = 0.2;
    var showCycleTools = true;
    var highlightLayer;
    var highlightBoxes;
    var showChartOnPage = $("#" + id + "-chart").children().length == 0;
    var tabSelector = "#" + id + "_id";
    var pageTitle = $(tabSelector + " .page-title");
    var pointNameCol;
    var maxFeature;
    var circleMarkers;
    var groupColumn;
    var selectedGroup;
    var scenarioPolyFile;
    var highlightLayer;
    var selectedDataGrp;
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
    var latColumn;
    var lngColumn;
    var poiData;
    var chartData = null;
    var svgChart;
    var bubblesShowing = true;
    var bubbleColor = "rgba(255, 120, 0, 0.5)";
    var pointColor = "#ff7800";
    var groupsSet;
    var focusLayer;
    var groupArry = [];
    var extNvd3Chart;
    var enabledGroups;
    var minBarWidth = 1;
    var minBarSpacing = 1;
    var marginTop = 0;
    var marginBottom = 50;
    var marginLeft = 175;
    var marginRight = 50;
    var valueCols = [];
    var CSS_UPDATE_PAUSE = 150;
    var bubbleLayer;
    var myZoom = {};
    var circlesLayerGroup;
    var barsWrap;
    var barsWrapRect;
    var barsWrapRectHeight;
    var barsWrapRectId = id + "-barsWrapRectRSG";
    var barsWrapRectSelector = "#" + barsWrapRectId;
    var filterColumn;
    var filterSet;
    var pointSet;
    var currentCounty = "";
    var maxLabelLength = 0;
    var paletteRamps = d3.selectAll("#" + id + " .ramp");
    var pointsAll = [];
    var controlLayer;

    //start off chain of initialization by reading in the data
    function readInDataCallback() {
      createMap(function() {
        console.log("createMap for POI callback");
      });
      setDataSpecificDOM();
      svgChart = d3.select(chartSelector);
      //updateCurrentTripModeOrClassification();
      createEmptyChart();
      initializeMuchOfUI();
    } //end readInDataCallback
    getConfigSettings(function() {
      readInData(function() {
        readInDataCallback();
      });
    });

    function getConfigSettings(callback) {
      if (showChartOnPage) {
        $.getJSON(dataLocation + "region.json", function(data) {
          var configName = "Default";

          if (data["scenarios"][scenario].visualizations != undefined) {
            var thisPOIMap =
              data["scenarios"][scenario].visualizations["POIMap"][indx];

            if (thisPOIMap.file) {
              fileName = thisPOIMap.file;
            }

            if (thisPOIMap.config) {
              configName = thisPOIMap.config;
            }

            if (thisPOIMap.info) {
              var infoBox;
              infoBox = thisPOIMap.info;
              $("#" + id + "-div span.glyphicon-info-sign").attr(
                "title",
                infoBox
              );
              $("#" + id + '-div [data-toggle="tooltip"]').tooltip();
            }

            if (thisPOIMap.datafilecolumns) {
              var datacols = thisPOIMap.datafilecolumns;
              $.each(datacols, function(key, value) {
                $("#" + id + "-datatable-columns").append(
                  "<p>" + key + ": " + value + "</p>"
                );
              });
            }

            if (thisPOIMap.title) {
              pageTitle.html(thisPOIMap.title);
            }
          }

          var configSettings = data["POIMap"][configName];
          //go through region level settings
          $.each(data, function(key, val) {
            if (key == "CenterMap") CENTER_LOC = val;
          });
          //go through scenario config level settings
          if (data["scenarios"][scenario]["ScenarioFocus"] != undefined) {
            SCENARIO_FOCUS = true;
            scenarioPolyFile = data["scenarios"][scenario]["ScenarioFocus"];
            $("#poi-by-group-tools").append(
              "<label class=\"poi-focus-label\">Focus</label><input type='text' id='" +
                id +
                "-focus-color' style='display: none;' >"
            );
          }

          $.each(configSettings, function(opt, value) {
            if (opt == "RotateLabels") {
              ROTATELABEL = value;
            }
            if (opt == "BarSpacing") {
              BARSPACING = value;
            }
            if (opt == "LegendTitle") {
              $("#" + id + "-div .legendtitle").html(value);
            }
            if (opt == "CenterMap") {
              CENTER_LOC = value;
            }
          });
        }).complete(function() {
          if (url.indexOf(fileName) == -1) {
            url += "/" + fileName;
          }
          callback();
        });
      } else {
        return;
      }
    }

    function createEmptyChart() {
      nv.addGraph({
        generate: function chartGenerator() {
          //console.log('chartGenerator being called. nvd3Chart=' + nvd3Chart);
          var colorScale = d3.scale.category20();
          var nvd3Chart = nv.models.multiBarHorizontalChart();
          if ($("#" + id + "-stacked").is(":checked")) {
            nvd3Chart = nv.models
              .multiBarHorizontalChart()
              .groupSpacing(BARSPACING);
          } else {
            nvd3Chart = nv.models.multiBarHorizontalChart();
          }
          //console.log('chartGenerator being called. nvd3Chart set to:' + nvd3Chart);
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
              left: Math.max(110, 110 + (maxLabelLength - 14) * 5),
              right: marginRight,
              top: marginTop,
              bottom: marginBottom
            })
            .id(id + "-chart-multiBarHorizontalChart")
            .stacked(true)
            .showControls(false);
          nvd3Chart.yAxis.tickFormat(d3.format(",.0f"));
          nvd3Chart.yAxis.axisLabel(
            groupColumn + " by " + $("#" + id + "-values-current").val()
          );
          //this is actually for xAxis since basically a sideways column chart
          nvd3Chart.xAxis.axisLabel(pointNameCol).axisLabelDistance(100);
          //this is actually for yAxis
          marginLeft = Math.max(110, 110 + (maxLabelLength - 14) * 5);
          nv.utils.windowResize(function() {
            //reset marginTop in case legend has gotten less tall
            nvd3Chart.margin({
              top: marginTop
            });
            //updateChart(function () {
            //	console.log('updateChart callback after windowResize');
            //});
          });
          nvd3Chart.legend.margin({ top: 0, right: 0, left: -75, bottom: 0 });
          nvd3Chart.legend.dispatch.on("legendDblclick", function(event) {
            var newTripMode = event.key;
            console.log("legend legendDblclick on trip mode: " + newTripMode);
            //$('#poi-by-group-current-trip-mode-zones').val(newTripMode);
            //updateCurrentTripModeOrClassification();
            redrawMap();
          });
          nvd3Chart.multibar.dispatch.on("elementMouseover", function(d, i) {
            var countyUnderMouse = d.value;
            changeCurrentCounty(countyUnderMouse);
          });

          return nvd3Chart;
        }, //end generate
        callback: function(newGraph) {
          console.log("nv.addGraph callback called");
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
    function updateChart(callback) {
      "use strict";
      updateChartNVD3(callback);
    }

    function readInData(callback) {
      "use strict";
      console.log("this is my poi");
      d3.csv(url, function(error, data) {
        "use strict";
        if (error) {
          $("#" + id + "-div").html(
            "<div class='container'><h3><span class='alert alert-danger'>Error: An error occurred while loading the Point of Interest Map data.</span></h3></div>"
          );
          throw error;
        }

        var headers = d3.keys(data[0]);
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
        pointNameCol = headers[0];
        filterColumn = headers[1];
        latColumn = headers[2];
        lngColumn = headers[3];
        groupColumn = headers[4];
        chartData = [];
        poiData = {};
        for (var i = 5; i < headers.length; i++) {
          valueCols.push(headers[i]);
        }

        groupsSet = new Set();
        console.log("this is my poi");
        pointSet = new Set();
        filterSet = new Set();
        data.forEach(function(d) {
          var pointName = d[pointNameCol];
          var groupName = d[groupColumn];
          var pointLat = +d[latColumn];
          var pointLng = +d[lngColumn];
          var filterName = d[filterColumn];
          var dataRow = d;

          pointsAll.push(pointName);
          groupsSet.add(groupName);
          filterSet.add(filterName);
          if (poiData[pointName] == undefined) {
            poiData[pointName] = {
              LAT: pointLat,
              LNG: pointLng,
              pointfilter: filterName
            };
          }

          if (poiData[pointName][groupName] == undefined) {
            poiData[pointName][groupName] = [];
          }
          for (var i = 0; i < valueCols.length; i++) {
            var name = valueCols[i];
            var value = d[name];
            poiData[pointName][groupName].push({ name: name, value: +value });
          }

          if (!pointSet.has(pointName)) {
            maxLabelLength = Math.max(maxLabelLength, pointName.length);
            pointSet.add(pointName);
            chartData.push({
              pointlabel: pointName,
              pointdata: poiData[pointName],
              pointfilter: filterName
            });
          }
        });

        // chartData.push(newPoiObject);
        groupsSet.forEach(function(D) {
          groupArry.push(D);
        });
        selectedGroup = groupArry[0];
        selectedDataGrp = valueCols[0];
        callback();
      }); //end d3.csv
    }

    function setDataSpecificDOM() {
      d3.selectAll("#" + id + "-div .poi-by-group-values").html("Point Value");
      d3.selectAll("#" + id + "-div .poi-by-group-group").html(pointNameCol);
      d3.selectAll("#" + id + "-div .poi-by-group-groups").html(
        "Point " + groupColumn
      );
      if (bubblesShowing) {
        $("#" + id + "-bubble-color").spectrum(
          bubblesShowing ? "enable" : "disable",
          true
        );

        $("#" + id + "-bubble-size").prop("disabled", !bubblesShowing);
      }

      if (filterSet.size > 1) {
        $("#" + id + "-filters").append(filterColumn);
        $("#" + id + "-filter-span").append(
          '<strong>Filter</strong> <select id="' +
            id +
            '-filters" style="width:150px;" multiple="multiple">Corridors </select>'
        );
        var cnt = 0;
        filterSet.forEach(function(filterName) {
          $("#" + id + "-filters").append(
            "<option>" + filterName + "</option>"
          );
        });
        $("#" + id + "-filters")
          .multiselect({
            includeSelectAllOption: true,
            numberDisplayed: 1,
            selectedClass: "multiselect-selected",
            onChange: function(option, checked) {
              createEmptyChart();
              redrawMap();
            },
            onSelectAll: function(option, checked) {
              createEmptyChart();
              redrawMap();
            }
          })
          .multiselect("selectAll", false)
          .multiselect("updateButtonText");
      }
      //d3.selectAll(".poi-by-group-trip-mode-bubbles").html("Bubbles");
      //d3.selectAll(".poi-by-group-trip-mode-example").html(modes[0]);
      valueCols.forEach(function(modeName) {
        $("#" + id + "-values-current").append(
          "<option>" + modeName + "</option>"
        );
      });
      groupArry.forEach(function(groupName) {
        $("#" + id + "-groups-current").append(
          "<option>" + groupName + "</option>"
        );
      });

      d3.selectAll("#" + id + "-div .poi-by-group-type").html(
        $("#" + id + "-values-current").val()
      );

      $("#" + id + "-values-current").change(function() {
        selectedDataGrp = $("#" + id + "-values-current").val();
        createEmptyChart();
        redrawMap();
        d3.selectAll("#" + id + "-div .poi-by-group-type").html(
          $("#" + id + "-values-current").val()
        );
      });
      $("#" + id + "-groups-current").change(function() {
        selectedGroup = $("#" + id + "-groups-current").val();
        d3.selectAll("#" + id + "-div .poi-by-group-type").html(
          $("#" + id + "-values-current").val()
        );
        redrawMap();
      });
    }

    function createMap(callback) {
      if (map !== undefined) {
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
        console.log("zoomLevel: ", zoomLevel, " zoomScale: ", zoomScale);
      });
      console.log("create map poi");

      var baseMaps = {
        Grayscale: tonerLayer,
        Aerial: Esri_WorldImagery
      };
      controlLayer = L.control.layers(baseMaps).addTo(map);

      if (scenarioPolyFile != undefined) {
        $.getJSON(dataLocation + scenario + "/" + scenarioPolyFile, function(
          scenarioTiles
        ) {
          "use strict";

          focusLayer = L.geoJSON(scenarioTiles, {
            style: styleFocusGeoJSONLayer
          });
          focusLayer.addTo(map);
          focusLayer.bringToBack();
        }).complete(function() {
          controlLayer.addOverlay(focusLayer, "Focus");
        });
      }
      redrawMap();
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

    function redrawMap() {
      highlightBoxes = [];
      circleMarkers = [];
      if (circlesLayerGroup != undefined) {
        map.removeLayer(circlesLayerGroup);
      }
      if (highlightLayer != undefined) {
        map.removeLayer(highlightLayer);
      }

      highlightLayer = new L.FeatureGroup();
      circlesLayerGroup = new L.LayerGroup();
      circlesLayerGroup.clearLayers();
      highlightLayer.clearLayers();
      var selectedData = selectedDataGrp;
      var polyLayers = [];
      var selectedGrping;
      var currentPoint;
      var prevPoint;
      pointsAll.forEach(function(d) {
        var dataSelected = poiData[d][selectedGroup];
        dataSelected.forEach(function(d) {
          if (d.name == selectedData) {
            selectedGrping = d;
          }
        });
        currentPoint = d;
        if (currentPoint != prevPoint) {
          var tooltipval = selectedGrping;
          var zoomLevel = map.getZoom();
          var diff = myZoom.start - zoomLevel;

          var circleMarker = L.circleMarker(
            L.latLng(poiData[d].LAT, poiData[d].LNG),
            circleStyle
          ).bindPopup(
            "<div  ><table style='width:100%;'><thead><tr><td colspan='3'><strong class='x-value'>" +
              d +
              "</strong></td></tr></thead><tbody><tr><td class='key'><strong>Group</strong>: " +
              selectedGroup +
              " " +
              "</td></tr><tr><td class='value'> <strong>Value</strong>: " +
              tooltipval.value.toLocaleString() +
              "</td></tr></tbody></table></div>",
            {
              minWidth: 130,
              maxWidth: 250
            }
          );
          circleMarker.on("mouseover", function(e) {
            var currentGrp = $("#" + id + "-groups-current").val();
            var fullString = currentGrp;

            if (currentGrp.length > 20) {
              currentGrp = currentGrp.substring(0, 20) + "...";
            }
            var color = $(
              "#" + id + '-chart text:contains("' + currentGrp + '")'
            ).siblings("circle")[0].style.fill;
            var name = e.target.properties.NAME;
            var value = e.target.myData;
            //remove the tooltip and then recreate template tooltip because we are trying to mimic the barchart tooltip
            $("div.nvtooltip table").remove();
            if ($("div.nvtooltip table").length == 0) {
              $("div.nvtooltip ").append(
                '<table><thead><tr><td colspan="3"><strong class="x-value"></strong></td></tr></thead><tbody><tr><td class="legend-color-guide"><div style="background-color: rgb(255, 187, 120);"></div></td><td class="key"></td><td class="value"></td></tr></tbody></table>'
              );
            }
            $("div.nvtooltip strong.x-value").text(name);
            $("div.nvtooltip td.key").text(
              $("#" + id + "-groups-current").val()
            );
            $("div.nvtooltip td.value").text(value.toLocaleString());
            $("div.nvtooltip").css("opacity", 1);
            var element = $('g.tick text:contains("' + name + '")')[0];
            var bodyRect = document.body.getBoundingClientRect(),
              elemRect = element.getBoundingClientRect(),
              offset = elemRect.top - bodyRect.top;
            //console.log(elemRect); console.log(offset);
            $("div.nvtooltip").css(
              "transform",
              "translate(" + elemRect.x + "px," + elemRect.y + "px)"
            );
            $("div.nvtooltip td.legend-color-guide div").css(
              "background-color",
              color
            );
            this.openPopup();
          });
          circleMarker.on("mouseout", function(e) {
            $("div.nvtooltip").css("opacity", 0);
            this.closePopup();
          });
          circleMarker.myData = tooltipval.value;
          circleMarker.pointFilter = poiData[d].pointfilter;
          circleMarker.properties = {};
          circleMarker.properties["NAME"] = d;
          // circleMarkers.push(circleMarker);

          var checkedfilters = $("#" + id + "-filters").val();
          var showThis = false;
          if (checkedfilters != undefined && filterSet.size > 1) {
            checkedfilters.forEach(function(name) {
              var filtername = name;
              if (filtername == poiData[d].pointfilter) {
                showThis = true;
              }
            });
          } else {
            showThis = true;
          }
          if (showThis) {
            circleMarkers.push(circleMarker);
          }

          //circle.removeFrom(map);
          prevPoint = currentPoint;
        }
      });
      for (var i = 0; i < highlightBoxes.length; i++) {
        highlightLayer.addLayer(highlightBoxes[i]);
      }

      circlesLayerGroup = L.layerGroup(circleMarkers);
      if (bubblesShowing) {
        circlesLayerGroup.addTo(map);

        updateBubbleColor();
        updateBubbleSize();
      } else {
        map.addLayer(highlightLayer);
      }
      if (focusLayer != undefined) {
        focusLayer.bringToBack();
        focusLayer.setStyle(styleFocusGeoJSONLayer);
      }
    }

    function ColorLuminance(hex, lum) {
      // validate hex string
      hex = String(hex).replace(/[^0-9a-f]/gi, "");
      if (hex.length < 6) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
      }
      lum = lum || 0;
      // convert to decimal and change luminosity
      var rgb = "#",
        c,
        i;
      var noPound = "";
      for (i = 0; i < 3; i++) {
        c = parseInt(hex.substr(i * 2, 2), 16);
        c = Math.round(Math.min(Math.max(0, c + c * lum), 255)).toString(16);
        rgb += ("00" + c).substr(c.length);
        noPound += ("00" + c).substr(c.length);
      }

      return noPound == hex ? ColorLuminance(rgb, -0.5) : rgb;
    }

    function initializeMuchOfUI() {
      $("#" + id + "-stacked").click(function() {
        extNvd3Chart.stacked(this.checked);
        var test = extNvd3Chart.groupSpacing();
        if (this.checked) {
          extNvd3Chart.groupSpacing(BARSPACING);
        } else {
          extNvd3Chart.groupSpacing(0.2);
        }
        extNvd3Chart.update();
      });
      $("#" + id + "-focus-color").spectrum({
        color: focusColor,
        showInput: true,
        className: "full-spectrum focus-colorpicker",
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
      if (bubblesShowing) {
        updateMapUI();
      }

      function updateMapUI() {
        // bubblesShowing = $("#poi-by-group-bubbles").is(":checked");
        console.log("updateBubbles: bubblesShowing=" + bubblesShowing);
        console.log(
          '$("#' +
            id +
            '-bubble-size").prop("disabled"): ' +
            $("#" + id + "-bubble-size").prop("disabled")
        );
        $("#" + id + "-bubble-color").spectrum(
          bubblesShowing ? "enable" : "disable",
          true
        );

        $("#" + id + "-bubble-size").prop("disabled", !bubblesShowing);
        console.log(
          '$("#' +
            id +
            '-bubble-size").prop("disabled"): ' +
            $("#" + id + "-bubble-size").prop("disabled")
        );
        if (bubblesShowing) {
          updateBubbleColor();
          updateBubbleSize();
          circlesLayerGroup.addTo(map);

          map.removeLayer(highlightLayer);
        } else {
          map.addLayer(highlightLayer);
          circlesLayerGroup.removeFrom(map);
        }
      }

      $("#" + id + "-point-size").change(updatePointSize);
      $("#" + id + "-bubble-size").change(updateBubbleSize);
      $("#" + id + "-legend-type").click(function() {
        extNvd3Chart.legend.vers(this.checked ? "classic" : "furious");
        extNvd3Chart.update();
      });
      var colorRamps = paletteRamps.on("click", function(d, i) {
        setColorPalette(i);

        //add delay to redrawMap so css has change to updates
        setTimeout(redrawMap, CSS_UPDATE_PAUSE);
      }); //end on click for ramp/palette
      //Logic fr cycling through the maps
      //end
      $("#" + id + "-current-trip-mode-bubbles").change(function() {
        updateCurrentTripModeOrClassification();
        redrawMap();
      });

      $("#" + id + "-classification").change(function() {
        //updateCurrentTripModeOrClassification();
        redrawMap();
      });
      $("#" + id + "-bubble-color").spectrum({
        color: bubbleColor,
        showInput: true,
        className: "full-spectrum bubble-colorpicker",
        showInitial: true,
        showPalette: true,
        showAlpha: true,
        showSelectionPalette: true,
        maxSelectionSize: 10,
        preferredFormat: "hex",
        localStorageKey: "spectrum.demo",
        clickoutFiresChange: true,
        palette: palette,
        hide: function(color) {
          if (color != bubbleColor) {
            bubbleColor = color;
            console.log(
              "bubble-color spectrum hide called with color:" + color
            );
            updateBubbleColor();
          }
        },
        //move is called for all color changes within picker
        move: function(color) {
          if (color != bubbleColor) {
            bubbleColor = color;
            console.log(
              "bubble-color spectrum move called with color:" + color
            );
            updateBubbleColor();
          }
        }
      });

      $("#" + id + "-point-color").spectrum({
        color: pointColor,
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
        // 				console.log("bubble-color spectrum change called with color:" + color);
        // 				bubbleColor = color;
        // 				updateBubbleColor();
        // 			},
        hide: function(color) {
          if (color != pointColor) {
            pointColor = color;
            console.log("point-color spectrum hide called with color:" + color);
            redrawMap();
          }
        },
        //move is called for all color changes within picker
        move: function(color) {
          if (color != pointColor) {
            pointColor = color;
            console.log("point-color spectrum move called with color:" + color);
            redrawMap();
          }
        }
      });
      //initialize the map palette
      // setColorPalette(selectedColorRampIndex);
      $("#" + id + "-checkboxes").change(function() {
        redrawMap();
      });
      updateChart(function() {
        console.log("updateChart callback after initialize");
      });
    }

    function setColorPalette(clickedIndex) {
      console.log("DO NOTHING");
    } //end setColorPalette
    function updateBubbleColor() {
      "use strict";
      var styleObject = {
        fillColor: bubbleColor
      };
      circleMarkers.forEach(function(circleMarker) {
        circleMarker.setStyle(styleObject);
      });
    }

    function updatePointSize() {
      redrawMap();
    }

    function updatePointColor() {
      "use strict";
      var styleObject = {
        fillColor: pointColor
      };
      highlightBoxes.forEach(function(highlightBox) {
        highlightBox.setStyle(styleObject);
      });
    }

    function updateBubbleSize() {
      var mapCenter = map.getCenter();
      var eastBound = map.getBounds().getEast();
      var centerEast = L.latLng(mapCenter.lat, eastBound);
      var bubbleMultiplier = parseInt($("#" + id + "-bubble-size").val());
      var mapBounds = d3
        .select("#" + id + "-map")
        .node()
        .getBoundingClientRect();
      var mapRadiusInPixels = mapBounds.width / 2;
      var maxBubbleRadiusInPixels = mapRadiusInPixels / 50;
      var maxBubbleSize = bubbleMultiplier * maxBubbleRadiusInPixels;
      var dataSeries = [];
      var selectedDataName = $("#" + id + "-values-current").val();
      pointsAll.forEach(function(d) {
        var dataSelected = poiData[d][selectedGroup];
        dataSelected.forEach(function(d) {
          if (d.name == selectedDataName) {
            dataSeries.push(d.value);
          }
        });
      });
      var serie = new geostats(dataSeries);
      maxFeature = serie.max();
      var scaleSqrt = d3.scale
        .sqrt()
        .domain([0, maxFeature])
        .range([0, maxBubbleSize]);
      circleMarkers.forEach(function(circleMarker) {
        var myData = circleMarker.myData;
        var sqrtRadius = 0;
        var quantity = myData;
        var sqrtRadius = scaleSqrt(quantity);

        circleMarker.setRadius(sqrtRadius);
      });
    }

    function updateChartNVD3(callback) {
      "use strict";
      //nvd3 expects data in the opposite hierarchy than rest of code so need to create
      //but can also filter out counties at same time
      //NOTE: ability to enable/disable counties  removed from UI so currently never used.
      var checkedfilters = $("#" + id + "-filters").val();
      var enabledGroups = chartData.filter(function(D) {
        var showThis = false;
        if (checkedfilters != undefined && filterSet.size > 1) {
          checkedfilters.forEach(function(name) {
            var filtername = name;

            if (filtername == D.pointfilter) {
              showThis = true;
            }
          });
        } else {
          showThis = true;
        }
        return showThis;
      });
      var selectedValues = selectedDataGrp;
      var selectedGrp = selectedGroup;

      var hierarchicalData = [];
      groupArry.forEach(function(modeName, modeIndex) {
        var subgroups = [];
        var modeObject = {
          key: modeName,
          values: subgroups
        };
        hierarchicalData.push(modeObject);
        enabledGroups.forEach(function(countyWithModesObject) {
          var simpleModeObject = countyWithModesObject.pointdata[
            modeName
          ].filter(function(obj) {
            return obj.name == selectedValues;
          });
          var retrievedModeName = simpleModeObject.pointlabel;
          //if (retrievedModeName != modeName) {
          //	throw ("SOMETHING IS WRONG. Mode is not as expected. Expected mode: " + modeName + ", found modeName: " + retrievedModeName);
          //}
          var simpleCountyObject = {
            label: countyWithModesObject.pointlabel,
            value: simpleModeObject[0].value
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
          extNvd3Chart.legend.width(700);
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
              var pointarry = Array.from(new Set(pointSet));
              var numCounties = pointarry.length;
              var heightPerGroup = barsWrapRectHeight / numCounties;
              var countyIndex = Math.floor(mouseY / heightPerGroup);
              var countyObject = pointarry[countyIndex];
              var newCounty = countyObject;
              changeCurrentCounty(newCounty);
            });
          setTimeout(updateChartMouseoverRect, 1000);
        },
        function() {
          throw "something is wrong -- extNvd3Chart still doesn't exist after polling ";
        }
      );
      //end call to poll
      console.log("we are at the callback");
      callback();
    } //end updateChartNVD3
    function updateChartMouseoverRect() {
      var shownTabs = $('li[role="presentation"]').children(":visible");
      if (
        shownTabs.length == 0 ||
        ($('li[role="presentation"]').children(":visible").length > 1 &&
          $("#thenavbar li.active").text() === "Points of Interest")
      ) {
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
            console.log(
              "barsWrap setting  width=" +
                width +
                ", height=" +
                barsWrapRectHeight
            );
            barsWrap
              .select(barsWrapRectSelector)
              .attr("width", width)
              .attr("height", 20);
            tryAgain = false;
          }
        }
        //end if innerContainerNode exists
        if (tryAgain) {
          console.log(
            "updateChartMouseoverRect called but innerContainerNode is null so will try again shortly"
          );
          setTimeout(updateChartMouseoverRect, 500);
        }
      }
    }

    //end updateChartMouseoverRect
    function changeCurrentCounty(newCurrentCounty) {
      if (currentCounty != newCurrentCounty) {
        console.log(
          "changing from " + currentCounty + " to " + newCurrentCounty
        );
        currentCounty = newCurrentCounty;
        var countyLabels = d3.selectAll(
          ".nvd3.nv-multiBarHorizontalChart .nv-x text "
        );
        countyLabels.classed(id + "-current-poi", function(d, i) {
          var setClass = d == currentCounty;
          return setClass;
        });
        //end classed of group rect
        if (bubblesShowing) {
          circlesLayerGroup.eachLayer(function(feature) {
            var style = {};
            if (feature.properties.NAME == currentCounty) {
              style.weight = 6;
              style.fillColor = ColorLuminance(feature.options.fillColor, 0.5);
              feature.openPopup();
            } else {
              style.fillColor = bubbleColor;
              style.weight = 4;
              feature.closePopup();
            }
            feature.setStyle(style);
            //return (style);
          });
        } else {
          highlightLayer.eachLayer(function(feature) {
            var style = {};
            if (feature.properties.NAME == currentCounty) {
              style.weight = 6;
              style.color = ColorLuminance(pointColor, 0.5);
              feature.openPopup();
              //style.fillColor ="green";
            } else {
              style.color = pointColor;
              style.weight = 4;
              feature.closePopup();
            }
            feature.setStyle(style);
            //return (style);
          });
        }
        //end setStyle function
        //add delay to redrawMap so that text has chance to bold
        //setTimeout(redrawMap, CSS_UPDATE_PAUSE);
      }
      //end if county is changing
    } //end change currentCounty
    function updateOutline() {
      redrawMap();
    }

    //return only the parts that need to be global
    return {
      updateOutline: updateOutline
    };
  }
};
