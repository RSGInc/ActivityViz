//encapsulate all code within a IIFE (Immediately-invoked-function-expression) to avoid polluting global namespace
//global object sunburst will contain functions and variables that must be accessible from elsewhere
var sunburst = (function () {
	"use strict";
	var url = "../data/" + abmviz_utilities.GetURLParameter("scenario") + "/TreeMapData.csv";
	//var url = "../data/" + abmviz_utilities.GetURLParameter("scenario") + "/visit-sequences.csv";
	var legendBoxWidth = 150;
	var legendDepthIndent = 10;
	var json = null;
	var maxDepth;
	var nodeVisuals;
	var legendRects;
	var legendTexts;
	var legendGroups;
	var negativePrefix = "- ";
	// Dimensions of legend item: width, height, spacing, radius of rounded rect.
	var li = {
		w: legendBoxWidth
		, h: 22
		, s: 3
		, r: 3
	};
	var colors = {}; //will be filled in to map keys to colors
	// Total size of all segments; we set this later, after loading the data.
	var totalSize;

	function createSunburst() {
		//read in data and create sunburst when finished
		if (json === null) {
			d3.text(url, function (error, data) {
				"use strict";
				if (error) throw error; //expected data should have columns similar to: MAINGROUP,SUBGROUP,QUANTITY
				var csv = d3.csv.parseRows(data);
				var headers = csv[0];
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
			var sunburstBounds = d3.select("#sunburst-main").node().getBoundingClientRect();
			//Sequences sunburst https://bl.ocks.org/kerryrodden/7090426
			// Dimensions of sunburst.
			var makeSunburst = true;
			var width = makeSunburst ? Math.min(750, sunburstBounds.width) : sunburstBounds.width;
			var height = width;
			//set explanation and sidebar dimensions so that table-cell vertical align will center
			d3.select("#sunburst-explanation").style("width", width).style("height", height);
			d3.select("#sunburst-sidebar").style("height", height);
			d3.select("#sunburst-chart svg").remove(); //in case window resize delete contents
			var vis = d3.select("#sunburst-chart").append("svg:svg").attr("width", width).attr("height", height).append("svg:g").attr("id", "sunburst-container");
			var partition = d3.layout.partition().value(function (d) {
				return d.size;
			});
			if (makeSunburst) {
				var radius = Math.min(width, height) / 2;
				partition.size([2 * Math.PI, radius * radius]);
				vis.attr("transform", "translate(" + radius + "," + radius + ")")
			}
			else {
				partition.size([width, height]);
			}
			var nodeData = partition.nodes(json);
			//remove the root node since will not draw an object for that
			var rootNode = nodeData.shift();
			// Get total size of the tree = value of root node from partition.
			totalSize = rootNode.value;
			//for efficiency, remove nodes too small to see
			if (makeSunburst) {
				nodeData = nodeData.filter(function (d) {
					return (d.dx > 0.005); // 0.005 radians = 0.29 degrees
				});
			}
			else {
				nodeData = nodeData.filter(function (d) {
					return (d.dx > 0.5);
				});
			}
			//assign each node a color. Also assign each node a unique id since depth and name may not be unique
			var c10 = d3.scale.category10();
			var luminance = d3.scale.sqrt().domain([0, totalSize]).clamp(true).range([90, 20]);
			maxDepth = 0;
			//first give all nodes ids and set baseColors for all the top level objects
			var numDepth1 = 0;
			nodeData.forEach(function (d, i) {
				d.uniqueId = d.depth + ' ' + i;
				maxDepth = Math.max(d.depth, maxDepth);
				if (d.depth == 1) {
					d.luminance = d3.scale.sqrt().domain([0, d.value]).clamp(true).range([90, 20]);
					d.baseColor = d3.lab(c10(numDepth1));
					numDepth1 += 1;
					d.baseColor.l = d.luminance(d.value);
					colors[d.uniqueId] = d.baseColor;
				}
			});
			//now for all lower level objects, set the color as a scaled luminance copy of the base color of the top level
			nodeData.forEach(function (d, i) {
				if (d.depth > 1) {
					var p = d;
					while (p.depth > 1) p = p.parent;
					var topAncestor = p;
					var c = d3.lab(topAncestor.baseColor);
					c.l = topAncestor.luminance(d.value);
					colors[d.uniqueId] = c;
				}
			});
			drawLegend(nodeData);
			nodeVisuals = vis.data([json]).selectAll(".sunburst-node").data(nodeData);
			if (makeSunburst) {
				nodeVisuals = nodeVisuals.enter().append("svg:path").attr("d", d3.svg.arc().startAngle(function (d) {
					return d.x;
				}).endAngle(function (d) {
					return d.x + d.dx;
				}).padAngle(function (d) {
					return ((maxDepth - d.depth) + 1) * 0.002;
				}).innerRadius(function (d) {
					return Math.sqrt(d.y);
				}).outerRadius(function (d) {
					return Math.sqrt(d.y + d.dy);
				}));
			}
			else {
				//make icicleChart
				nodeVisuals = nodeVisuals.enter().append("rect").attr("x", function (d) {
					return d.x;
				}).attr("y", function (d) {
					return d.y;
				}).attr("width", function (d) {
					return d.dx;
				}).attr("height", function (d) {
					return d.dy;
				});
			}
			nodeVisuals.attr("class", "sunburst-node").attr("fill-rule", "evenodd").style("fill", function (d) {
				return colors[d.uniqueId];
			}).on("mouseover", mouseoverNode);
			// Add the mouseleave handler to the bounding circle.
			d3.select("#sunburst-container").on("mouseleave", mouseleave);
			nodeVisuals.classed("sunburst-negative", function (d) {
				return d.name.startsWith(negativePrefix);
			});
		};

		function showNodeExplanation(node) {
			var percentage = (100 * node.value / totalSize).toPrecision(3);
			var percentageString = percentage + "%";
			if (percentage < 0.1) {
				percentageString = "< 0.1%";
			}
			d3.select("#sunburst-percentage").text(percentageString);
			d3.select("#sunburst-current-node").text(node.name);
			d3.select("#sunburst-current-node-value").text(getReadableValueString(node.value));
			d3.select("#sunburst-explanation").style("visibility", "").classed("sunburst-negative", function (d) {
				return node.name.startsWith(negativePrefix);
			});
		};

		function hideNodeExplanation() {
			d3.select("#sunburst-explanation").style("visibility", "hidden");
		}
		// Fade all but the current sequence, and show it sorted to the top of the legend.
		function mouseoverNode(d) {
			showNodeExplanation(d);
			var sequenceArray = getAncestors(d);
			//move the legend rects of the current sequence array to the top, similar to a breadcrumb trail
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
				return "translate(" + getDepthIndent(d) + "," + xTranslation + ")";
			});
			// Fade all segments not in sequenceArray.
			dimAllBut(nodeVisuals, sequenceArray);
			dimAllBut(legendRects, sequenceArray);
		}; //end mouseoverNode
		// Restore everything to full opacity when moving off the visualization.
		function mouseleave(d) {
			// Deactivate all segments during transition.
			unDimClass(nodeVisuals);
			unDimClass(legendRects);
			legendGroups.transition().duration(500).attr("transform", function (d, i) {
				return "translate(" + getDepthIndent(d) + "," + i * (li.h + li.s) + ")";
			});
			hideNodeExplanation();
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

		function getReadableValueString(valueToConvert) {
			var i = -1;
			var numberUnits = [' thousand', ' million', ' billion', ' trillion', 'PB', 'EB', 'ZB', 'YB'];
			do {
				valueToConvert = valueToConvert / 1000;
				i++;
			} while (valueToConvert > 1000);
			return Math.max(valueToConvert, 0.1).toFixed(1) + numberUnits[i];
		};

		function getDepthIndent(d) {
			return (d.depth - 1) * legendDepthIndent;
		}

		function dimAllBut(selection, undimmed) {
			selection.classed("sunburst-dimmed", function (d) {
				return (undimmed.indexOf(d) == -1);
			});
		};

		function unDimClass(selection) {
			selection.classed("sunburst-dimmed", false);
		};

		function drawLegend(nodeData) {
			d3.select("#sunburst-legend svg").remove(); //remove in case this is a window resize event
			//for height leave an extra slot so that when showing active nodes at top can have a space separating from rest of legend
			var totalLegendHeight = (nodeData.length + 1) * (li.h + li.s);
			var legend = d3.select("#sunburst-legend").append("svg:svg").attr("width", legendBoxWidth + ((maxDepth - 1) * legendDepthIndent)).attr("height", totalLegendHeight).on("mouseleave", function () {
				unDimClass(nodeVisuals);
				unDimClass(legendRects);
				d3.select("#sunburst-explanation").style("visibility", "hidden");
			});
			legendGroups = legend.selectAll("g").data(nodeData).enter().append("svg:g").attr("transform", function (d, i) {
				return "translate(" + getDepthIndent(d) + "," + i * (li.h + li.s) + ")";
			});
			legendRects = legendGroups.append("svg:rect").attr("rx", li.r).attr("ry", li.r).attr("width", li.w).attr("height", li.h).style("fill", function (d) {
				return colors[d.uniqueId];
			}).on("mouseover", function (d, i) {
				dimAllBut(nodeVisuals, [d]);
				dimAllBut(legendRects, [d]);
				showNodeExplanation(d);
			});
			legendTexts = legendGroups.append("svg:text").attr("x", li.w / 2).attr("y", li.h / 2).attr("dy", "0.35em").attr("text-anchor", "middle").text(function (d) {
				return d.name;
			});
					legendRects.classed("sunburst-negative", function (d) {
				return d.name.startsWith(negativePrefix);
			});

		}; //end drawLegend
		// Take a multi-column CSV and transform it into a hierarchical structure suitable
		// for a partition layout. The first column to the next to last column is a sequence of step names, from
		// root to leaf. The last column is a count of how
		// often that sequence occurred.
		function buildHierarchy(csv) {
			var root = {
				"name": "root"
				, "children": []
			};
			for (var rowIndex = 0; rowIndex < csv.length; rowIndex++) {
				var row = csv[rowIndex];
				//remove any consecutive duplicates
				var lastCellString = row[0];
				for (var columnIndex = 1; columnIndex < row.length; columnIndex++) {
					if (row[columnIndex] === lastCellString) {
						row.splice(columnIndex, 1);
						columnIndex--;
					}
				}
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
				var isNegative = (size < 0);
				if (isNegative) {
					size = Math.abs(size);
				}
				var currentNode = root;
				for (var j = 0; j < parts.length; j++) {
					var children = currentNode["children"];
					var nodeName = parts[j];
					if (isNegative) {
						nodeName = negativePrefix + nodeName;
					}
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
							, "isNegative": isNegative
						};
						children.push(childNode);
					}
				}
			}
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