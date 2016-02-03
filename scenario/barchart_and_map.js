//map
var chart, zonetiles, baselayer, map, tileIndex, tileOptions;
var center = [33.754525, -84.384774];
var color1 = "#f1eef6", color2 = "#bdc9e1", color3="#74a9cf", color4="#2b8cbe", nacolor="Black";
var palette = [
        ["rgb(0, 0, 0)", "rgb(67, 67, 67)", "rgb(102, 102, 102)",
        "rgb(204, 204, 204)", "rgb(217, 217, 217)","rgb(255, 255, 255)"],
        ["rgb(152, 0, 0)", "rgb(255, 0, 0)", "rgb(255, 153, 0)", "rgb(255, 255, 0)", "rgb(0, 255, 0)",
        "rgb(0, 255, 255)", "rgb(74, 134, 232)", "rgb(0, 0, 255)", "rgb(153, 0, 255)", "rgb(255, 0, 255)"], 
        ["rgb(230, 184, 175)", "rgb(244, 204, 204)", "rgb(252, 229, 205)", "rgb(255, 242, 204)", "rgb(217, 234, 211)", 
        "rgb(208, 224, 227)", "rgb(201, 218, 248)", "rgb(207, 226, 243)", "rgb(217, 210, 233)", "rgb(234, 209, 220)", 
        "rgb(221, 126, 107)", "rgb(234, 153, 153)", "rgb(249, 203, 156)", "rgb(255, 229, 153)", "rgb(182, 215, 168)", 
        "rgb(162, 196, 201)", "rgb(164, 194, 244)", "rgb(159, 197, 232)", "rgb(180, 167, 214)", "rgb(213, 166, 189)", 
        "rgb(204, 65, 37)", "rgb(224, 102, 102)", "rgb(246, 178, 107)", "rgb(255, 217, 102)", "rgb(147, 196, 125)", 
        "rgb(118, 165, 175)", "rgb(109, 158, 235)", "rgb(111, 168, 220)", "rgb(142, 124, 195)", "rgb(194, 123, 160)",
        "rgb(166, 28, 0)", "rgb(204, 0, 0)", "rgb(230, 145, 56)", "rgb(241, 194, 50)", "rgb(106, 168, 79)",
        "rgb(69, 129, 142)", "rgb(60, 120, 216)", "rgb(61, 133, 198)", "rgb(103, 78, 167)", "rgb(166, 77, 121)",
        "rgb(91, 15, 0)", "rgb(102, 0, 0)", "rgb(120, 63, 4)", "rgb(127, 96, 0)", "rgb(39, 78, 19)", 
        "rgb(12, 52, 61)", "rgb(28, 69, 135)", "rgb(7, 55, 99)", "rgb(32, 18, 77)", "rgb(76, 17, 48)"]
    ];
//slider
var handlers = [25, 50, 75];

//data
var zonename;
var dataname;
var zonedata = {};
var zonegroups = [];
var dataitems = [];
var currentCounty = "";
var modes = [];


function GetURLParameter(sParam)
{
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    for (var i = 0; i < sURLVariables.length; i++) 
    {
        var sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == sParam) 
        {
            return sParameterName[1];
        }
    }
}
function redraw_map(){
  var vertCount = colorizeFeatures(zonetiles);          
  tileIndex = geojsonvt(zonetiles, tileOptions);
  tileLayer.addTo(map);
  tileLayer.redraw();  
}

var chartdata = {}

