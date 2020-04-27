//encapsulate all code within a IIFE (Immediately-invoked-function-expression) to avoid polluting global namespace
//global object timeuse will contain functions and variables that must be accessible from elsewhere
var TimeuseChart = {
  timeuse: function timeuse(id, indx) {
    "use strict";
    var region = abmviz_utilities.GetURLParameter("region");
    var dataLocation = localStorage.getItem(region);
    var fileName = "TimeUseData.csv";
    var url = dataLocation + abmviz_utilities.GetURLParameter("scenario");
    var scenario = abmviz_utilities.GetURLParameter("scenario");
    var thisTab = $("#" + id + "_id");
    var svgSelector = "#" + id + "-chart svg";
    var svgElement = d3.select(svgSelector);
    var pageHeader = $("#" + id + "-maingroup");
    var extNvd3Chart;
    var legendBoxWidth = 240;
    var nodeVisuals;
    var legendRects;
    var legendTexts;
    var legendGroups;
    var chartData;
    var chartStyle = "expand";
    var showChartOnPage = true;
    var builtInPurposes = ["home", "work", "school", "other"];

    function getChartLeftMargin() {
      return chartStyle == "expand" ? 50 : 80;
    }

    // Dimensions of legend item: width, height, spacing, radius of rounded rect.
    var li = {
      h: 22,
      s: 15,
      r: 3
    };
    var personType = "ALL";

    function createTimeUse() {
      //read in data and create timeuse when finished
      if (chartData === undefined) {
        $.getJSON(dataLocation + "region.json", function(data) {
          var configName = "Default";
          if (data["scenarios"][scenario].visualizations != undefined) {
            var thisTimeUseChart =
              data["scenarios"][scenario].visualizations["TimeUse"][indx];
            if (thisTimeUseChart.file) {
              fileName = thisTimeUseChart.file;
            }
            if (thisTimeUseChart.config) {
              configName = thisTimeUseChart.config;
            }
            if (thisTimeUseChart.datafilecolumns) {
              var datacols = thisTimeUseChart.datafilecolumns;
              $.each(datacols, function(key, value) {
                $("#" + id + "-datatable-columns").append(
                  "<p>" + key + ": " + value + "</p>"
                );
              });
            }
            if (thisTimeUseChart.info) {
              var infoBox = thisTimeUseChart.info;
              $("#" + id + "-div span.glyphicon-info-sign").attr(
                "title",
                infoBox
              );
              $("#" + id + '-div [data-toggle="tooltip"]').tooltip();
            }
            if (thisTimeUseChart.title) {
              pageHeader.text(thisTimeUseChart.title);
            }
          }
        }).complete(function() {
          url += "/" + fileName;

          d3.text(url, function(error, data) {
            "use strict";
            var periods = new Set();
            var requiredOrigPurposesArray = [];
            var requiredOrigPurposesSet = new Set(requiredOrigPurposesArray);
            var requiredOrigPurposesFound = new Set();
            var nonRequiredOrigPurposesSet = new Set(); //js sets maintain insertion order https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set
            if (error) {
              $("#" + id + "-div").html("");
              //$('#timeuse').html("<div class='container'><h3><span class='alert alert-danger'>Error: An error occurred while loading the sunburst data.</span></h3></div>");
              throw error;
            }
            var headers = d3.csv.parseRows(data)[0];
            var csv = d3.csv.parseRows(data).slice(1);
            if (!$.fn.DataTable.isDataTable("#" + id + "-datatable-table")) {
              var columnsDT = [];
              $.each(headers, function(d, i) {
                columnsDT.push({ title: i });
                $("#" + id + "-datatable-div table thead tr").append(
                  "<th>" + i + "</th>"
                );
              });
              if (csv[0] == "") {
                //we have no data
                $("#" + id + "_id")
                  .parent("li")
                  .attr("disabled", "disabled");
                $("#" + id + "-div").html("");

                //$('#timeuse').html("<div class='container'><h3><span class='alert alert-danger'>Error: An error occurred while loading the sunburst data.</span></h3></div>");
                return;
              }
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
                data: csv,
                columns: columnsDT
              });
            }
            data = null; //allow memory to be GC'ed

            var rolledUpMap = d3
              .nest()
              .key(function(d) {
                return d[0]; //group by PERSON_TYPE
              })
              .key(function(d) {
                return d[2]; //secondary group by ORIG_PURPOSE
              })
              .key(function(d) {
                return d[1];
              })
              .rollup(function(d) {
                var timePeriod = +d[0][1];
                periods.add(timePeriod);
                var origPurpose = d[0][2];
                if (!nonRequiredOrigPurposesSet.has(origPurpose)) {
                  if (requiredOrigPurposesSet.has(origPurpose)) {
                    if (!requiredOrigPurposesFound.has(origPurpose)) {
                      requiredOrigPurposesFound.add(origPurpose);
                    }
                  } else {
                    //else not a required item
                    nonRequiredOrigPurposesSet.add(origPurpose);
                  }
                } //else already in nonRequiredSet
                return {
                  timePeriod: timePeriod,
                  quantity: +d[0][3]
                };
              })
              .map(csv);

            csv = null; //allow memory to be GC'ed
            //cannot simply use nest.entries because there may be missing data (for example: CHILD_TOO_YOUNG_FOR_SCHOOL does not have a WORK ORIG_PURPOSE)
            //rolledUpData = makeNest.entries(csv);
            //var reorderedArray = [];
            //re-order so the starts with WORK, SCHOOL and ends with HOME
            abmviz_utilities.assert(
              requiredOrigPurposesSet.size == requiredOrigPurposesFound.size,
              "ORIG_PURPOSE must contain WORK, SCHOOL, and HOME but only found these ones: " +
                Array.from(requiredOrigPurposesFound)
            );
            var origPurposesArray = Array.from(requiredOrigPurposesArray);
            //insert non-reqired items between SCHOOL and HOME
            abmviz_utilities.insertArrayAt(
              origPurposesArray,
              1,
              Array.from(nonRequiredOrigPurposesSet)
            );
            var personTypes = Object.keys(rolledUpMap);
            //convert data to format nvd3 expects it
            //populate drop down of all person -types
            drawLegend(personTypes);
            chartData = {};
            personTypes.forEach(function(personType) {
              chartData[personType] = getPersonTypeChartData(personType);
            });

            function getPersonTypeChartData(personType) {
              var rolledUpPersonTypeMap = rolledUpMap[personType];
              abmviz_utilities.assert(
                rolledUpPersonTypeMap != null,
                "rolledUpMap[personType] not found for personType: " +
                  personType
              );
              var personTypeChartData = [];
              origPurposesArray.forEach(function(origPurpose) {
                var personTypesOrigPurposeArray =
                  rolledUpPersonTypeMap[origPurpose];
                if (personTypesOrigPurposeArray == undefined) {
                  //missing data (for example: CHILD_TOO_YOUNG_FOR_SCHOOL does not have a WORK ORIG_PURPOSE)
                  //make an empty item to use to fill in personTypes that are missing data
                  personTypesOrigPurposeArray = {};
                  //console.log('Person type "' + personType + '" missing data for purpose: ' + origPurpose);
                }
                var periodDataArray = [];
                //must make sure data has all periods since nvd3 picky
                periods.forEach(function(period) {
                  var periodDataObject = personTypesOrigPurposeArray[period];
                  //if period missing from data, create it
                  if (periodDataObject == undefined) {
                    periodDataObject = {
                      timePeriod: period,
                      quantity: 0
                    };
                    /* 								if (personTypeOrigPurposeExists) */
                    //console.log('Person type "' + personType + '" "' + origPurpose + '" missing data for period: ' + period);
                  }
                  periodDataArray.push(periodDataObject);
                }); //end loop over periods
                personTypeChartData.push({
                  key: origPurpose,
                  values: periodDataArray
                });
              }); //end loop over origPurposes
              return personTypeChartData;
            } //end getPersonTypeChartData
            console.log("timeuse finished reading data");
            createEmptyChart(updateChart);
          }); //end d3.text
        });
      } //end if chartData === undefined
      else {
        //if just a window resize, don't re-read data
        createEmptyChart(updateChart);
      }

      function turnOffAreaClick() {
        //nvd3 allows a single series to be shown but not helpful. Need to disable both double click in legend and click in area
        //Way to disable toggle found in: https://github.com/novus/nvd3/issues/590 in comment by liquidpele
        extNvd3Chart.stacked.dispatch.on("areaClick.toggle", function(e) {
          console.log("ignoring chart areaClick.toggle dispatched.");
        });
        extNvd3Chart.stacked.dispatch.on("areaClick", function(e) {
          console.log("ignoring chart areaClick dispatched.");
        });
      }

      //because of a bug in nvd3 #1814 https://github.com/novus/nvd3/issues/1814
      //we must remove all of the current point positions which will force them to be re-created.
      function clearHighlightPoints() {
        svgElement.selectAll("path.nv-point").remove();
      }

      function updateChart(callback) {
        //poll to make sure chart has finished being created
        abmviz_utilities.poll(
          function() {
            return extNvd3Chart != undefined;
          },
          function() {
            // Check for all, select first person type if not found.
            var availablePersonTypes = Object.keys(chartData);
            var selectedPersonTypeIsInData = availablePersonTypes.includes(
              personType
            );
            if (!selectedPersonTypeIsInData) {
              // pick the first available person type if
              // the selected type is not in the data provided.
              personType = availablePersonTypes[0];
              drawLegend(availablePersonTypes);
            }


            // Sort data to move home, work, school, and other to the
            // base of the visualization.
            var currentPersonTypeData = moveMatchingPurposesToFront(
              chartData[personType],
              builtInPurposes
            );

            svgElement.datum(currentPersonTypeData).call(extNvd3Chart);
            //kluge - should not need to call nvd3 update here but occassionally in some window positions
            //the legend lays out differently after the first updateChart
            //so call immediately so user will never see the initial legend layout
            //extNvd3Chart.update();
            extNvd3Chart.dispatch.on("stateChange", function(e, i) {
              //see if style has change since legend margin needs to accomodate
              var newChartStyle = e.style;
              if (newChartStyle != chartStyle) {
                console.log("stateChange - chart style has changed.");
                chartStyle = newChartStyle;
                extNvd3Chart.margin().left = getChartLeftMargin();
                extNvd3Chart.update();
              }
            });
            extNvd3Chart.legend.dispatch.on("legendClick", function(e, i) {
              clearHighlightPoints();
              setTimeout(function() {
                //this somehow gets turned back on so must do again
                turnOffAreaClick();
              }, 1);
            });
            turnOffAreaClick();
            //wish to prevent the double click in the legend from toggling off all items other than clicked
            extNvd3Chart.legend.dispatch.on("legendDblclick", function(e) {
              console.log("ignoring chart legend legendDblclick dispatched.");
              //klugey solution is to turn off stateChange and then turn it back on again as soon as possible
              extNvd3Chart.legend.updateState(false);
              setTimeout(function() {
                extNvd3Chart.legend.updateState(true);
              }, 1);
            });
          },
          function() {
            throw "something is wrong -- extNvd3Chart still doesn't exist after polling ";
          }
        ); //end call to poll
        if (callback != undefined) {
          callback();
        }
        //end updateChart
      }

      function createEmptyChart(myCallback) {
        //http://nvd3.org/examples/stackedArea.html
        nv.addGraph({
          generate: function() {
            var chart = nv.models
              .stackedAreaChart()
              .margin({
                right: 10,
                left: getChartLeftMargin()
              })
              .x(function(d) {
                return d.timePeriod;
              }) //We can modify the data accessor functions...
              .y(function(d) {
                return d.quantity;
              }) //...in case your data is formatted differently.
              .clipEdge(true)
              .id(id + "-stackedAreaChart")
              .useInteractiveGuideline(true) //Tooltips which show all data points. Very nice!
              .showControls(true)
              .style(chartStyle); //Allow user to choose 'Stacked', 'Stream', 'Expanded' mode.

            //How to Remove control options from NVD3.js Stacked Area Chart
            //http://www.bainweb.com/2015/09/how-to-remove-control-options-from.html
            chart._options.controlOptions = ["Stacked", "Expanded"];
            //Format x-axis labels with custom function.
            chart.xAxis.tickFormat(function(d) {
              return abmviz_utilities.halfHourTimePeriodToTimeString(d);
            });
            chart.yAxis.tickFormat(d3.format("0,000"));
            chart.legend.vers("classic");
            return chart;
          },
          callback: function(newGraph) {
            console.log("timeuse nv.addGraph callback called");
            extNvd3Chart = newGraph;
            if (myCallback) {
              myCallback();
            }
          } //end callback function
        }); //end nv.addGraph
      } //end createEmptyChart

      function drawLegend(personTypes) {
        d3.select("#" + id + "-legend svg").remove(); //remove in case this is a window resize event
        //for height leave an extra slot so that when showing active nodes at top can have a space separating from rest of legend
        var totalLegendHeight = personTypes.length * (li.h + li.s);
        var legend = d3
          .select("#" + id + "-legend")
          .attr("width", legendBoxWidth)
          .attr("height", totalLegendHeight)
          .classed("timeuse-legend-items", true);

        var legendItems = legend
          .selectAll("div.legend-item-container")
          .data(personTypes)
          .enter()
          .append("div")
          .classed("legend-item-container", true)
          .append("div")
          .classed("timeuse-legend-item", true)
          .text(function(d) {
            return d;
          })
          .on("mouseover", function(d, i) {
            personType = d;
            clearHighlightPoints();
            updateChart();
            setPersonTypeClass();
          });

        function setPersonTypeClass() {
          legendItems.classed("timeuse-current-person-type", function(d) {
            return d === personType;
          });
        }

        setPersonTypeClass();
      } //end drawLegend
    } //end createTimeUse
    if (showChartOnPage) {
      $("#" + id + "-div").show();
      console.log($("#" + id + "-div").is(":visible"));
      createTimeUse();
      window.addEventListener(
        "resize",
        abmviz_utilities.debounce(
          function() {
            if (!thisTab.is(":visible")) {
              return;
            }
            createTimeUse();
          },
          250,
          true
        )
      );
    }

    //return only the parts that need to be global
    return {};
  }
}; //end encapsulating IIFEE

