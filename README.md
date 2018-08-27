# ABMVIZ
ABMVIZ is an interactive travel data visualization tool.  It is built with JavaScript 
and HTML5 technologies and works with various types of travel data - household travel surveys, trip-based
model outputs, activity-based model outputs, disaggregate passive data, etc.  The dashboard features several 
interactive and customizable visualizations for exploring data, such as 3D maps of 
trips in time and space, time use by person type and activity, radar charts for performance measure analysis, 
sunburst diagrams for visualizing mode shares, and animated bubble maps.  ABMVIZ is published using GitHub 
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

1. Create a new folder in the region specific folder with the scenario name
2. Copy in the data tables that supply the data for the visualizations, each with the following set of fields:
  - BarChartAndMapData.csv: ZONE, COUNTY, <BAR  LABEL>, QUANTITY  
  - TimeUseData.csv: GROUP, TIME PERIOD, PURPOSE, QUANTITY
  - 3DAnimatedMapData.csv: ZONE, PERIOD, QUANTITY
  - TreeMapData.csv: GROUP1, GROUP2, GROUP3, ..., QUANTITY
  - RadarChartsData.csv: AXIS, CHART, <QUANTITY 1 LABEL>, <QUANTITY 2 LABEL>, ...
  - BarChartData.csv: BARGROUP, COLUMNS, QUANTITY, CHART 

Note that all the data tables are not required and each data table is used to populate a specific visual.  Take 
a look at the example data tables to see how each visual is constructed based on the data.  Most of the 
visuals are populated based by what is in the data tables, thereby making the visuals highly customizable.  The
PERIOD entries for TimeUse and 3DAnimatedMap are 1 to 48 and represent 30 minute periods from 3am to 3am the 
next day.  The TimeUse purposes must be ALLCAPS and must include atleast HOME, WORK, SCHOOL.

# Data/Region Folder
Each Data/Region folder needs the following:
1. region.json - Region specific config file:
    - Title: Title that shows up in tab of web page
    - CountyFile: Name of the file with the county data
    - ZoneFile: Name of the file with the zone data
    - Icon: ico format agency logo image file stored in the img folder (use an online converter from png if needed)
    - Logo: png format agency logo image file stored in the img folder 
    - NavbarTitle: Abbreviated name to appear in the navbar
    - LinkURL: URL of the link that appears in navbar
    - CenterMap: Lat/Lng in decimal degree of the center point for the maps to use
    - FrontPageTitle: Text to appear about region scenarions on front page
    - visualizations: true/false flag for each visualization to set default value for visuals by region    
    - scenarios: Defines each scenario (i.e. model run) available to the user
    - RadarCharts: Radar Chart specific properties:
        - NumberColsRadar: Number of radar chart columns that should appear per row (up to 4)
        - IndependentScale: Names of charts to separate into second scale and collection of axes
        - ConvertAxesToPercent: true/false flag that will convert the radar charts to a percent of the highest value  
    - GroupedCharts: Grouped Bar Chart specific properties:
        - BarSpacing: The space between the bars on the chart, default is 0.2, range is between 0.1 and 1.0.
        - RotateLabels: Number of degrees to rotate the labels on the Y-Axis for the non-vertical chart.  Default is 0 can go from -90 to 90. 
        - NumberColsGrouped: Number of grouped bar chart columns that should appear per row 
        - SwapLegendByDefault: (true/false or "N/A" to hide) flag that swaps the bar and legend by default for all grouped charts
        - ShowAsPercentByDefault: (true/false or "N/A" to hide) flag that shows data as a percentage by default for all grouped charts
        - ShowAsVerticalByDefault: (true/false or "N/A" to hide) flag that shows the bar chart as vertical rather than horizontal by default for all charts
        - StackAllChartsByDefault: (true/false or "N/A" to hide) flag that shows all data as stacked rather than grouped by default for all charts
        - ChartWidthOverride: array of values to allow you to individually set each chart's width
    - ThreeDMap: 3d Map specific properties
        - ShowPeriodsAsDropdown: true/false flag that shows a dropdown to select different periods
        - DataHasPeriods: true/false flag to show or hide the time related features of the slider (true shows them, false hides)
        - ZoneFilterFile: takes a csv file that contains show/hide filters for each zone to be displayed
        - ZoneFilters: a list of zones and the display name for them that will be used, zone ids must match zone filter file columns
        - ZoneFilterLabel: a label to be shown above the list of zone filters     
    - GrpMap: Barchart that also displays with a map
        - BarSpacing: The space between the bars on the chart, default is 0.2, range is between 0.1 and 1.0.
        - RotateLabels: Number of degrees to rotate the labels on the Y-Axis.  Default is 0 can go from -90 to 90.
        - ZoneFilterFile: takes a csv file that contains show/hide filters for each zone to be displayed
        - ZoneFilters: a list of zones and the display name for them that will be used, zone ids must match zone filter file columns
        - ZoneFilterLabel: a label to be shown above the list of zone filters
        - CycleMapTools: true/false flag to hide or show the cycle map tools
3. Data Folder - Scenario data folder with its name equal to its scenario entry
4. ZoneShape.GeoJSON - Zone polygons with the *id* property equal to the zone number.  The open source [mapshaper](http://www.mapshaper.org) will convert and simplify a shapefile to geojson.
5. cb_2015_us_county_500k GEORGIA.json - County polygons with the *Name* property equal to the county name.

# Example Scenario Folder
1. BarChartAndMapData.csv - demo data source for the bar chart and map visual - trips by origin zone, county, and mode
2. TimeUseData.csv - demo data source for the time use visual - persons by type, hour of the day, activity purpose
3. 3DAnimatedMapData.csv - demo data source for the 3D animated map visual - persons not at home by zone, hour of the day
4. TreeMapData.csv - demo data source for the tree map visual - trips by mode groups and mode
5. RadarChartsData.csv - demo data source for the radar charts visual - four summaries, jobs housing balance, accessible employment, transit mode share, and zero car transit trips per household
6. BarChartData.csv - demo data source for the bar chart visual - activity patterns by person type

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
