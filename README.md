# ABMVIZ
ARC ABMVIZ HTML 5

# Adding New Scenario Data
1. Add the scenario name to the scenarios.csv definition file in the data folder
1. Create a new folder in the data folder with the scenario name
1. Copy in the required visualization data tables, each with the following set of fields:
  - BarChartAndMapData.csv: ZONE, COUNTY, BAR, QUANTITY  
  - TimeUseData.csv: PERSON_TYPE, PER, ORIG_PURPOSE, QUANTITY
  - 3DAnimatedMapData.csv: ZONE, PER, QUANTITY
  - TreeMapData.csv: GROUP1, GROUP2, GROUP3, ..., QUANTITY
  - RadarChartsData.csv: AXIS, CHART, QUANTITY
  - BarChartData.csv: BARGROUP, COLUMNS, QUANTITY

# Data folder
1. scenarios.csv - Defines each scenario (i.e. model run) available to the user
2. BS10 - Example scenario data folder with its name equal to its scenarios.csv entry
3. ZoneShape.GeoJSON - ARC TAZs geojson feature collection with the id property equal to the TAZ number
4. cb_2015_us_county_500k GEORGIA.json - Counties from [Census](https://www.census.gov/geo/maps-data/data/cbf/cbf_counties.html); converted to json with [mapshaper](http://www.mapshaper.org)

# BS10 example scenario folder
1. BarChartAndMapData.csv - demo data source for the bar chart and map visual - trips by origin zone, county, and mode
2. TimeUseData.csv - demo data source for the time use visual - persons by type, hour of the day, activity purpose
3. 3DAnimatedMapData.csv - demo data source for the 3D animated map visual - persons not at home by zone, hour of the day
4. TreeMapData.csv - demo data source for the tree map visual - trips by mode groups and mode
5. RadarChartsData.csv - demo data source for the radar charts visual - four summaries, jobs housing balance, accessible employment, transit mode share, and zero car transit trips per household
5. BarChartData.csv - demo data source for the bar chart visual - activity patterns by person type

# Scripts folder
1. convertWKTtoGEOJSON.R - R script to convert the old ABMVIZ wellknowntext format TAZ polygons to GeoJSON
4. BarChartAndMapExample.sql - SQL script to query the ABMVIZ DB to produce the bar chart and map visual demo data set
5. TimeUseExample.sql - SQL script to query the ABMVIZ DB to produce the time use visual demo data set
6. 3DAnimatedMapExample.sql - SQL script to query the ABMVIZ DB to produce the 3D animated map demo data set
7. TreeMapExample.sql - SQL script to query the ABMVIZ DB to produce the tree map visual demo data set
8. RadarChartsExample.sql - SQL script to query the ABMVIZ DB to produce the radar charts visual demo data set
9. BarChartExample.sql - SQL script to query the ABMVIZ DB to produce the bar chart visual demo data set

# Exporting demo data set from SQL Server
1. Open SQL server management studio
2. Open one of the example SQL query scripts such as BarChartAndMapExample.sql
3. Set the user - [ATLANTAREGION\TAMConsult] - and schema (i.e. scenario) - BS10 - to query
4. Execute the script
5. Right click in the upper left corner of the results table and select Copy with Headers
6. Paste the result in Excel and save as a CSV file into the relevant data\scenario folder

# Run demo
1. Requires a http server such as Python's SimpleHTTPServer
2. Run the http server from this project directory: 
  - Python 2: python -m SimpleHTTPServer
  - Python 3: python -m http.server
3. Go to http://localhost:8000 in your browser 

# Publish site as github pages under RSG account
1. Push the master branch to a branch called gh-pages
2. Site address is http://rsginc.github.io/ABMVIZ

# Publish site as github pages under ARC account
1. Notify ARC's IT group 
2. ARC clone the repo to their GitHub account - https://github.com/atlregional
3. ARC push the master branch to a branch called gh-pages
2. Site address is http://atlregional.github.io/ABMVIZ
