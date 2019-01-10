//encapsulate all code within a IIFE (Immediately-invoked-function-expression) to avoid polluting global namespace
//global object scatter will contain functions and variables that must be accessible from elsewhere
var scatter = (function() {
    "use strict";

    var url = "../data/" + abmviz_utilities.GetURLParameter("region") + "/" + abmviz_utilities.GetURLParameter("scenario") + "/Scatter.csv";
    var showChartOnPage = true;
    $("#scenario-header").html("Scenario " + abmviz_utilities.GetURLParameter("scenario"));
    var xAxisColumn;
    var yAxisColumn;
    var sizeColumn;
    var labelColumn;
    var chartData;

    function readInDataCallback() {
        createPlot();
        setDataSpecificDOM();

    };
    getConfigSettings(function () {
        readInData(function () {
            readInDataCallback();
        });
    });

    function getConfigSettings(callback) {
        if (showChartOnPage) {
            $.getJSON("../data/" + abmviz_utilities.GetURLParameter("region") + "/" + "region.json", function (data) {
                $.each(data, function (key, val) {
                    if (key == "Scatter") {
                        $.each(val, function (opt, value) {

                        });
                    }
                });
                callback();
            });
        }
    };

    function readInData(callback) {
        "use strict";

        d3.csv(url, function (error, data) {
            "use strict";
            if (error) {
               $('#scatter').html("<div class='container'><h3><span class='alert alert-danger'>Error: An error occurred while loading the scatter data.</span></h3></div>");
                throw error;
            }

            //expected data should have columns similar to: ZONE,COUNTY,TRIP_MODE_NAME,QUANTITY
            var headers = d3.keys(data[0]);
            labelColumn = headers[0];
            xAxisColumn = headers[1];
            yAxisColumn = headers[2];
            sizeColumn = headers[3];
            if(yAxisColumn==undefined){
                $('#scatter').html("<div class='container'><h3><span class='alert alert-danger'>Error: An error occurred while loading the scatter data.</span></h3></div>");
                return;
            }
            data.forEach(function (d) {
                d[xAxisColumn] = +d[xAxisColumn];
                d[yAxisColumn] = +d[yAxisColumn];
                d[sizeColumn] = +d[sizeColumn];
            });
            chartData = data;
            readInDataCallback();
        });
    };

    function createPlot() {
        var margin = {top: 20, right: 200, bottom: 120, left: 190},
            outerWidth = 970, outerHeight = 720,
            width = outerWidth - margin.left - margin.right,
            height = outerHeight - margin.top - margin.bottom;

        /*
         * value accessor - returns the value to encode for a given data object.
         * scale - maps value to a visual display encoding, such as a pixel position.
         * map function - maps from data value to display value
         * axis - sets up axis
         */


        var xMax = d3.max(chartData, function (d) {
                return d[xAxisColumn];
            }) * 1.10,
            xMin = d3.min(chartData, function (d) {
                return d[xAxisColumn];
            }),

            yMax = d3.max(chartData, function (d) {
                return d[yAxisColumn];
            }) * 1.10,
            yMin = d3.min(chartData, function (d) {
                return d[yAxisColumn];
            });

        var chartMin = d3.min([yMin,xMin]);
        var chartMax = d3.max([yMax,xMax]);

        var x = d3.scale.linear()
            .range([0, width]).nice();

        var y = d3.scale.linear()
            .range([height, 0]).nice();
        x.domain([chartMin - (chartMin *0.10), chartMax ]);
        y.domain([chartMin - (chartMin *0.10), chartMax ]);

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom");

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left");

        var xValue = function (d) {
                return d[xAxisColumn];
            }, // data -> value
            xScale = d3.scale.linear().range([0, width]), // value -> display
            xMap = function (d) {
                return xScale(xValue(d));
            }; // data -> display


        // setup y
        var yValue = function (d) {
                return d[yAxisColumn];
            }, // data -> value
            yScale = d3.scale.linear().range([height, 0]), // value -> display
            yMap = function (d) {
                return yScale(yValue(d));
            };
        var color = d3.scale.category10();

        var tip = d3.tip()
            .attr("class", "d3-tip")
            .offset([-10, 0])
            .html(function (d) {
                return d[labelColumn] + "<br>" + xAxisColumn + ": " + d[xAxisColumn] + "<br>" + yAxisColumn + ": " + d[yAxisColumn] + "<br/>" +
                    yAxisColumn + " / " + xAxisColumn + ": " + (d[yAxisColumn] / d[xAxisColumn]).toFixed(2);
            });

        var svg = d3.select("#scatter-chart-container")
            .append("svg")
            .attr("width", outerWidth)
            .attr("height", outerHeight)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var lineData = [{"x": chartMin, "y": chartMin}, {"x": chartMax, "y": chartMax}];

        var lineFunction = d3.svg.line()
            .x(function (d) {
                return x(d.x);
            })
            .y(function (d) {
                return y(d.y);
            })
            .interpolate("linear");
        svg.append('path')
            .attr('class', 'regression')
            .attr("d", lineFunction(lineData));


        svg.call(tip);

        svg.append("rect")
            .attr("width", width)
            .attr("height", height);

        svg.append("g")
            .classed("x axis", true)
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis)
            .append("text")
            .classed("label", true)
            .attr("x", (width+margin.left)/2)
            .attr("y", margin.bottom - 10)
            .style("text-anchor", "end")
            .style("font-size","110%")
            .text(xAxisColumn);



        svg.append("g")
            .classed("y axis", true)
            .call(yAxis)
            .append("text")
            .classed("label", true)
            .attr("transform", "rotate(-90)")
            .attr("y", -margin.left + 10)
            .attr("dy", ".71em")
            .attr("x", -((height)/2)+margin.top)
            .style("text-anchor", "middle")
            .style("font-size","110%")
            .text(yAxisColumn);

        svg.selectAll("g.x g.tick text").attr("transform","rotate(45)").style("text-anchor","start")
         .attr("y", -2)
    .attr("x", 9);

        var objects = svg.append("svg")
            .classed("objects", true)
            .attr("width", width)
            .attr("height", height);

        objects.selectAll(".dot")
            .data(chartData)
            .enter().append("circle")
            .classed("dot", true)
            .attr("r", function (d) {
                return 6 * d[sizeColumn];
            })
            .attr("transform", transform)
            .style("fill", function (d) {
                return color(d[labelColumn]);
            })
            .on("mouseover", tip.show)
            .on("mouseout", tip.hide);

        var legend = svg.selectAll(".legend")
            .data(color.domain())
            .enter().append("g")
            .classed("legend", true)
            .attr("transform", function (d, i) {
                return "translate(10," + i * 20 + ")";
            });

        legend.append("circle")
            .attr("r", 3.5)
            .attr("cx", width + 20)
            .attr("fill", color);

        legend.append("text")
            .attr("x", width + 26)
            .attr("dy", ".35em")
            .text(function (d) {
                return d;
            });
        svg.selectAll(".dot")
            .attr("transform", transform);


        function transform(d) {
            return "translate(" + x(d[xAxisColumn]) + "," + y(d[yAxisColumn]) + ")";
        }
    };

    function setDataSpecificDOM() {
        $('.scatter-chart-yaxis-title').text(yAxisColumn);
        $('.scatter-chart-xaxis-title').text(xAxisColumn);
    };
    //readInData();
}());
