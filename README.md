# ABMVIZ
ABMVIZ HTML 5

# Adding New Region
1. Add the region name and properties in the config.json file.
2. Add a new region folder in the data folder. For example: The region "atlanta" should have a 
    folder named "atlanta" in the data folder.  
3. The first region with the property default set to true will determine which graphics are shown on the main page.
# Adding New Scenario Data
1. Add the scenario name to the scenarios.csv definition file in the data folder
2. Create a new folder in the region specific folder with the scenario name
3. Copy in the required visualization data tables, each with the following set of fields:
  - BarChartAndMapData.csv: ZONE, COUNTY, BAR (Label for Quantity), QUANTITY  
  - TimeUseData.csv: GROUP, TIME PERIOD, PURPOSE, QUANTITY
  - 3DAnimatedMapData.csv: ZONE, PERIOD, QUANTITY
  - TreeMapData.csv: GROUP1, GROUP2, GROUP3, ..., QUANTITY
  - RadarChartsData.csv: AXIS, CHART, QUANTITY 1, QUANTITY 2, ... (Where Quantity 1 is the label for the data)
  - BarChartData.csv: BARGROUP, COLUMNS, QUANTITY, CHART 

# Data Region folder
2. BS10 - Example scenario data folder with its name equal to its region.json entry
3. ZoneShape.GeoJSON - ARC TAZs geojson feature collection with the id property equal to the TAZ number
4. cb_2015_us_county_500k GEORGIA.json - Counties from [Census](https://www.census.gov/geo/maps-data/data/cbf/cbf_counties.html); converted to json with [mapshaper](http://www.mapshaper.org)
5. region.json - Region specific config file:
    - Title: Title that shows up in tab of web page
    - CountyFile: Name of the file with the county data
    - ZoneFile: Name of the file with the zone data
    - NavbarTitle: Abbreviated name to appear in the navbar
    - LinkURL: URL of the link that appears in navbar
    - CenterMap: Lat/Lng of the center point for the maps to use Example: '[33.75424,-84.384774]'
    - FrontPageTitle: Text to appear about region scenarions on front page
    - FrontPageGraphic: Graphic to appear on front page next to title
    - visualizations: true/false flag for each visualization to set default value for visuals by region
    - scenarios: List of scenarios and their descriptions. Example: "I205":"- I205 minus NoBuild" In this example I205 must correspond to a scenario folder within the region directory
    - RadarCharts: Radar Chart specific properties:
        - NumberColsRadar: Number of radar chart columns that should appear per row (up to 4)
        - IndependentScale: Names of charts to separate into separate independent scales and collection of axes
        - ConvertAxesToPercent: true/false flag to indicate whether the values on the radar chart should be a % of max value or just the value
    - GroupedCharts: Grouped Bar Chart specific properties:
        - NumberColsGrouped: Number of grouped bar chart columns that should appear per row 
        - SwapLegendByDefault: true/false flag that swaps the bar and legend by default for all grouped charts
        - ShowAsPercentByDefault: true/false flag that shows data as a percentage by default for all grouped charts
        - ShowAsVerticalByDefault: true/false flag that shows the bar chart as vertical rather than horizontal by default for all charts
        - StackAllChartsByDefault: true/false flag that shows all data as stacked rather than grouped by default for all charts     
    
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