d3.csv("/root/"+GetURLParameter("scenario")+"/BarChartAndMapData.csv", function(data) {
  var i=0;
  $.each(data[0], function(key, value) {
      if(i===1) zonename = key;
      if(i==2) dataname = key;
      i++;
  });
  $("#attribute_label").html(dataname);
  data.forEach(function(d) {
    if(d[dataname] != "TOTAL"){
      if($.inArray(d[dataname], modes) =="-1"){
        modes.push(d[dataname]);
        $("#attribute").append("<option>"+d[dataname]+"</option>")
      }
      if(chartdata[d[zonename]] == null) chartdata[d[zonename]] = []; 
      var updated = 0;
      for (var i=0; i<chartdata[d[zonename]].length; i++) {
        if (chartdata[d[zonename]][i].name == d[dataname]) {
          chartdata[d[zonename]][i].val += parseInt(d.QUANTITY);
          updated = 1;
          break;
        }
      }
      if(updated ===0) chartdata[d[zonename]].push({'name':d[dataname], 'val':parseInt(d.QUANTITY)});
    }
    if(zonedata[d.ZONE] == null){
      zonedata[d.ZONE] = {};
    }
    zonedata[d.ZONE][d[dataname]] = {"COUNTY":d[zonename], "QUANTITY":d.QUANTITY};
    if(dataitems[d[dataname]] == null) dataitems[d[dataname]] = [];
    dataitems[d[dataname]].push(parseInt(d.QUANTITY));
  });
  for (var key in chartdata) {
    $("#chart_selection").append("<option>"+key+"</option>")
  }
  $("#chart_selection").chosen();
  display_charts();
});

//load tiles
$.getJSON( "../scripts/ZoneShape.GeoJSON", function( json ) {
  zonetiles = json;
  baselayer = L.geoJson(zonetiles);
  setTimeout(function(){
    redraw_map();
  }, 2000);
});  

