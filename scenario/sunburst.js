//encapsulate all code within a IIFE (Immediately-invoked-function-expression) to avoid polluting global namespace
//global object sunburst will contain functions and variables that must be accessible from elsewhere
var sunburst = (function () {
	"use strict";
	var url = "../data/" + abmviz_utilities.GetURLParameter("scenario") + "/TreeMapData.csv";
	var legendWidth = 150;
	var allKeys; //filled in by buildHierarchy -- all possible sections of the sunburst
	var json = null;
	var maxDepth;
	var paths;
	var legendRects;
	var legendTexts;

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
				d3.selectAll(".sunburst-subgroup").html(subgroupColumn);
				var json = buildHierarchy(csv);
				var c20 = d3.scale.category20();
				allKeys.forEach(function (d, i) {
					colors[d] = c20(i);
				});
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
			initializeBreadcrumbTrail();
			drawLegend();
			// Bounding circle underneath the sunburst, to make it easier to detect
			// when the mouse leaves the parent g.
			vis.append("svg:circle").attr("r", radius).style("opacity", 0);
			// For efficiency, filter nodes to keep only those large enough to see.
			var nodes = partition.nodes(json).filter(function (d) {
				return (d.dx > 0.005); // 0.005 radians = 0.29 degrees
			});
			paths = vis.data([json]).selectAll("path").data(nodes).enter().append("svg:path").attr("display", function (d) {
				return d.depth ? null : "none";
			}).attr("d", arc).attr("fill-rule", "evenodd").style("fill", function (d) {
				return colors[d.name];
			}).style("opacity", 1).on("mouseover", mouseover);
			// Add the mouseleave handler to the bounding circle.
			d3.select("#sunburst-container").on("mouseleave", mouseleave);
			// Get total size of the tree = value of root node from partition.
			totalSize = paths.node().__data__.value;
		};
		// Fade all but the current sequence, and show it in the breadcrumb trail.
		function mouseover(d) {
			var percentage = (100 * d.value / totalSize).toPrecision(3);
			var percentageString = percentage + "%";
			if (percentage < 0.1) {
				percentageString = "< 0.1%";
			}
			d3.select("#sunburst-percentage").text(percentageString);
			d3.select("#sunburst-explanation").style("visibility", "");
			var sequenceArray = getAncestors(d);
			updateBreadcrumbs(sequenceArray, percentageString);
			// Fade all the segments.
			paths.style("opacity", function (node) {
				var opacity = (sequenceArray.indexOf(node) >= 0) ? 1.0 : 0.3;
				return opacity;
			});

// 			vis.selectAll("path").style("opacity", 0.3);
// 			// Then highlight only those that are an ancestor of the current segment.
// 			vis.selectAll("path").filter(function (node) {
// 				return (sequenceArray.indexOf(node) >= 0);
// 			}).style("opacity", 1);
			var sequenceArrayNames =sequenceArray.map(function(obj) {
				return obj.name;
			})
			legendRects.style("opacity", function (d) {
				var opacity = (sequenceArrayNames.indexOf(d.key) >= 0) ? 1.0 : 0.3;
				return opacity;
			});
			legendTexts.style("fill", function (d) {
				//text is either black or white
				var fill = (sequenceArrayNames.indexOf(d.key) >= 0) ? "#000" : "#fff";
				return fill;
			});
		}; //end mouseover
		// Restore everything to full opacity when moving off the visualization.
		function mouseleave(d) {
			// Hide the breadcrumb trail
			d3.select("#sunburst-trail").style("visibility", "hidden");
			paths.transition().duration(500).style("opacity", 1);
			legendRects.transition().duration(500).style("opacity", 1);
			legendTexts.transition().duration(500).style("fill", "#fff");
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

		function initializeBreadcrumbTrail() {
			// Add the svg area.
			var trail = d3.select("#sunburst-sequence").append("svg:svg").attr("width", width).attr("height", 50).attr("id", "sunburst-trail");
			// Add the label at the end, for the percentage.
			trail.append("svg:text").attr("id", "sunburst-endlabel").style("fill", "#000");
		}
		// Generate a string that describes the points of a breadcrumb polygon.
		function breadcrumbPoints(d, i) {
			var points = [];
			points.push("0,0");
			points.push(breadcrumb.w + ",0");
			points.push(breadcrumb.w + breadcrumb.tipWidth + "," + (breadcrumb.h / 2));
			points.push(breadcrumb.w + "," + breadcrumb.h);
			points.push("0," + breadcrumb.h);
			if (i > 0) { // Leftmost breadcrumb; don't include 6th vertex.
				points.push(breadcrumb.tipWidth + "," + (breadcrumb.h / 2));
			}
			return points.join(" ");
		}
		// Update the breadcrumb trail to show the current sequence and percentage.
		function updateBreadcrumbs(nodeArray, percentageString) {
			// Data join; key function combines name and depth (= position in sequence).
			var g = d3.select("#sunburst-trail").selectAll("g").data(nodeArray, function (d) {
				return d.name + d.depth;
			});
			// Add breadcrumb and label for entering nodes.
			var entering = g.enter().append("svg:g");
			//entering.append("svg:polygon").attr("points", breadcrumbPoints).style("fill", c20);
			entering.append("svg:polygon").attr("points", breadcrumbPoints).style("fill", function (d) {
				return colors[d.name];
			});
			entering.append("svg:text").attr("x", (breadcrumb.w + breadcrumb.tipWidth) / 2).attr("y", breadcrumb.h / 2).attr("dy", "0.35em").attr("text-anchor", "middle").text(function (d) {
				return d.name;
			});
			// Set position for entering and updating nodes.
			g.attr("transform", function (d, i) {
				return "translate(" + i * (breadcrumb.w + breadcrumb.spacing) + ", 0)";
			});
			// Remove exiting nodes.
			g.exit().remove();
			// Now move and update the percentage at the end.
			d3.select("#sunburst-trail").select("#sunburst-endlabel").attr("x", (nodeArray.length + 0.5) * (breadcrumb.w + breadcrumb.spacing)).attr("y", breadcrumb.h / 2).attr("dy", "0.35em").attr("text-anchor", "middle").text(percentageString);
			// Make the breadcrumb trail visible, if it's hidden.
			d3.select("#sunburst-trail").style("visibility", "");
		}

		function drawLegend() {
			// Dimensions of legend item: width, height, spacing, radius of rounded rect.
			var li = {
				w: legendWidth
				, h: 30
				, s: 3
				, r: 3
			};
			d3.select("#sunburst-legend svg").remove(); //remove in case this is a window resize event
			var legend = d3.select("#sunburst-legend").append("svg:svg").attr("width", li.w).attr("height", d3.keys(colors).length * (li.h + li.s));
			var g = legend.selectAll("g").data(d3.entries(colors)).enter().append("svg:g").attr("transform", function (d, i) {
				return "translate(0," + i * (li.h + li.s) + ")";
			});
			legendRects = g.append("svg:rect").attr("rx", li.r).attr("ry", li.r).attr("width", li.w).attr("height", li.h).style("fill", function (d) {
				return d.value;
			});
			legendTexts = g.append("svg:text").attr("x", li.w / 2).attr("y", li.h / 2).attr("dy", "0.35em").attr("text-anchor", "middle").text(function (d) {
				return d.key;
			});
		}
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