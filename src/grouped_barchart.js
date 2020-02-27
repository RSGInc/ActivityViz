function grouped_barchart(id, data, options, divid) {
  "use strict";
  var mainGroupColumn = options.mainGrpCol;
  var quantityColumn = options.quantCol;
  var mainGroupSet = options.mainGrpSet;
  var svgChart;
  var extNvd3Chart;
  var barsWrap;
  var barsWrapRectHeight;
  var barsWrapRectWidth;
  var currentMainGroup;
  var showPercentages = options.showPercentages;
  var showAsVertical = options.showAsVertical;
  var showAsGrouped = options.showAsGrped;
  var BARSPACING = showAsGrouped ? options.barSpacing : 0.2;
  var barsWrapRectId = divid + "-barsWrapRectRSG";
  var barsWrapRectSelector = "#" + barsWrapRectId;

  var chartConfig = getChartConfig(options);

  function getChartConfig(options) {
    let marginLeft = 150;
    const maxLabelLength = getMaxLength([
      options.mainGrpSet,
      options.subGrpSet
    ]);

    if (options.showAsVertical) {
      const marginBottom = maxLabelLength * 10,
        marginRight = 20;

      return {
        barOffset: 0,
        yAxisLabelDistance: 50,
        xAxisLabelDistance: marginBottom - 60,
        innerContainer: {
          selector: ".nvd3.nv-wrap.nv-multiBarWithLegend",
          width: -marginLeft - marginRight,
          barsWrapRectWidth: 0
        },
        margins: {
          top: 100,
          bottom: marginBottom,
          left: marginLeft,
          right: marginRight
        }
      };
    }

    // If it is not vertical, return horizontal config as default.
    marginLeft = Math.max(maxLabelLength * 12, 120);
    return {
      barOffset: -marginLeft,
      yAxisLabelDistance: 0,
      xAxisLabelDistance: marginLeft - 95,
      innerContainer: {
        selector: ".nvd3.nv-wrap.nv-multibarHorizontal",
        width: marginLeft,
        barsWrapRectWidth: marginLeft
      },
      margins: {
        top: 0,
        bottom: 60,
        left: marginLeft,
        right: 50
      }
    };
  }

  svgChart = d3.select(id);
  createEmptyChart(runAfterChartCreated);

  function runAfterChartCreated() {
    if ($("#" + divid + "-toggle-horizontal").prop("checked")) {
      $("#" + divid + "-div .nv-x .nv-axis text")
        .not(".nv-axislabel")
        .css("transform", "rotate(-90deg)")
        .css("text-anchor", "end")
        .attr("y", "-7");
    }
  }

  function updateChart(callback) {
    "use strict";
    updateChartNVD3(callback);
  }

  function updateChartNVD3(callback) {
    "use strict";

    //poll every 150ms for up to two seconds waiting for chart
    abmviz_utilities.poll(nvd3ChartExists, drawBarGraph, handlePollError);

    callback();

    function nvd3ChartExists() {
      return extNvd3Chart != undefined;
    }

    function drawBarGraph() {
      svgChart.datum(data).call(extNvd3Chart);
      //create a rectangle over the chart covering the entire y-axis and to the left of x-axis to include mainGroup labels
      //first check if

      barsWrap = svgChart.select(".nv-barsWrap.nvd3-svg");
      if (barsWrap[0].length == 0) {
        throw "did not find expected part of chart";
      }

      //if first time (enter() selection) create rect
      //nv-barsWrap nvd3-svg
      barsWrap
        .selectAll(barsWrapRectSelector)
        .data([barsWrapRectId])
        .enter()
        .insert("rect", ":first-child")
        .attr("id", barsWrapRectId)
        .attr("x", chartConfig.barOffset)
        .attr("fill-opacity", "0.0")
        .on("mousemove", function() {
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
            numMainGroups = mainGroupSet.size;
            var heightPerGroup = barsWrapRectHeight / numMainGroups;
            mainGroupIndex = Math.floor(mouseY / heightPerGroup);
            mainGroupObject = data[0].values[mainGroupIndex];
            newMainGroup = mainGroupObject.label;
            changeCurrentMainGroup(newMainGroup);
          }
        });
      setTimeout(updateChartMouseoverRect, 1000);
    }

    function handlePollError() {
      throw "something is wrong -- extNvd3Chart still doesn't exist after polling ";
    }
  }

  function updateChartMouseoverRect() {
    var innerContainer = svgChart.select(chartConfig.innerContainer.selector);
    var innerContainerNode = innerContainer.node();
    var tryAgain = false;

    if (innerContainerNode) {
      var bounds = innerContainerNode.getBBox();
      var width = bounds.width + chartConfig.innerContainer.width;

      barsWrapRectHeight = bounds.height;
      barsWrapRectWidth = width - chartConfig.innerContainer.barsWrapRectWidth;

      if (barsWrapRectHeight > 0) {
        barsWrap
          .select(barsWrapRectSelector)
          .attr("width", width)
          .attr("height", barsWrapRectHeight);
        tryAgain = false;
      }

      runAfterChartCreated();
    }

    if (tryAgain) {
      setTimeout(updateChartMouseoverRect, 500);
    }
  }

  function changeCurrentMainGroup(newCurrentMainGroup) {
    if (currentMainGroup == newCurrentMainGroup) return;

    currentMainGroup = newCurrentMainGroup;
    var mainGroupLabels = d3.selectAll("#" + divid + "-div .nv-x .tick text");

    if (showAsVertical) {
      mainGroupLabels = d3.selectAll(
        "#" + divid + "-div .nv-x .tick foreignObject p"
      );
    }

    mainGroupLabels.classed("selected", function(d) {
      var setClass = d == currentMainGroup;
      return setClass;
    });
  }

  function createEmptyChart() {
    nv.addGraph({
      generate: chartGenerator, //end generate
      callback: function(newGraph) {
        extNvd3Chart = newGraph;
        extNvd3Chart.dispatch.on("renderEnd", function() {
          if ($("#" + divid + "-toggle-horizontal").prop("checked")) {
            $("#" + divid + "-div .nv-x .nv-axis text")
              .not(".nv-axislabel")
              .css("transform", "rotate(-90deg)")
              .css("text-anchor", "end")
              .attr("y", "-7");
          }
        });

        updateChart(function() {});
      }
    });
  }

  function getChart(vertical) {
    return vertical
      ? nv.models.multiBarChart().staggerLabels(false)
      : nv.models.multiBarHorizontalChart().height(400);
  }

  function chartGenerator() {
    var colorScale = d3.scale.category20();
    var obj = $(id + " .nv-controlsWrap .nv-legend-symbol")[0];
    var shwBarSpace = $(obj).css("fill-opacity") == 0;

    var nvd3Chart = getChart(showAsVertical).groupSpacing(
      shwBarSpace ? 0.2 : BARSPACING
    );

    nvd3Chart
      .x(getXAxisLabels)
      .y(getYAxisLabels)
      .color(getColorScale)
      .duration(0)
      .margin(chartConfig.margins)
      .id(divid + "-multiBarHorizontalChart")
      .stacked(showAsGrouped)
      .showControls(false);

    function getColorScale(d, i) {
      return colorScale(i);
    }

    function getYAxisLabels(d) {
      return showPercentages ? d.percentage : d.value;
    }

    function getXAxisLabels(d) {
      return d.label;
    }

    nvd3Chart.yAxis.tickFormat(
      showPercentages ? d3.format(".0%") : d3.format(",.0f")
    );

    nvd3Chart.yAxis
      .axisLabel(quantityColumn)
      .axisLabelDistance(chartConfig.yAxisLabelDistance);

    nvd3Chart.xAxis
      .axisLabel(mainGroupColumn)
      .axisLabelDistance(chartConfig.xAxisLabelDistance);

    if (showAsVertical) {
      nvd3Chart.reduceXTicks(false);
    } //this is actually for yAxis

    nvd3Chart.legend.width(900);
    nv.utils.windowResize(function() {
      //reset marginTop in case legend has gotten less tall
      nvd3Chart.margin({
        top: chartConfig.margins.top
      });
      updateChart(function() {
        console.log("updateChart callback after windowResize");
      });
    });

    nvd3Chart.multibar.dispatch.on("elementMouseover", function(d) {
      var mainGroupUnderMouse = d.value;
      changeCurrentMainGroup(mainGroupUnderMouse);
    });

    nvd3Chart.legend.margin({ top: 10, right: 0, left: -75, bottom: 20 });

    nvd3Chart.xAxis.rotateLabels(-90);

    return nvd3Chart;
  }
  //WARNING -- this canbe called more than once because of PIVOT reload kluge
  //end initializeMuchOfUI
  //return only the parts that need to be global
  return {};
}

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
