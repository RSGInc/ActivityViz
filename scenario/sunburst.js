//encapsulate all code within a IIFE (Immediately-invoked-function-expression) to avoid polluting global namespace
//global object sunburst will contain functions and variables that must be accessible from elsewhere
var sunburst = (function () {
	"use strict";
	var url = "../data/" + abmviz_utilities.GetURLParameter("scenario") + "/TreeMapData.csv";
	//var url = "../data/" + abmviz_utilities.GetURLParameter("scenario") + "/visit-sequences.csv";
	var legendWidth = 150;
	var allKeys; //filled in by buildHierarchy -- all possible sections of the sunburst
	var json = null;
	var maxDepth;
	var paths;
	var legendRects;
	var legendTexts;
	var legendGroups;
	// Dimensions of legend item: width, height, spacing, radius of rounded rect.
	var li = {
		w: legendWidth
		, h: 30
		, s: 3
		, r: 3
	};

	function createSunburst() {
		var sunburstBounds = d3.select("#sunburst-main").node().getBoundingClientRect();
		//Sequences sunburst https://bl.ocks.org/kerryrodden/7090426
		// Dimensions of sunburst.
		var width = Math.min(700, sunburstBounds.width);
		var height = width;
		var radius = Math.min(width, height) / 2;
		// Breadcrumb dimensions: width, height, spacing, width of tip/tail.
		var colors = {}; //will be filled in to map keys to colors
		var breadcrumb = {
			w: legendWidth
			, h: 30
			, spacing: 3
			, tipWidth: 10 //the arro on the right side of each breadcrumb
		};
		// Total size of all segments; we set this later, after loading the data.
		var totalSize = 0;
		d3.select("#sunburst-explanation").style("width", width).style("height", height);
		d3.select("#sunburst-chart svg").remove(); //in case window resize delete contents
		var vis = d3.select("#sunburst-chart").append("svg:svg").attr("width", width).attr("height", height).append("svg:g").attr("id", "sunburst-container").attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
		var partition = d3.layout.partition().size([2 * Math.PI, radius * radius]).value(function (d) {
			return d.size;
		});
		var arc = d3.svg.arc().startAngle(function (d) {
			return d.x;
		}).endAngle(function (d) {
			return d.x + d.dx;
		}).innerRadius(function (d) {
			return Math.sqrt(d.y);
		}).outerRadius(function (d) {
			return Math.sqrt(d.y + d.dy);
		});
		//read in data and create sunburst when finished
		if (json === null) {
			d3.text(url, function (error, data) {
				"use strict";
				if (error) throw error; //expected data should have columns similar to: MAINGROUP,SUBGROUP,QUANTITY
				var csv = d3.csv.parseRows(data);
				var headers = csv[0];
				//abmviz_utilities.assert(headers.length == 3, "Expect three columns - something like: MAINGROUP,SUBGROUP,QUANTITY");
				var maingroupColumn = headers[0];
				var subgroupColumn = headers[1];
				var quantityColumn = headers[2];
				d3.selectAll(".sunburst-maingroup").html(maingroupColumn);
				var json = buildHierarchy(csv);
				createVisualization(json);
			}); //end d3.text	
		}
		else {
			//if already exists don't need to read in and parse again
			createVisualization(json);
		}
		//https://bl.ocks.org/kerryrodden/7090426
		// Main function to draw and set up the visualization, once we have the data.
		function createVisualization(json) {
			// Basic setup of page elements.
			// Bounding circle underneath the sunburst, to make it easier to detect
			// when the mouse leaves the parent g.
			vis.append("svg:circle").attr("r", radius).style("opacity", 0);
			// For efficiency, filter nodes to keep only those large enough to see.
			var nodes = partition.nodes(json).filter(function (d) {
				return (d.dx > 0.005); // 0.005 radians = 0.29 degrees
			});
			//assign each node a color. Also assign each node a unique id since depth and name may not be unique
			var c20 = d3.scale.category20();
			nodes.forEach(function (d, i) {
				//do not allocate a color for the root node
				if (i > 0) {
					d.uniqueId = i;
					colors[d.uniqueId] = c20(i - 1);
				}
			});
			drawLegend(nodes);
			paths = vis.data([json]).selectAll("path").data(nodes).enter().append("svg:path").attr("display", function (d) {
				return d.depth ? null : "none";
			}).attr("d", arc).attr("fill-rule", "evenodd").style("fill", function (d) {
				return colors[d.uniqueId];
			}).style("opacity", 1).on("mouseover", mouseover);
			// Add the mouseleave handler to the bounding circle.
			d3.select("#sunburst-container").on("mouseleave", mouseleave);
			// Get total size of the tree = value of root node from partition.
			totalSize = paths.node().__data__.value;
		};
		// Fade all but the current sequence, and show it sorted to the top of the legend.
		function mouseover(d) {
			var percentage = (100 * d.value / totalSize).toPrecision(3);
			var percentageString = percentage + "%";
			if (percentage < 0.1) {
				percentageString = "< 0.1%";
			}
			d3.select("#sunburst-percentage").text(percentageString);
			d3.select("#sunburst-current-node").text(d.name);
			d3.select("#sunburst-explanation").style("visibility", "");
			var sequenceArray = getAncestors(d);
			// Fade all the segments.
			paths.style("opacity", function (node) {
				var opacity = (sequenceArray.indexOf(node) >= 0) ? 1.0 : 0.3;
				return opacity;
			});
			legendRects.style("opacity", function (d) {
				var opacity = (sequenceArray.indexOf(d) >= 0) ? 1.0 : 0.3;
				return opacity;
			});
			var numSequenceMembersFound = 0;
			legendGroups.transition().duration(500).attr("transform", function (d, i) {
				var xTranslation = i * (li.h + li.s);
				var sequenceIndex = sequenceArray.indexOf(d);
				if (sequenceIndex >= 0) {
					xTranslation = sequenceIndex * (li.h + li.s);
					numSequenceMembersFound += 1;
				}
				else {
					xTranslation = (sequenceArray.length + i - numSequenceMembersFound + 1) * (li.h + li.s);
				}
				return "translate(0," + xTranslation + ")";
			});
			legendTexts.style("fill", function (d) {
				//text is either black or white
				var fill = (sequenceArray.indexOf(d) >= 0) ? "#000" : "#fff";
				return fill;
			});
		}; //end mouseover
		// Restore everything to full opacity when moving off the visualization.
		function mouseleave(d) {
			paths.transition().duration(500).style("opacity", 1);
			legendRects.transition().duration(500).style("opacity", 1);
			legendTexts.transition().duration(500).style("fill", "#fff");
			legendGroups.transition().duration(500).attr("transform", function (d, i) {
				return "translate(0," + i * (li.h + li.s) + ")";
			});
			// 			// Deactivate all segments during transition.
			// 			d3.selectAll("path").on("mouseover", null);
			// 			// Transition each segment to full opacity and then reactivate it.
			// 			d3.selectAll("path").transition().duration(1000).style("opacity", 1).each("end", function () {
			// 				d3.select(this).on("mouseover", mouseover);
			// 			});
			d3.select("#sunburst-explanation").style("visibility", "hidden");
		}
		// Given a node in a partition layout, return an array of all of its ancestor
		// nodes, highest first, but excluding the root.
		function getAncestors(node) {
			var path = [];
			var current = node;
			while (current.parent) {
				path.unshift(current);
				current = current.parent;
			}
			return path;
		}

		function drawLegend(nodes) {
			d3.select("#sunburst-legend svg").remove(); //remove in case this is a window resize event
			//for height leave an extra slot so that when showing active nodes at top can have a space separating from rest of legend
			var totalLegendHeight = (nodes.length + 1) * (li.h + li.s);
			var legend = d3.select("#sunburst-legend").append("svg:svg").attr("width", li.w).attr("height", totalLegendHeight);
			legendGroups = legend.selectAll("g").data(nodes.slice(1)).enter().append("svg:g").attr("transform", function (d, i) {
				return "translate(0," + i * (li.h + li.s) + ")";
			});
			legendRects = legendGroups.append("svg:rect").attr("rx", li.r).attr("ry", li.r).attr("width", li.w).attr("height", li.h).style("fill", function (d) {
				return colors[d.uniqueId];
			});
			legendTexts = legendGroups.append("svg:text").attr("x", li.w / 2).attr("y", li.h / 2).attr("dy", "0.35em").attr("text-anchor", "middle").text(function (d) {
				return d.name;
			});
		}; //end drawLegend
		// Take a multi-column CSV and transform it into a hierarchical structure suitable
		// for a partition layout. The first column to the next to last column is a sequence of step names, from
		// root to leaf. The last column is a count of how 
		// often that sequence occurred.
		function buildHierarchy(csv) {
			allKeys = new Set();
			var root = {
				"name": "root"
				, "children": []
			};
			for (var i = 0; i < csv.length; i++) {
				var row = csv[i];
				//support unbalanced trees where each row could go a different depth
				var numColumns = row.length;
				while (row[numColumns - 1].length == 0) {
					numColumns -= 1;
				}
				var parts = row.slice(0, numColumns - 1);
				var size = +row[numColumns - 1];
				if (isNaN(size)) { // e.g. if this is a header row
					continue;
				}
				var currentNode = root;
				for (var j = 0; j < parts.length; j++) {
					var children = currentNode["children"];
					var nodeName = parts[j];
					allKeys.add(nodeName);
					var childNode;
					if (j + 1 < parts.length) {
						// Not yet at the end of the sequence; move down the tree.
						var foundChild = false;
						for (var k = 0; k < children.length; k++) {
							if (children[k]["name"] == nodeName) {
								childNode = children[k];
								foundChild = true;
								break;
							}
						}
						// If we don't already have a child node for this branch, create it.
						if (!foundChild) {
							childNode = {
								"name": nodeName
								, "children": []
							};
							children.push(childNode);
						}
						currentNode = childNode;
					}
					else {
						// Reached the end of the sequence; create a leaf node.
						childNode = {
							"name": nodeName
							, "size": size
						};
						children.push(childNode);
					}
				}
			}
			//change from set to array
			allKeys = Array.from(allKeys);
			return root;
		};
	}; //end createSunburst
	createSunburst();
	window.addEventListener("resize", function () {
		console.log("Got resize event. Calling sunburst");
		createSunburst();
	});
	//return only the parts that need to be global
	return {};
}()); //end encapsulating IIFE