# ABMVIZ
ABMVIZ is an interactive travel demand model output visualization tool.  It is built with JavaScript 
and HTML5 technologies and works with both trip-based and activity-based model data.  The dashboard features several 
innovative interactive and customizable visualizations for exploring model scenario results, such as 3D maps of 
trips in time and space, time use by person type and activity, radar charts for performance measure analysis, 
sunburst diagrams for visualizing trip mode shares, and animated bubble maps.  ABMVIZ is published using GitHub 
pages which eliminates most of the administrative backend in traditional systems.  This improved deployment 
strategy makes maintenance much easier for the modeling staff.

ABMVIZ was initially funded by the [Atlanta Regional Commission](https://atlantaregional.org/) (ARC).  

# Adding New Region
ABMVIZ supports configuration for multiple regions.  To setup ABMVIZ in your region, fork this repository
to your GitHub account and then remove the existing configured region folders in the data folder.  Next, add your
region by doing the following:

1. Add the region name and properties in the config.json file.  Delete the other existing regions if desired.
2. Add a new region folder in the data folder. For example: The region "atlanta" should have a folder named "atlanta" in the data folder.  
3. The first region with the property "default" set to true will determine which graphics are shown on the main page.

# Adding New Scenario Data
Each region supports data for multiple scenarios.  Do the following to add scenario data:

1. Add the scenario name to the scenarios.csv definition file in the region data folder
2. Create a new folder in the region specific folder with the scenario name
3. Copy in the data tables that supply the data for the visualizations, each with the following set of fields:
  - BarChartAndMapData.csv: ZONE, COUNTY, <BAR  LABEL>, QUANTITY  
  - TimeUseData.csv: GROUP, TIME PERIOD, PURPOSE, QUANTITY
  - 3DAnimatedMapData.csv: ZONE, PERIOD, QUANTITY
  - TreeMapData.csv: GROUP1, GROUP2, GROUP3, ..., QUANTITY
  - RadarChartsData.csv: AXIS, CHART, <QUANTITY 1 LABEL>, <QUANTITY 2 LABEL>, ...
  - BarChartData.csv: BARGROUP, COLUMNS, QUANTITY, CHART 

Note that all the data tables are not required and each data table is used to populate a specific visual.  Take 
a look at the example region data tables to see how each visual is constructed based on the data.  Most of the 
visuals are populated based by what is in the data tables, thereby making the visuals highly customizable.  

# Data/Region Folder
Each Data/Region folder needs the following:
1. region.json - Region specific config file:
    - Title: Title that shows up in tab of web page
    - CountyFile: Name of the file with the county data
    - ZoneFile: Name of the file with the zone data
    - NavbarTitle: Abbreviated name to appear in the navbar
    - LinkURL: URL of the link that appears in navbar
    - CenterMap: Lat/Lng of the center point for the maps to use
    - FrontPageTitle: Text to appear about region scenarions on front page
    - visualizations: true/false flag for each visualization to set default value for visuals by region
    - RadarCharts: Radar Chart specific properties:
        - NumberColsRadar: Number of radar chart columns that should appear per row (up to 4)
        - IndependentScale: Names of charts to separate into second scale and collection of axes
    - GroupedCharts: Grouped Bar Chart specific properties:
        - NumberColsGrouped: Number of grouped bar chart columns that should appear per row 
        - SwapLegendByDefault: true/false flag that swaps the bar and legend by default for all grouped charts
        - ShowAsPercentByDefault: true/false flag that shows data as a percentage by default for all grouped charts
        - ShowAsVerticalByDefault: true/false flag that shows the bar chart as vertical rather than horizontal by default for all charts
        - StackAllChartsByDefault: true/false flag that shows all data as stacked rather than grouped by default for all charts     
    - ThreeDMap: 3d Map specific properties
        - ShowPeriodsAsDropdown: true/false flag that shows a dropdown to select different periods     
2. scenarios.csv - Defines each scenario (i.e. model run) available to the user
3. BS10 - Example ARC scenario data folder with its name equal to its scenarios.csv entry
4. ZoneShape.GeoJSON - Example ARC TAZs geojson feature collection with the id property equal to the TAZ number.  The shapefile was converted to geojson with [mapshaper](http://www.mapshaper.org).
5. cb_2015_us_county_500k GEORGIA.json - Example ARC counties.  The shapefile was converted to geojson with [mapshaper](http://www.mapshaper.org).
    
# BS10 Example Scenario Folder
1. BarChartAndMapData.csv - demo data source for the bar chart and map visual - trips by origin zone, county, and mode
2. TimeUseData.csv - demo data source for the time use visual - persons by type, hour of the day, activity purpose
3. 3DAnimatedMapData.csv - demo data source for the 3D animated map visual - persons not at home by zone, hour of the day
4. TreeMapData.csv - demo data source for the tree map visual - trips by mode groups and mode
5. RadarChartsData.csv - demo data source for the radar charts visual - four summaries, jobs housing balance, accessible employment, transit mode share, and zero car transit trips per household
5. BarChartData.csv - demo data source for the bar chart visual - activity patterns by person type

# Example ARC Scripts Folder
These scripts convert the ARC model outputs to the input formats expected by the tool.  These are not used in anyway by the system.  
1. convertWKTtoGEOJSON.R - R script to convert the old ABMVIZ wellknowntext format TAZ polygons to GeoJSON.  [Mapshaper](http://www.mapshaper.org) is a better alternative.
4. BarChartAndMapExample.sql - SQL script to query the ABMVIZ DB to produce the bar chart and map visual demo data set
5. TimeUseExample.sql - SQL script to query the ABMVIZ DB to produce the time use visual demo data set
6. 3DAnimatedMapExample.sql - SQL script to query the ABMVIZ DB to produce the 3D animated map demo data set
7. TreeMapExample.sql - SQL script to query the ABMVIZ DB to produce the tree map visual demo data set
8. RadarChartsExample.sql - SQL script to query the ABMVIZ DB to produce the radar charts visual demo data set
9. BarChartExample.sql - SQL script to query the ABMVIZ DB to produce the bar chart visual demo data set

To create the ARC demo data from SQL Server, do the following:
1. Open SQL server management studio
2. Open one of the example SQL query scripts such as BarChartAndMapExample.sql
3. Set the user - [ATLANTAREGION\TAMConsult] - and schema (i.e. scenario) - BS10 - to query
4. Execute the script
5. Right click in the upper left corner of the results table and select Copy with Headers
6. Paste the result in Excel and save as a CSV file into the relevant data\scenario folder

# How to Run the Website Locally
1. Run the Python http server from this project directory via the following command:
  - Python 2: python -m SimpleHTTPServer
  - Python 3: python -m http.server
2. Go to http://localhost:8000 in your browser 

# How to Publish the Site via GitHub Pages under the RSG account
1. Push the master branch to a branch called gh-pages
2. Site address is http://rsginc.github.io/ABMVIZ

# How to Publish the Site via GitHub Pages under your account
1. Fork the repo to your GitHub account, for example https://github.com/atlregional
2. Make changes, such as removing the other example regions
3. Push the master branch to a branch called gh-pages
4. Site address is http://<your_account>.github.io/ABMVIZ, for example http://atlregional.github.io/ABMVIZ

# Collaborating on this Project
1. The master branch is the release / stable version, the develop branch is for development, and gh-pages is the current published demo
2. To make contributions, fork the repo, make revisions, and issue a pull request to develop.
3. Once contributions are acceptable, then we will merge develop to master and then master to gh-pages