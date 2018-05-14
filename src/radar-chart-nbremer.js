/////////////////////////////////////////////////////////
/////////////// The Radar Chart Function ////////////////
/////////////// Written by Nadieh Bremer ////////////////
////////////////// VisualCinnamon.com ///////////////////
/////////// Inspired by the code of alangrafu ///////////
/////////////////////////////////////////////////////////
function RadarChart(id, data, options) {
	var cfg = {
		w: 600, //Width of the circle
		h: 600, //Height of the circle
		margin: {
			top: 20
			, right: 20
			, bottom: 20
			, left: 20
		}, //The margins of the SVG
         legendPosition: {x: 20, y: 20},
		levels: 3, //How many levels or inner circles should there be drawn
		maxValue: data[0].overallmax, //What is the value that the biggest circle will represent
		labelFactor: 1.25, //How much farther than the radius of the outer circle should the labels be placed
		wrapWidth: 60, //The number of pixels after which a label needs to be given a new line
		opacityArea: 0.35, //The opacity of the area of the blob
		dotRadius: 4, //The size of the colored circles of each blog
		opacityCircles: 0.1, //The opacity of the circles of each blob
		strokeWidth: 2, //The width of the stroke around each blob
		roundStrokes: false, //If true the area and stroke will follow a round path (cardinal-closed)

		tooltipFormatValue: function (d) {
				return d;
			},

        axisName: "axis",
        areaName: "areaName",
		color: d3.scale.category10() //Color function
	};

	//Put all of the options into a variable called cfg
	if ('undefined' !== typeof options) {
		for (var i in options) {
			if ('undefined' !== typeof options[i]) {
				cfg[i] = options[i];
			}
		} //for i
	} //if
	//If the supplied maxValue is smaller than the actual one, replace by the max in the data

	var maxFromData = d3.max(data, function (i) {
		return d3.max(i.axes.map(function (o) {

			return cfg.convertAxesToPercent ?o.value:o.originalValue;
		}))
	});
	var maxValue = maxFromData > 0 ?Math.max(cfg.maxValue, d3.max(data, function (i) {
		return d3.max(i.axes.map(function (o) {

			return cfg.convertAxesToPercent ?o.value:o.originalValue;
		}))
	})):maxFromData;

	var minValue = Math.min(cfg.minValue, d3.min(data, function (i) {
		return d3.min(i.axes.map(function (o) {
			return cfg.convertAxesToPercent ?o.value:o.originalValue;
		}))
	}));
		var axisName = cfg["axisName"],
			areaName = cfg["areaName"];

		//sort data and arrange by smallest area
//	data.forEach(function(d){/
//		d["value" + "Average"] = d3.mean(d.axes, function(e){ return e["value"] });

//	})

//    data = data.sort(function(a, b){
//		var a = a["value" + "Average"],
//				b = b["value" + "Average"];
//		return b - a;
//	})
	var allAxis = (data[0].axes.map(function (i, j) {
			return i.axis
		})), //Names of each axis
		total = allAxis.length, //The number of different axes
		radius = Math.min(cfg.w / 2, cfg.h / 2), //Radius of the outermost circle
		Format = d3.format(cfg.convertAxesToPercent?'%':'$.0f'), //Percentage formatting
		angleSlice = Math.PI * 2 / total; //The width in radians of each "slice"
	//Scale for the radius
    var rScale;
    var allNegatives = false;
    if(minValue < 0 && maxValue < 0)
    {
       var temp = maxValue;
        maxValue = minValue;
       minValue = temp;
       allNegatives = true;
       rScale = d3.scale.linear().range([0, radius]).domain([Math.min(minValue,0),maxValue ]);
    }
    else {
        rScale = d3.scale.linear().range([0, radius]).domain([ Math.min(minValue,0),maxValue]);
    }

	/////////////////////////////////////////////////////////
	//////////// Create the container SVG and g /////////////
	/////////////////////////////////////////////////////////
	//Remove whatever chart with the same id/class was present before
	d3.select(id).select("svg").remove();
	//Initiate the radar chart SVG
	var svg = d3.select(id).append("svg").attr("width", cfg.w + cfg.margin.left + cfg.margin.right).attr("height", cfg.h + cfg.margin.top + cfg.margin.bottom).attr("class", "radar " + id.replace(/#/,""));
	//Append a g element		
	var g = svg.append("g").attr("transform", "translate(" + (cfg.w / 2 + cfg.margin.left) + "," + (cfg.h / 2 + cfg.margin.top) + ")");
	/////////////////////////////////////////////////////////
	////////// Glow filter for some extra pizzazz ///////////
	/////////////////////////////////////////////////////////
	//Filter for the outside glow
	var filter = g.append('defs').append('filter').attr('id', 'glow')
		, feGaussianBlur = filter.append('feGaussianBlur').attr('stdDeviation', '2.5').attr('result', 'coloredBlur')
		, feMerge = filter.append('feMerge')
		, feMergeNode_1 = feMerge.append('feMergeNode').attr('in', 'coloredBlur')
		, feMergeNode_2 = feMerge.append('feMergeNode').attr('in', 'SourceGraphic');
	/////////////////////////////////////////////////////////
	/////////////// Draw the Circular grid //////////////////
	/////////////////////////////////////////////////////////
	//Wrapper for the grid & axes
	var axisGrid = g.append("g").attr("class", "axisWrapper");
	//Draw the background circles
	axisGrid.selectAll(".levels").data(d3.range(1, (cfg.levels + 1)).reverse()).enter().append("circle").attr("class", "gridCircle").attr("r", function (d, i) {
		return radius / cfg.levels * d;
	}).style("fill", "#FFFFFF").style("stroke", "#CDCDCD").style("fill-opacity", cfg.opacityCircles).style("filter", "url(#glow)");
	//Text indicating at what % each level is
	axisGrid.selectAll(".axisLabel").data(d3.range(1, (cfg.levels + 1)).reverse()).enter().append("text").attr("class", "axisLabel").attr("x", 4).attr("y", function (d) {
		return -d * radius / cfg.levels;
	}).attr("dy", "0.4em").style("font-size", cfg.circleLabelSizes+"px").attr("fill", "#737373").text(function (d, i) {
		return Format(maxValue * d / cfg.levels);
	});
	/////////////////////////////////////////////////////////
	//////////////////// Draw the axes //////////////////////
	/////////////////////////////////////////////////////////
	//Create the straight lines radiating outward from the center
    var labelTooltip = d3.select('.lbltooltip');
	var axis = axisGrid.selectAll(".axis").data(allAxis).enter().append("g").attr("class", "axis");
	//Append the lines
	axis.append("line").attr("x1", 0).attr("y1", 0).attr("x2", function (d, i) {
		return rScale(maxValue * 1.1) * Math.cos(angleSlice * i - Math.PI / 2);
	}).attr("y2", function (d, i) {
		return rScale(maxValue * 1.1) * Math.sin(angleSlice * i - Math.PI / 2);
	}).attr("class", "line").style("stroke", "grey").style("stroke-width", "1px");
	//Append the labels at each axis
	axis.append("text").attr("class", "legend").style("font-size", cfg.axisLabelSizes+"px").attr("text-anchor", "middle").attr("dy", "0.35em").attr("x", function (d, i) {
		return rScale(maxValue * cfg.labelFactor) * Math.cos(angleSlice * i - Math.PI / 2);
	}).attr("y", function (d, i) {
		return rScale(maxValue * cfg.labelFactor) * Math.sin(angleSlice * i - Math.PI / 2);
	}).text(function (d) {		return d;
	}).call(wrap, cfg.wrapWidth).on('mouseover',function(d,i,j){
	    var newx = d3.event.pageX;//parseFloat(d3.select(this).attr('x')) - 10;
	    var newy = d3.event.pageY;//parseFloat(d3.select(this).attr('y')) + 20;
	    var text = "<table><tbody>";
	    data.forEach(function(d,idx){
	        if(d["active"]==true){
	            //console.log(cfg.color(idx));
	            text+= "<tr><td class='legend-color-guide'><div style='background-color:"+cfg.color(idx)+"' ></div></td>";
	            text+= "<td class='key'>"+d.areaName +"</td><td class='value'> " + Format(cfg.convertAxesToPercent?d.axes[i].value:d.axes[i].originalValue)+ " ("+cfg.tooltipFormatValue(d.axes[i].originalValue)+")</td></tr>";
	        }
        });
	    text +="</tbody></table>";
	    //LABELtooltip.append("text",text);

	    labelTooltip.style('left', newx+"px").style('top', (newy-28)+"px")
            .transition().duration(0).style('opacity', 1);
	    labelTooltip.html(text);
	})
    .on('mouseout', function () {
            //Bring back all blobs
            labelTooltip.transition().duration(0).style("opacity", 0).style('top','0px').style('left','0px');
        });

	/////////////////////////////////////////////////////////
	///////////// Draw the radar chart blobs ////////////////
	/////////////////////////////////////////////////////////
	//The radial line function
	var radarLine = d3.svg.line.radial().interpolate("linear-closed").radius(function (d) {
	  //  console.log("Value " + rScale(d.value));
	  //  console.log(d);
	    //console.log(rScale(Format(d.value)));
		return rScale(cfg.convertAxesToPercent?d.value:d.originalValue);
	}).angle(function (d, i) {
		return i * angleSlice;
	});
	if (cfg.roundStrokes) {
		radarLine.interpolate("cardinal-closed");
	}

        //Create a wrapper for the blobs
        var blobWrapper = g.selectAll(".radarWrapper").data(data).enter().append("g").attr("class", "radarWrapper");
        //Append the backgrounds .filter(function(d){return d["active"] == true;})

        blobWrapper
            .append("path")
            .attr("class", function (d) {
                return "radarArea" + " areaName" + d[areaName].replace(/\s+/g, '') //Remove spaces from the areaName string to make one valid class name
            }).attr("d", function (d, i) {
            return radarLine(d.axes);
        }).style("fill", function (d, i) {
            return d["active"]===true?cfg.color(i):"none";
        }).style("fill-opacity", function (d, i) {
            return cfg.opacityArea;//return d.scaledOpacity;
        })
        .on('mouseover', function (d, i) {
            //Dim all blobs
            d3.selectAll(".radarArea").transition().duration(200).style("fill-opacity", 0.1);
            //Bring back the hovered over blob
            d3.select(this).transition().duration(200).style("fill-opacity", 0.7);
        }).on('mouseout', function () {
        //Bring back all blobs
            d3.selectAll(".radarArea").transition().duration(200).style("fill-opacity", cfg.opacityArea);
        })
        ;

	//Create the outlines	
	blobWrapper.append("path").attr("class", "radarStroke").attr("d", function (d, i) {
		return radarLine(d.axes);
	}).style("stroke-width", cfg.strokeWidth + "px").style("stroke", function (d, i, j) {
		return data[i]["active"]==true?cfg.color(i):"none";
	}).style("fill", "none");//.style("filter", "url(#glow)");

	//Append the circles
	blobWrapper.selectAll(".radarCircle").data(function (d, i) {
		return d.axes;
	}).enter().append("circle").attr("class", "radarCircle").attr("r", cfg.dotRadius).attr("cx", function (d, i) {
		return rScale(cfg.convertAxesToPercent?d.value:d.originalValue) * Math.cos(angleSlice * i - Math.PI / 2);
	}).attr("cy", function (d, i) {
		return rScale(cfg.convertAxesToPercent?d.value:d.originalValue) * Math.sin(angleSlice * i - Math.PI / 2);
	}).style("fill", function (d, i, j) {
		return data[j]["active"]==true?cfg.color(j):"none";
	}).style("fill-opacity", function (d, i, j) {
		return 0.8;//d.scaledOpacity;
	});
	/////////////////////////////////////////////////////////
	//////// Append invisible circles for tooltip ///////////
	/////////////////////////////////////////////////////////
	//Wrapper for the invisible circles on top
	var blobCircleWrapper = g.selectAll(".radarCircleWrapper").data(data.filter(function(d){return d["active"] == true;})).enter().append("g").attr("class", "radarCircleWrapper")
        .attr("radar",function(d){return "#radar-"+d["chartId"]+ " .areaName" + d[areaName].replace(/\s+/g, '');});
	//Append a set of invisible circles on top for the mouseover pop-up
	blobCircleWrapper.selectAll(".radarInvisibleCircle").data(function (d, i) {
		return d.axes;
	}).enter().append("circle").attr("class", "radarInvisibleCircle").attr("r", cfg.dotRadius * 1.5).attr("cx", function (d, i) {
		return rScale(cfg.convertAxesToPercent?d.value:d.originalValue) * Math.cos(angleSlice * i - Math.PI / 2);
	}).attr("cy", function (d, i) {
		return rScale(cfg.convertAxesToPercent?d.value:d.originalValue) * Math.sin(angleSlice * i - Math.PI / 2);
	}).style("fill", "none").style("pointer-events", "all").on("mouseover", function (d, i) {
	    
		newX = parseFloat(d3.select(this).attr('cx')) - 10;
		newY = parseFloat(d3.select(this).attr('cy')) - 10;
		tooltip.attr('x', newX).attr('y', newY).text(Format(cfg.convertAxesToPercent?d.value:d.originalValue) + ' (' + cfg.tooltipFormatValue(d.originalValue) + ')').transition().duration(200).style('opacity', 1);
        d3.selectAll(".radarArea").transition().duration(200).style("fill-opacity", 0.1);
        var rdSelector =$(this).closest('.radarCircleWrapper').attr("radar");

	    d3.select(rdSelector).transition().duration(200).style("fill-opacity", 0.7);	}).on("mouseout", function () {
		tooltip.transition().duration(200).style("opacity", 0);
		  d3.selectAll(".radarArea").transition().duration(200).style("fill-opacity", 0.1);
	});
	//Set up the small tooltip for when you hover over a circle
	var tooltip = g.append("text").attr("class", "tooltip").style("opacity", 0);

	/////////////////////////////////////////////////////////
	/////////////////// Helper Function /////////////////////
	/////////////////////////////////////////////////////////
	//Taken from http://bl.ocks.org/mbostock/7555321
	//Wraps SVG text	
	function wrap(text, width) {
		text.each(function () {
			var text = d3.select(this)
				, words = text.text().split(/\s+/).reverse()
				, word, line = []
				, lineNumber = 0
				, lineHeight = 1.4, // ems
				y = text.attr("y")
				, x = text.attr("x")
				, dy = parseFloat(text.attr("dy"))
				, tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");
			while (word = words.pop()) {
				line.push(word);
				tspan.text(line.join(" "));
				if (tspan.node().getComputedTextLength() > width) {
					line.pop();
					tspan.text(line.join(" "));
					line = [word];
					tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
				}
			}
		});
	} //wrap

 // on mouseover for the legend symbol
	function cellover(d) {
			//Dim all blobs
			d3.selectAll("#radar-"+data[d]["chartId"]).selectAll(".radarArea")
				.transition().duration(200)
				.style("fill-opacity", 0.1);
			//Bring back the hovered over blob

			d3.select("#radar-"+data[d]["chartId"]+ " .areaName" + data[d][areaName].replace(/\s+/g, ''))
				.transition().duration(200)
				.style("fill-opacity", 0.7);
	}

	// on mouseout for the legend symbol
	function cellout() {
		//Bring back all blobs
		d3.selectAll(".radarArea")
			.transition().duration(200)
			.style("fill-opacity", cfg.opacityArea);
	}

	function showHideBlobs(d, i, self){
        if(data[d]["active"]==true){
            data[d]["active"] =false;
        } else {
            data[d]["active"]=true;
        }
        if(data.filter(function(e){return e.active==true;}).length ==0){
            data.forEach(function(d){d.active = true;})
        }
	    RadarChart("#radar-" + data[d]["chartId"],data,cfg);

    }
	/////////////////////////////////////////////////////////
	/////////////////// Draw the Legend /////////////////////
	/////////////////////////////////////////////////////////

	svg.append("g")
  	.attr("class", "legendOrdinal")
  	.attr("transform", "translate(" + cfg["legendPosition"]["x"] + "," + cfg["legendPosition"]["y"] + ")")
        .style("font-size",cfg.labelFontSize+"px");

	var legendOrdinal = d3.legend.color()
  //d3 symbol creates a path-string, for example
  //"M0,-8.059274488676564L9.306048591020996,
  //8.059274488676564 -9.306048591020996,8.059274488676564Z"
  	.shape("path", d3.svg.symbol().type("square").size(200)())
  	.shapePadding(10)
  	.scale(cfg.color)
  	.labels(cfg.color.domain().map(function(d){
  		return data[d][areaName];
  	}))
  	.on("cellover", function(d){ cellover(d); })
  	.on("cellout", function(d) { cellout(); })
    .on("cellclick",function(d){ showHideBlobs(d);})
svg.select(".legendOrdinal")
  .call(legendOrdinal).call(function(d){
        data.forEach(function(chart,j){
            var legend = d3.selectAll('#radar-'+chart.chartId+' path.swatch').filter(function(d,i){return i ===j;});
            if(chart.active ==true){
                legend.style('fill',cfg.color).style('stroke',cfg.color);
            } else {
                legend.style('fill','white').style('stroke',cfg.color);
            }
            });

        });


} //RadarChart