function updateColors(values, themax) {
  var colors = [color1, color2, color3, color4];
  var colorstops = colors[0] + ", "; // start left with the first color
  for (var i=0; i< values.length; i++) {
    colorstops += colors[i] + " " + (values[i]/(themax/100.0)) + "%,";
    colorstops += colors[i+1] + " " + (values[i]/(themax/100.0)) + "%,";
  }
  // end with the last color to the right
  colorstops += colors[colors.length-1];
  var css = "";
  if( navigator.userAgent.toLowerCase().indexOf('firefox') > -1 ){
      //mozilla
      css = '-moz-linear-gradient(left,' + colorstops + ')';
  }else if(navigator.userAgent.toLowerCase().indexOf('chrome') > -1 || navigator.userAgent.toLowerCase().indexOf('safari') > -1){
    // Safari 5.1, Chrome 10+ 
    css = '-webkit-linear-gradient(left,' + colorstops + ')';
  }else{
    //ie
    css = '-ms-linear-gradient(left,' + colorstops + ')';
  }
  
  $('#slider').css('background-image', css);
}
var interval;
var currentval = 0;
$(document).ready(function(){

  $("#chart_selection").change(function(){
    $('#chart_selection :selected').each(function(i, selected){ 
        var bars = d3.select(".chart").selectAll("g");
        bars.remove();
        display_charts();
    });



  });
  //Logic for cycling through the maps
  $("#start_cycle_map").click(function(){
    $("#stop_cycle_map").css("display", "inline");
    $("#start_cycle_map").css("display", "none");
    interval = setInterval(function(){
      $('#attribute option:eq(' +currentval+ ')').prop('selected', true); 
      redraw_map();
      currentval ++;
      if(currentval >= $("#attribute option").size())
        currentval = 0;
    }, 5000);
  });
  $("#stop_cycle_map").click(function(){
    clearInterval(interval);
    $("#stop_cycle_map").css("display", "none");
    $("#start_cycle_map").css("display", "inline");
  });


  map = L.map('map').setView(center,9);

  //B&W stylized background map
  var Stamen_TonerLite = L.tileLayer('http://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}.png', {
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: 'abcd',
    minZoom: 0,
    maxZoom: 20,
    ext: 'png'
  });
  Stamen_TonerLite.addTo(map);

  tileOptions = {
    maxZoom: 20,  
    tolerance: 5, 
    extent: 4096, 
    buffer: 64,   
    debug: 0,     
    indexMaxZoom: 0,
    indexMaxPoints: 100000,
  };

  map.on('click', function(e) {
    var layer = leafletPip.pointInLayer(e.latlng,baselayer, true);
    currentCounty = zonedata[layer[0].feature.properties.id][modes[0]].COUNTY;
    redraw_map();
    chart.selectAll("text.label").style('font-size',"15px");
    chart.selectAll("text").filter(function(){
      return this.innerHTML==currentCounty; 
    }).style('font-size',"20px");
  });

  $("#update_map").click(function(){
    var slider_values = $("#slider").slider("values");
    $("#val2").val(slider_values[0]);
    $("#val3").val(slider_values[1]);
    $("#val4").val(slider_values[2]);
    redraw_map();
  });

  //value slider
  $("#slider").slider({
    range:false,
    min: 0,
    max: 100,
    values: handlers,
    create:function(event, ui){
      $('.ui-slider-handle:first').html('<div class="tooltip top slider-tip"><div class="tooltip-arrow"></div><div class="tooltip-inner">' + handlers[0] + '</div></div>');
      $('.ui-slider-handle:eq(1)').html('<div class="tooltip top slider-tip"><div class="tooltip-arrow"></div><div class="tooltip-inner">' + handlers[1] + '</div></div>');
      $('.ui-slider-handle:last').html('<div class="tooltip top slider-tip"><div class="tooltip-arrow"></div><div class="tooltip-inner">' + handlers[2] + '</div></div>');
    },
    slide: function (event, ui) {
      var themax =$("#slider").slider( "option", "max" );
      updateColors(ui.values, themax);
      $('.ui-slider-handle:first').html('<div class="tooltip top slider-tip"><div class="tooltip-arrow"></div><div class="tooltip-inner">' + ui.values[0] + '</div></div>');
      $('.ui-slider-handle:eq(1)').html('<div class="tooltip top slider-tip"><div class="tooltip-arrow"></div><div class="tooltip-inner">' + ui.values[1] + '</div></div>');
      $('.ui-slider-handle:last').html('<div class="tooltip top slider-tip"><div class="tooltip-arrow"></div><div class="tooltip-inner">' + ui.values[2] + '</div></div>');
    }
  });
  updateColors(handlers, $("#slider").slider( "option", "max" ));

  $("#attribute").change(function () {
    redraw_map();
  });

  $("#classification").change(function(){
    redraw_map();
  });

  //color selectors
  $("#color1").spectrum({
    color: color1,
    showInput: true,
    className: "full-spectrum",
    showInitial: true,
    showPalette: true,
    showSelectionPalette: true,
    maxSelectionSize: 10,
    preferredFormat: "hex",
    localStorageKey: "spectrum.demo",
    palette: palette,
    change:function(color){ 
      color1 = color;
      redraw_map();
      updateColors($("#slider").slider("values"));
    }
  });

  $("#color2").spectrum({
    color: color2,
    showInput: true,
    className: "full-spectrum",
    showInitial: true,
    showPalette: true,
    showSelectionPalette: true,
    maxSelectionSize: 10,
    preferredFormat: "hex",
    localStorageKey: "spectrum.demo",
    palette: palette,
    change:function(color){ 
      color2 = color;redraw_map();
      updateColors($("#slider").slider("values")); }
  });

  $("#color3").spectrum({
    color: color3,
    showInput: true,
    className: "full-spectrum",
    showInitial: true,
    showPalette: true,
    showSelectionPalette: true,
    maxSelectionSize: 10,
    preferredFormat: "hex",
    localStorageKey: "spectrum.demo",
    palette: palette,
    change:function(color){ 
      color3 = color;redraw_map() 
      updateColors($("#slider").slider("values"));
    }
  });

  $("#color4").spectrum({
    color: color4,
    showInput: true,
    className: "full-spectrum",
    showInitial: true,
    showPalette: true,
    showSelectionPalette: true,
    maxSelectionSize: 10,
    preferredFormat: "hex",
    localStorageKey: "spectrum.demo",
    palette: palette,
    change:function(color){ 
      color4 = color;redraw_map();
      updateColors($("#slider").slider("values"));}
  });

  $("#nacolor").spectrum({
    color: nacolor,
    showInput: true,
    className: "full-spectrum",
    showInitial: true,
    showPalette: true,
    showSelectionPalette: true,
    maxSelectionSize: 10,
    preferredFormat: "hex",
    localStorageKey: "spectrum.demo",
    palette: palette,
    change:function(color){ 
      nacolor = color;redraw_map();
      updateColors($("#slider").slider("values")); 
    }
  });
});