/**
 * Returns a shallow copy of dataArray with elements whose keys match
 * the built-in purposes moved to the front of the array, in the order
 * they appear in the builtInPurposes array.
 * @param {Array} dataArray 
 * @param {Array} builtInPurposes 
 */
function moveMatchingPurposesToFront(
  dataArray,
  builtInPurposes
) {
  var arrayCopy = dataArray.slice();

  // Reverse the array to move the elements which match a builtInPurpose
  // in order
  for (var builtInPurpose of builtInPurposes.slice().reverse()) {
    arrayCopy = findAndMoveToFront(
      arrayCopy,
      getPurposePredicate(builtInPurpose)
    );
  }

  return arrayCopy;

  function getPurposePredicate(comparisonString) {
    var regex = new RegExp("^" + comparisonString + "$", "i");
    return function personTypePredicate(arrayElement) {
      return arrayElement.key.match(regex);
    };
  }
}

/**
 * Finds first value in an array which satisfies the predicate,
 * returns an array with that element moved to index 0.
 */
function findAndMoveToFront(array, predicate) {
  var index = array.findIndex(predicate);

  // Return copy of original array if no value satisfies predicate.
  if (index === -1) {
    return array;
  }

  // Move value at index to front, return copied array.
  return [array[index]]
    .concat(array.slice(0, index))
    .concat(array.slice(index + 1));
}
