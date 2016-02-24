# ABMVIZ
ARC ABMVIZ HTML 5

#Root folder
1. scenarios.csv - Defines each scenario (i.e. model run) available to the user
2. BS10 - Example scenario folder with its name equal to its scenarios.csv entry

#BS10 folder
1. BarChartAndMapData.csv - demo data source for the bar chart and map visual - trips by origin zone and mode

#Scripts folder
1. ZoneShape.GeoJSON - ARC TAZs geojson feature collection with the id property equal to the TAZ number
2. convertWKTtoGEOJSON.R - R script to convert the old ABMVIZ wellknowntext format TAZ polygons to GeoJSON
3. TripsByZoneMode.sql - SQL script to query the ABMVIZ database to produce the demo data set

#Exporting demo data set from SQL Server
1. Open SQL server management studio
2. Open TripsByZoneMode.sql and set the user - [ATLANTAREGION\TAMConsult] - and schema (i.e. scenario) to query - BS10
3. Execute the script
4. Right click in the upper left corner of the results table and select Copy with Headers
5. Paste the result in Excel and save as a CSV file into the relevant scenario folder

#Run demo
1. Requires a http server such as Python's SimpleHTTPServer
2. Run the http server from this project directory: python -m SimpleHTTPServer
3. Go to http://localhost:8000 in your browser 