//hex to rgb for handling transparancy     
function hexToRgb(hex) {
  var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, function(m, r, g, b) {
    return r + r + g + g + b + b;
  });

  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

//main map display function
function colorizeFeatures(data) {
  var attribute = $('#attribute').val();

  var serie = new geostats(dataitems[attribute]);
  
  //handle the different classifications
  var classification = $("#classification").val();
  var break_up;
  if(classification ==="even_interval"){
    break_up = serie.getClassEqInterval(4);
    $("#val1").val(break_up[0]);  
    $("#val2").val(break_up[1]);
    $("#val3").val(break_up[2]);
    $("#val4").val(break_up[3]);
    $("#val5").val(break_up[4]);
    var new_values = [parseInt(break_up[1]),parseInt(break_up[2]),parseInt(break_up[3])]
    //update the slider
    $("#slider" ).slider({
      min:break_up[0],
      max:break_up[4],
      values: new_values
    });
    $('.ui-slider-handle:first').html('<div class="tooltip top slider-tip"><div class="tooltip-arrow"></div><div class="tooltip-inner">' + new_values[0] + '</div></div>');
    $('.ui-slider-handle:eq(1)').html('<div class="tooltip top slider-tip"><div class="tooltip-arrow"></div><div class="tooltip-inner">' + new_values[1] + '</div></div>');
    $('.ui-slider-handle:last').html('<div class="tooltip top slider-tip"><div class="tooltip-arrow"></div><div class="tooltip-inner">' + new_values[2] + '</div></div>');
    updateColors(new_values, break_up[4]);
  } 

  if(classification ==="quantiles"){
    break_up = serie.getClassQuantile(4);
    $("#val1").val(break_up[0]);  
    $("#val2").val(break_up[1]);
    $("#val3").val(break_up[2]);
    $("#val4").val(break_up[3]);
    $("#val5").val(break_up[4]);
    //update the slider
    var new_values = [parseInt(break_up[1]),parseInt(break_up[2]),parseInt(break_up[3])]
    $("#slider" ).slider({
      min:break_up[0],
      max:break_up[4],
      values: new_values
    });
    $('.ui-slider-handle:first').html('<div class="tooltip top slider-tip"><div class="tooltip-arrow"></div><div class="tooltip-inner">' + new_values[0] + '</div></div>');
    $('.ui-slider-handle:eq(1)').html('<div class="tooltip top slider-tip"><div class="tooltip-arrow"></div><div class="tooltip-inner">' + new_values[1] + '</div></div>');
    $('.ui-slider-handle:last').html('<div class="tooltip top slider-tip"><div class="tooltip-arrow"></div><div class="tooltip-inner">' + new_values[2] + '</div></div>');
    updateColors(new_values, break_up[4]);
  } 

  if(classification ==="custom") break_up = [$("#val1").val(), $("#val2").val(),$("#val3").val(),$("#val4").val(),$("#val5").val()];

  var counter = 0;
  for (var i = 0; i < data.features.length; i++) {
    var color = nacolor;
    if(zonedata[data.features[i].properties.id] != null){
      if(zonedata[data.features[i].properties.id][attribute] != null){
        if(parseInt(zonedata[data.features[i].properties.id][attribute]["QUANTITY"]) >= break_up[0]){ 
          color=color1;
        }
        if(parseInt(zonedata[data.features[i].properties.id][attribute]["QUANTITY"]) >= break_up[1]){ 
          color=color2;
        }
        if(parseInt(zonedata[data.features[i].properties.id][attribute]["QUANTITY"]) >= break_up[2]){ 
          color=color3;
        }
        if(parseInt(zonedata[data.features[i].properties.id][attribute]["QUANTITY"]) >= break_up[3]){ 
          color=color4;
        }
      }
    }
    if(color != nacolor){
      if(zonedata[data.features[i].properties.id][attribute].COUNTY == currentCounty){
        if(color.toHex != null){
          color = color.toHex();
        }
        var rgb = hexToRgb(color);
        color="rgba("+rgb.r+","+ rgb.g+","+rgb.b+",0.4)";
      }
    }
    data.features[i].properties.color = color;
  }
  return counter;
}

