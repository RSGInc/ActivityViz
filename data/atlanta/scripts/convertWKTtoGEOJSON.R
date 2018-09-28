
#Convert ARC WKT polygons to geojson
#Ben Stabler, ben.stabler@rsginc.com, 12/08/15

library("wellknown")
library("geojsonio")

tazShapes = read.csv("C:/projects/ARC/prototype/ZoneShape.csv")

for (i in 1:nrow(tazShapes)) {

  #get ID and just polygon coordinates 
  id = tazShapes[i,1]
  points = wkt2geojson(tazShapes[i,2], fmt=6, feature=F)$coordinates[[1]]
  
  #convert to geojson list
  x = geojson_list(points, geometry="polygon")
    
  #add zone id  
  x$features[[1]]$properties = list(id=id)

  #add to existing feature collection
  if(i==1) {
    fc = x  
  } else {
    fc = fc + x
  }

}

#write feature collection
geojson_write(fc, file="C:/projects/ARC/prototype/ZoneShape.GeoJSON")

