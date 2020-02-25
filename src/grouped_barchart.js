//encapsulate all code within a IIFE (Immediately-invoked-function-expression) to avoid polluting global namespace
//global object grouped_barchart will contain functions and variables that must be accessible from elsewhere

function grouped_barchart(id, data, options, divid) {
  "use strict";
  var chartDataContainer = [];
  var chartData;
  var subGroupColumn = options.subGrpCol;
  var mainGroupColumn = options.mainGrpCol;
  var quantityColumn = options.quantCol;
  var mainGroupSet = options.mainGrpSet;
  var subGroupSet = options.subGrpSet;
  var chartSet;
  var region = abmviz_utilities.GetURLParameter("region");
  var dataLocation = localStorage.getItem(region);
  var chartSelector = "#" + divid + "_grouped-barchart";
  var svgChart;
  var extNvd3Chart;
  var minBarWidth = 2;
  var minBarSpacing = 1;
  var marginTopVert = 100;
  var marginLeftVert = 150;
  var marginRightVert = 20;
  var marginTop = 0;
  var marginBottom = 50;
  var marginRight = 50;
  var barsWrap;
  var barsWrapRect;
  var barsWrapRectHeight;
  var barsWrapRectWidth;
  var currentMainGroup;
  var chartWidth = options.chartWidth;
  var pivotData = options.pivotData;
  var showPercentages = options.showPercentages;
  var showAsVertical = options.showAsVertical;
  var showAsGrouped = options.showAsGrped;
  var maxVal = options.maxVal;
  var minVal = options.minVal;
  var ROTATELABEL = options.rotateLabel;
  var BARSPACING = showAsGrouped ? options.barSpacing : 0.2;
  var barsWrapRectId = divid + "-barsWrapRectRSG";
  var barsWrapRectSelector = "#" + barsWrapRectId;
  var showChartOnPage = true;

  const maxLabelLength = getMaxLength([options.mainGrpSet, options.subGrpSet]);
  var marginLeft = maxLabelLength * 10;
  var marginBottomVert = maxLabelLength * 10;
  console.log(maxLabelLength, marginLeft);

  /**
   * For an iterable of sets of strings, get the longest string in any set.
   * @param {Set[]} sets
   */
  function getMaxLength(sets) {
    let maxLength = 0;
    for (let set of sets) {
      for (let setElement of set.values()) {
        maxLength = Math.max(maxLength, setElement.length);
      }
    }
    return maxLength;
  }

  //start off chain of initialization by reading in the data
  svgChart = d3.select(id);
  //setDataSpecificDOM();
  createEmptyChart(runAfterChartCreated);
  //initializeMuchOfUI();

  //start off chain of initialization by reading in the data

  function runAfterChartCreated() {
    if ($("#" + divid + "-toggle-horizontal").prop("checked")) {
      $("#" + divid + "-div .nv-x .nv-axis text")
        .not(".nv-axislabel")
        .css("transform", "rotate(-90deg)")
        .css("text-anchor", "end")
        .attr("y", "-7");
    }
  }
  //end setDataSpecificDOM
  function updateChart(callback) {
    "use strict";
    updateChartNVD3(callback);
  }

  function updateChartNVD3(callback) {
    "use strict";
    //poll every 150ms for up to two seconds waiting for chart
    abmviz_utilities.poll(
      function() {
        return extNvd3Chart != undefined;
      },
      function() {
        svgChart.datum(data).call(extNvd3Chart);
        //create a rectangle over the chart covering the entire y-axis and to the left of x-axis to include mainGroup labels
        //first check if

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
          .attr("x", showAsVertical ? 0 : -marginLeft)
          .attr("fill-opacity", "0.0")
          .on("mousemove", function(event) {
            //console.log('barsWrap mousemove');
            if (showAsVertical) {
              var mouseX = d3.mouse(this)[0];
              var numMainGroups = mainGroupSet.size;
              var widthPerGroup = barsWrapRectWidth / numMainGroups;
              var mainGroupIndex = Math.floor(mouseX / widthPerGroup);
              var mainGroupObject = data[0].values[mainGroupIndex];
              var newMainGroup = mainGroupObject.label;
              changeCurrentMainGroup(newMainGroup);
            } else {
              var mouseY = d3.mouse(this)[1];
              var numMainGroups = mainGroupSet.size;
              var heightPerGroup = barsWrapRectHeight / numMainGroups;
              var mainGroupIndex = Math.floor(mouseY / heightPerGroup);
              var mainGroupObject = data[0].values[mainGroupIndex];
              var newMainGroup = mainGroupObject.label;
              changeCurrentMainGroup(newMainGroup);
            }
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
    var innerContainer = showAsVertical
      ? svgChart.select(".nvd3.nv-wrap.nv-multiBarWithLegend")
      : svgChart.select(".nvd3.nv-wrap.nv-multibarHorizontal");
    var innerContainerNode = innerContainer.node();
    var tryAgain = false;
    if (innerContainerNode != undefined) {
      var bounds = innerContainerNode.getBBox();
      var width =
        bounds.width +
        (showAsVertical ? -marginLeftVert - marginRightVert : marginLeft);
      barsWrapRectHeight = bounds.height;
      barsWrapRectWidth = width - (showAsVertical ? 0 : marginLeft);
      if (barsWrapRectHeight > 0) {
        console.log(
          "barsWrap setting  width=" + width + ", height=" + barsWrapRectHeight
        );
        barsWrap
          .select(barsWrapRectSelector)
          .attr("width", width)
          .attr("height", barsWrapRectHeight);
        tryAgain = false;
      }
      runAfterChartCreated();
    }
    //end if innerContainerNode exists
    if (tryAgain) {
      console.log(
        "updateChartMouseoverRect called but innerContainerNode is null so will try again shortly"
      );
      setTimeout(updateChartMouseoverRect, 500);
    }
  }
  //end updateChartMouseoverRect
  function changeCurrentMainGroup(newCurrentMainGroup) {
    if (currentMainGroup == newCurrentMainGroup) return;

    console.log(
      "changing from " + currentMainGroup + " to " + newCurrentMainGroup
    );

    currentMainGroup = newCurrentMainGroup;
    var mainGroupLabels = d3.selectAll("#" + divid + "-div .nv-x .tick text");
    if (showAsVertical)
      mainGroupLabels = d3.selectAll(
        "#" + divid + "-div .nv-x .tick foreignObject p"
      );
    mainGroupLabels.classed("selected", function(d, i) {
      var setClass = d == currentMainGroup;
      return setClass;
    });

    //end classed of group rect
    //end if mainGroup is changing
  } //end change currentMainGroup
  function createEmptyChart(callback) {
    nv.addGraph({
      generate: function chartGenerator() {
        //console.log('chartGenerator being called. nvd3Chart=' + nvd3Chart);
        var colorScale = d3.scale.category20();
        var nvd3Chart = nv.models.multiBarHorizontalChart();
        var obj = $(id + " .nv-controlsWrap .nv-legend-symbol")[0];
        var shwBarSpace = $(obj).css("fill-opacity") == 0;
        if (showAsVertical)
          nvd3Chart = nv.models
            .multiBarChart()
            .groupSpacing(shwBarSpace ? 0.2 : BARSPACING)
            .staggerLabels(false);
        else
          nvd3Chart = nv.models
            .multiBarHorizontalChart()
            .groupSpacing(shwBarSpace ? 0.2 : BARSPACING)
            .height(400);
        //xRange([0,125])
        //console.log('chartGenerator being called. nvd3Chart set to:' + nvd3Chart);

        nvd3Chart
          .x(function(d, i) {
            return d.label;
          })
          .y(function(d) {
            return showPercentages ? d.percentage : d.value;
          })
          .color(function(d, i) {
            var color = colorScale(i);
            //console.log('barColor i=' + i + ' columnsColorIndex=' + columnsColorIndex + ' columns=' + d.key + ' mainGroup=' + d.label + ' count=' + d.value + ' color=' + color);
            return color;
          })
          .duration(0)
          .margin({
            left: showAsVertical ? marginLeftVert : marginLeft,
            right: showAsVertical ? marginRightVert : marginRight,
            top: showAsVertical ? marginTopVert : marginTop,
            bottom: showAsVertical ? marginBottomVert : marginBottom
          })
          .id(divid + "-multiBarHorizontalChart")
          .stacked(showAsGrouped)
          .showControls(false);

        // if (maxVal != 0 && !showPercentages) {
        //   nvd3Chart.yDomain([minVal, maxVal]);
        //}
        nvd3Chart.yAxis.tickFormat(
          showPercentages ? d3.format(".0%") : d3.format(",.0f")
        );
        nvd3Chart.yAxis
          .axisLabel(quantityColumn)
          .axisLabelDistance(showAsVertical ? marginLeft - 200 : 0);
        //this is actually for xAxis since basically a sideways column chart
        //if(showAsVertical)
        // nvd3Chart.rotateLabels(-90);
        nvd3Chart.xAxis
          .axisLabel(mainGroupColumn)
          .axisLabelDistance(
            showAsVertical ? marginBottomVert - 60 : marginLeft - 85
          );

        if (showAsVertical) {
          nvd3Chart.reduceXTicks(false);
        } //this is actually for yAxis
        nvd3Chart.legend.width(900);
        nv.utils.windowResize(function() {
          //reset marginTop in case legend has gotten less tall
          nvd3Chart.margin({
            top: marginTop
          });
          updateChart(function() {
            console.log("updateChart callback after windowResize");
          });
        });

        nvd3Chart.multibar.dispatch.on("elementMouseover", function(d, i) {
          var mainGroupUnderMouse = d.value;
          changeCurrentMainGroup(mainGroupUnderMouse);
        });
        //furious has colored boxes with checkmarks
        //nvd3Chart.legend.vers('furious');
        nvd3Chart.legend.margin({ top: 10, right: 0, left: -75, bottom: 20 });

        // nvd3Chart.xAxis.rotateLabels(-90);

        return nvd3Chart;
      }, //end generate
      callback: function(newGraph) {
        console.log("nv.addGraph callback called");
        extNvd3Chart = newGraph;
        extNvd3Chart.dispatch.on("renderEnd", function(d, j) {
          if ($("#" + divid + "-toggle-horizontal").prop("checked")) {
            $("#" + divid + "-div .nv-x .nv-axis text")
              .not(".nv-axislabel")
              .css("transform", "rotate(-90deg)")
              .css("text-anchor", "end")
              .attr("y", "-7");
          }
        });

        updateChart(function() {
          console.log(
            "updateChart callback during after the nvd3 callback called"
          );
        });
      } //end callback function
    });
    //end nv.addGraph
  } //end createEmptyChart

  //WARNING -- this canbe called more than once because of PIVOT reload kluge
  //end initializeMuchOfUI
  //return only the parts that need to be global
  return {};
}