var tileLayer = L.canvasTiles()
.params({ debug: false, padding: 5 })
.drawing(drawingOnCanvas);



var pad = 0;
/* map helper function */
function drawingOnCanvas(canvasOverlay, params) {

    var bounds = params.bounds;
    params.tilePoint.z = params.zoom;

    var ctx = params.canvas.getContext('2d');
    ctx.globalCompositeOperation = 'source-over';

    var tile = tileIndex.getTile(params.tilePoint.z, params.tilePoint.x, params.tilePoint.y);
    if (!tile) {
        return;
    }
    ctx.clearRect(0, 0, params.canvas.width, params.canvas.height);
    var features = tile.features;
    ctx.strokeStyle = 'grey';
    ctx.lineWidth = 0;

    for (var i = 0; i < features.length; i++) {
        var feature = features[i],
            type = feature.type;
        ctx.fillStyle = feature.tags.color ? feature.tags.color : 'rgba(255,0,0,0.05)';
        ctx.beginPath();

        for (var j = 0; j < feature.geometry.length; j++) {
            var geom = feature.geometry[j];

            if (type === 1) {
                ctx.arc(geom[0] * ratio + pad, geom[1] * ratio + pad, 2, 0, 2 * Math.PI, false);
                continue;
            }
            for (var k = 0; k < geom.length; k++) {
                var p = geom[k];
                var extent = 4096;
                var x = p[0] / extent * 256;
                var y = p[1] / extent * 256;
                if (k) ctx.lineTo(x  + pad, y   + pad);
                else ctx.moveTo(x  + pad, y  + pad);
            }
        }
        if (type === 3 || type === 1) ctx.fill('evenodd');
        if($("#stroke").is(":checked"))
          ctx.stroke();
    }
}
      
var display_chart_dic = {};

//main chart function
var invisible = [];
var data;

