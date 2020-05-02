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
  var showAsVertical = options.showAsVertical;
  var showAsGrouped = options.showAsGrped;
  var BARSPACING = showAsGrouped ? options.barSpacing : 0.2;
  var thisTabSelector = "#" + divid + "_id";
  var thisTab = $(thisTabSelector);
  var barsWrapRectId = divid + "-barsWrapRectRSG";
  var barsWrapRectSelector = "#" + barsWrapRectId;

  var chartConfig = getChartConfig(options);

  function getChartConfig(options, maxTextWidth) {
    var yAxisTextElements = document.querySelectorAll(
      thisTabSelector + " .nv-axis.nv-y text"
    );

    var xAxisTextElements = document.querySelectorAll(
      thisTabSelector + " .nv-axis.nv-x .tick text"
    );

    var maxY = getMaxElementDimensions(yAxisTextElements);
    var maxX = getMaxElementDimensions(xAxisTextElements);

    let marginLeft = 150;
    if (options.showAsVertical) {
      const marginBottom = maxX.height ? maxX.height + 40 : 130,
        marginRight = 20;

      return {
        maxTextWidth,
        maxXHeight: maxX.height,
        barOffset: 0,
        yAxisLabelDistance: 50,
        xAxisLabelDistance: marginBottom - 20,
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
    var maxXWidth = maxX.width ? maxX.width : 50;

    marginLeft = maxXWidth * 1.2 + 60;
    var xAxisLabelDistance = maxXWidth + 10;

    return {
      maxTextWidth,
      maxXWidth,
      maxXHeight: maxX.height,
      barOffset: -marginLeft,
      yAxisLabelDistance: 0,
      xAxisLabelDistance: xAxisLabelDistance,
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

  createEmptyChart();

  function updateChart() {
    // render twice. once to draw all the elements,
    // and once after we query the widths or heights
    // of the labels and resize the chart. This is to
    // ensure that none of the labels get cut off because
    // they are too long.

    drawChart(data, extNvd3Chart);
    chartConfig = getChartConfig(options);
    extNvd3Chart.margin(chartConfig.margins);
    drawChart(data, extNvd3Chart);

    // Hack necessary because NVD3 has no idea how to position
    // axis labels
    var xAxisLabels;
    if (!options.showAsVertical) {
      // if showAsVertical is false, the X Axis will be the vertical axis, so
      // the label will need to be moved to the left, which will be negative y,
      // since being rotated 90 degrees, its top is facing to the left.
      xAxisLabels = document.querySelectorAll(
        thisTabSelector + " .nv-x .nv-axislabel"
      );
      for (let labelNode of xAxisLabels) {
        labelNode.setAttribute("y", -chartConfig.maxXWidth - 20);
      }
    } else {
      /**
       * Otherwise, it will be below the horizontal axis, where it will need a positive
       * value in order to move down on the page.
       */
      xAxisLabels = document.querySelectorAll(
        thisTabSelector + " .nv-x .nv-axislabel"
      );
      for (let labelNode of xAxisLabels) {
        labelNode.setAttribute("y", chartConfig.maxXHeight + 30);
      }
    }

    barsWrap = svgChart.select(".nv-barsWrap.nvd3-svg");
    if (barsWrap[0].length == 0) {
      throw "did not find expected part of chart";
    }

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

    abmviz_utilities.debounce(updateChartMouseoverRect, 300, true);
  }

  function drawChart(chartData, chart) {
    if (!chartData || !chart) {
      console.error("Data or Chart is undefined");
      return;
    }

    svgChart.datum(data).call(extNvd3Chart);
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
    }

    if (tryAgain) {
      setTimeout(updateChartMouseoverRect, 300);
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
      generate: getChartGenerator(chartConfig), //end generate
      callback: function(newGraph) {
        extNvd3Chart = newGraph;
        updateChart();
      }
    });
  }

  function getChart(vertical) {
    return vertical
      ? nv.models.multiBarChart().staggerLabels(false)
      : nv.models.multiBarHorizontalChart();
  }

  function getChartGenerator(chartConfig) {
    return function chartGenerator() {
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
        return options.showPercentages ? d.percentage : d.value;
      }

      function getXAxisLabels(d) {
        return d.label;
      }

      nvd3Chart.yAxis.tickFormat(
        options.showPercentages ? d3.format(".0%") : d3.format(",.0f")
      );

      nvd3Chart.yAxis
        .axisLabel(quantityColumn)
        .axisLabelDistance(chartConfig.yAxisLabelDistance);

      nvd3Chart.xAxis.axisLabel(mainGroupColumn);

      if (showAsVertical) {
        nvd3Chart.reduceXTicks(false);
      } //this is actually for yAxis

      nvd3Chart.legend.width(900);

      nvd3Chart.multibar.dispatch.on("elementMouseover", function(d) {
        var mainGroupUnderMouse = d.value;
        changeCurrentMainGroup(mainGroupUnderMouse);
      });

      nvd3Chart.legend.margin({ top: 10, right: 0, left: -10, bottom: 20 });

      if (options.rotateXLabels) {
        nvd3Chart.xAxis.rotateLabels(options.rotateXLabels);
      }

      return nvd3Chart;
    };
  }

  nv.utils.windowResize(function() {
    if (!thisTab.is(":visible")) {
      return;
    }

    updateChart();
  });

  //WARNING -- this canbe called more than once because of PIVOT reload kluge
  //end initializeMuchOfUI
  //return only the parts that need to be global
  return {};
}

/**
 * Takes a list of DOM nodes and returns an object with
 * the maximum height and maximum width of any node in that
 * list. Height and Width needn't be from the same node.
 * @param {NodeList} nodeList
 */
function getMaxElementDimensions(nodeList) {
  var maxElementDimensions = { height: 0, width: 0 };
  for (var node of nodeList) {
    var nodeHeight = node.getBoundingClientRect().height;
    var nodeWidth = node.getBoundingClientRect().width;
    maxElementDimensions = {
      height: Math.max(maxElementDimensions.height, nodeHeight),
      width: Math.max(maxElementDimensions.width, nodeWidth)
    };
  }
  return maxElementDimensions;
}