function display_charts(){
  //prepare data
  var labels = [];
  var series = [];

  for (var key in chartdata) {
    var use = false;
    $('#chart_selection :selected').each(function(i, selected){ 
          if(key == $(selected).text() || $(selected).text() == "All"){
            use = true;
          }
      });      
    if(use){
      labels.push(key);
    }
  }
  //for each type
  //add all the values in the order of the labels
  for(var mode in modes){
    var vals = [];
    for(var key in chartdata){
      var use = false;
      $('#chart_selection :selected').each(function(i, selected){ 
          if(key == $(selected).text()  || $(selected).text() == "All"){
            use = true;
          }
      });      
      if(use){
        for(var i=0;i<chartdata[key].length;i++){
          if(chartdata[key][i].name == modes[mode]){
            if(chartdata[key][i].val != null){
              vals.push(chartdata[key][i].val);
            }
          }
        }
    }
    }

    series.push({
      label:modes[mode],
      values:vals
    });
  }
  
  data = {
    labels: labels,
    series:series
  };

  var chartWidth       = 420,
      barHeight        = 2,
      groupHeight      = (barHeight) * data.series.length,
      gapBetweenGroups = 2,
      spaceForLabels   = 100,
      spaceForLegend   = 150;

  var zippedData = [];
  for (var i=0; i<data.labels.length; i++) {
    for (var j=0; j<data.series.length; j++) {
      zippedData.push(data.series[j].values[i]);
    }
  }

  var color = d3.scale.category20();
  var chartHeight = barHeight * zippedData.length + gapBetweenGroups * data.labels.length;

  var x = d3.scale.linear()
      .domain([0, d3.max(zippedData)])
      .range([0, chartWidth]);

  var y = d3.scale.linear()
      .range([chartHeight + gapBetweenGroups, 0]);

  var yAxis = d3.svg.axis()
      .scale(y)
      .tickFormat('')
      .tickSize(0)
      .orient("left");

  chart = d3.select(".chart")
   .attr("preserveAspectRatio", "xMinYMin meet")
   .attr("viewBox", "0 0 550 "+(chartHeight+gapBetweenGroups*data.labels.length+20+200))
   .classed("svg-content-responsive", true); 

  var bar = chart.selectAll("g")
      .data(zippedData)
      .enter().append("g")
      .attr("class", function(c, i){ return "g"+(i%data.series.length)})
      .attr("transform", function(d, i) {
        return "translate(" + spaceForLabels + "," + (i * barHeight + gapBetweenGroups * (0.5 + Math.floor(i/data.series.length))) + ")";
      });

  bar.append("rect")
      .attr("fill", function(d,i) { return color(i % data.series.length); })
      .attr("class", function(c, i){ return "bar"+(i%data.series.length)})
      .attr("width", x)
      .attr("height", barHeight);

  bar.append("text")
      .attr("class", "label")
      .attr("x", function(d) { return - 10; })
      .attr("y", groupHeight / 2)
      .attr("dy", ".35em")
      .text(function(d,i) {
        if (i % data.series.length === 0)
          return data.labels[Math.floor(i/data.series.length)];
        else
          return ""})
      .on("click", function(d, i) { 
        if (i % data.series.length === 0)
          currentCounty = data.labels[Math.floor(i/data.series.length)];
          redraw_map();
          chart.selectAll("text.label").style('font-size',"15px");
          chart.selectAll("text").filter(function(){
            return this.innerHTML==currentCounty; 
          }).style('font-size',"20px");
      });

  var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom")
      .innerTickSize(-662)
      .outerTickSize(0)
      .ticks(5);
  
   chart.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate("+spaceForLabels+"," + (chartHeight) + ")") 
      .call(xAxis);

  chart.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(" + spaceForLabels + ", " + -gapBetweenGroups/2 + ")")
    .call(yAxis);

  var legendRectSize = 18,
      legendSpacing  = 4;

  var legend = chart.selectAll('.legend')
      .data(data.series)
      .enter()
      .append('g')
      .attr('transform', function (d, i) {
          var height = legendRectSize + legendSpacing;
          var offset = -gapBetweenGroups/2;
          var vert = (parseInt(i/3))*height-offset+(chartHeight+gapBetweenGroups*data.labels.length-20+30);
          var w = 140*(i%3) +spaceForLabels;
          return 'translate(' + w + ',' + vert + ')';
      });
  //legend colors
  legend.append('rect')
      .attr('width', legendRectSize)
      .attr('height', legendRectSize)
      .style('fill', function (d, i) { return color(i); })
      .style('stroke', function (d, i) { return color(i); })
      .on("click", function(d, i){

        if(invisible.indexOf(i)<0){
          var bars = d3.select(".chart").selectAll(".bar"+i).data(data);
          bars.exit().remove();
          invisible.push(i); 
        }else{
          var bar = chart.selectAll(".g"+i)
            .append("rect")
              .attr("fill", function() { return color(i % data.series.length); })
              .attr("class", function(){ return "bar"+(i%data.series.length)})
              .attr("width", x)
              .attr("height", barHeight);
          invisible =  $.grep(invisible, function(value){return value != i});          
        }
      });

  legend.append('text')
      .attr('class', 'legend')
      .attr('x', legendRectSize + legendSpacing)
      .attr('y', legendRectSize - legendSpacing)
      .text(function (d) { return d.label; });
}