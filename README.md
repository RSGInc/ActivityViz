# ActivityViz 
ActivityViz is an interactive travel and activity data visualization tool.  It is built with JavaScript technologies 
and works with various types of travel and activity data - household travel surveys, trip-based
model outputs, activity-based model outputs, disaggregate passive data, freight models, on-board surveys, etc.  

The dashboard features several interactive and customizable visualizations for exploring data, such as 3D maps of 
trips in time and space, time use by person type and activity, radar charts for performance measure analysis, 
sunburst diagrams for visualizing mode shares, animated bubble maps, chord diagrams for OD data, point-of-interest maps for
transit stop data, truck flow data, etc.  ActivityViz is published using GitHub pages which eliminates most of the 
administrative backend in traditional systems.  This improved deployment strategy makes maintenance much easier 
for data science users.

ActivityViz was initially funded by the [Atlanta Regional Commission](https://atlantaregional.org/) (ARC), with additional
support from [Oregon Metro](https://www.oregonmetro.gov/) and others.

## Collaborating on this Project
1. The master branch is the release / stable version, the develop branch is for development, and gh-pages is the current published demo
2. To make contributions, fork the repo, make revisions, and issue a pull request to develop.
3. Once contributions are acceptable, then we will merge develop to master and then master to gh-pages

# Adding a New Region or New Scenario Data
ActivityViz supports configuration for multiple regions.  To setup ActivityViz in your region:

1. Fork this repository to your GitHub account
2. Edit `config.json` for the desired region and data locations
3. Data locations can be stored local to the repository or online
    - Examples for a region named "rsginc":
        - Local: `"datalocation": "/data/rsginc/"`
        - Via GitHub: `"datalocation": "https://raw.githubusercontent.com/RSGINC/ActivityViz/master/data/rsginc/"`
4. The first region will determine which graphics are shown on the main page.
5. Copy an existing region.json file into the region folder.

## Adding New Scenario Data
Each region supports data for multiple scenarios.  Do the following to add scenario data:

1. Create a new folder in the region specific folder with the scenario name
2. Copy in the data tables that supply the data for the visualizations, each with the following set of fields:
  - BarChartAndMapData.csv: ZONE, COUNTY, <BAR_LABEL>, QUANTITY  
  - 3DAnimatedMapData.csv: ZONE, PERIOD, QUANTITY
  - TreeMapData.csv: GROUP1, GROUP2, GROUP3, ..., QUANTITY
  - RadarChartsData.csv: AXIS, CHART, <QUANTITY_1_LABEL>, <QUANTITY_2_LABEL>, ...
  - BarChartData.csv: BARGROUP, COLUMNS, QUANTITY, CHART 
  - ChordData.csv: FROM, TO, <QUANTITY_1_LABEL>, <QUANTITY_2_LABEL>, ... 
  - Scatter.csv: LABEL, XAXIS, YAXIS, SIZE (YAXIS/XAXIS)
  - PointofInterest.csv: POINTS OF INTEREST, FILTER, LAT, LNG, GROUPING, <QUANTY_1_LABEL>, <QUANTY_2_LABEL>, ...
  - TimeUseData.csv: GROUP, TIME PERIOD, PURPOSE, QUANTITY

Notes:   
  - All data tables are not required and each data table is used to populate a specific visual.  Take 
a look at the example data tables to see how each visual is constructed based on the data.  Most of the 
visuals are populated based by what is in the data tables, thereby making the visuals highly customizable.  
  - Avoid special characters such as space, slash, etc. in table data (column names and data entries).
  - TimeUse: The PERIOD entries for TimeUse and 3DAnimatedMap are 1 to 48 and represent 30 minute periods 
from 3am to 3am the next day.  The TimeUse purposes must be ALLCAPS and must include at least HOME, WORK, 
SCHOOL.  TimeUse must also include an ALL person types.
  
## Data/Region Folder
Each Data/Region folder needs the following:
1. region.json - Region specific config file:
    - Title: Title that shows up in tab of web page
    - CountyFile: Name of the geojson file with region counties
    - ZoneFile: Name of the geojson file with zones
    - Icon: ico format agency logo image file stored in the img folder (use an online converter from png if needed)
    - Logo: png format agency logo image file stored in the img folder (use an online converter from png if needed)
    - NavbarTitle: Name to appear in the navbar
    - LinkURL: URL of the link that appears in navbar
    - CenterMap: Lat/Lng in decimal degree of the center point for the maps to use
    - FrontPageTitle: Text to appear about region scenarions on front page
    - FrontPageGraphic: Image to appear on the front page next to the title text
    - SideBarTextLeft: Left bottom text box on web page
    - SideBarTextRight: Right bottom text box on web page
    - SideBarLogo: Web page top image to the right (omit if desired)
    - SideBarImage: Web page bottom image to the right
    - DefaultFocusColor: Sets the default color to use for the focused GeoJSON object if included on a map
    - DefaultHighlightColor: Sets the default color to use for highlighting filtered zones if included on a map
    - scenarios: Defines each scenario.  Each scenario is an object, the name of the scenario is the name of the object.
        - title: the sub text or title of the scenario that will appear along with the name on the front page
        - CenterMap: overrides the region specific center of map, will also focus in on the point rather than find best view
        - label: overrides the default scenario - title setup for the scenario and instead displays the label text in all cases
        - ScenarioFocus: filename of GeoJSON to be displayed on the maps (BarChart with Map, Point of Interest and Chord Map)
        - visualizations: set of visuals to be display on the scenario specific page, the order they are defined will determine the order of the tab
            - visuals are Sunburst, 3DMap, GroupedCharts (standard barcharts), TimeUse, RadarCharts, BarMap (barchart with map), Chord, and POIMap (barchart with POIs instead of zones)
            - Each visual title allows for an array of multiple charts. Each entry will be it's own tab on the scenario specific page.
            - Each chart object requires a "name", "config" (name of configuration set to use) and a "file" (filename that will contain the data). 
            - Optional chart properties: "info" - is is a tooltip to appear next to the chart title, "datafilecolumns" - a key/value object that will display underneath the data table on the bottom of the chart tab
            - Example of multiple visuals for single chart type:  "GroupedCharts": [{"name":"GroupedCharts","config":"Default", "file":"BarChartData.csv"},{"name":"GroupedCharts2","config":"Default", "file":"BarChartData2.csv"}],
    
    - Each chart type has a different entry for their specific configuration settings. You can set up several different configuration entries for each chart type. This lets you customize the each chart tab 
        The property entry is the name of the configuration, each chart needs to have at a minimum an empty (example: "BarMap": { "Default": {}  } ) configuration.
    - RadarCharts: Radar Chart specific configurations:
        - NumberColsRadar: Number of radar chart columns that should appear per row (up to 4)
        - IndependentScale: Names of charts to separate into second scale and collection of axes
        - ConvertAxesToPercent: true/false flag that will convert the radar charts to a percent of the highest value  
    - GroupedCharts: Grouped Bar Chart specific configurations:
        - BarSpacing: The space between the bars on the chart, default is 0.2, range is between 0.1 and 1.0.
        - RotateLabels: Number of degrees to rotate the labels on the Y-Axis for the non-vertical chart.  Default is 0 can go from -90 to 90.
        - NumberColsGrouped: Number of grouped bar chart columns that should appear per row 
        - SwapLegendByDefault: (true/false or "N/A" to hide) flag that swaps the bar and legend by default for all grouped charts
        - ShowAsPercentByDefault: (true/false or "N/A" to hide) flag that shows data as a percentage by default for all grouped charts
        - ShowAsVerticalByDefault: (true/false or "N/A" to hide) flag that shows the bar chart as vertical rather than horizontal by default for all charts
        - StackAllChartsByDefault: (true/false or "N/A" to hide) flag that shows all data as stacked rather than grouped by default for all charts
        - ChartWidthOverride: array of values to allow you to individually set each chart's width
    - 3DMap: 3D Map specific properties
        - ShowPeriodsAsDropdown: true/false flag that shows a dropdown to select different periods
        - DataHasPeriods: true/false flag to show or hide the time related features of the slider (true shows them, false hides)
        - ZoneFilterFile: takes a csv file with the first column named ID for zone ID that contains show/hide filters for each zone to be displayed
        - ZoneFilters: a list of zones and the display name for them that will be used, zone ids must match zone filter file columns
        - ZoneFilterLabel: a label to be shown above the list of zone filters
        - CentroidsOff: sets the default value for the centroids checkbox
    - BarMap: Barchart that also displays with a map with zones or bubbles 
        - BarSpacing: The space between the bars on the chart, default is 0.2, range is between 0.1 and 1.0.
        - RotateLabels: Number of degrees to rotate the labels on the Y-Axis.  Default is 0 can go from -90 to 90.
        - ZoneFilterFile: takes a csv file with the first column named ID for zone ID that contains show/hide filters for each zone to be displayed
        - ZoneFilters: a list of zones and the display name for them that will be used, zone ids must match zone filter file columns
        - ZoneFilterLabel: a label to be shown above the list of zone filters
        - CycleMapTools: true/false flag to hide or show the cycle map tools
        - ZoneFile: Name of the GeoJSON file with the zone data to display on map requires each feature to have a "NAME" property to link to data set
    - Chord: Chord chart that also displays with a map
        - DesireLinesOn: Flag that will turn the desire lines layer on the map by default, this will turn off the zone layer as well
        - ExcludeSameOD: Flag to exclude data points that have the same origin and destination
        - SideBySide: Flag to transform the chord tab into one that has multiple chord charts side by side, this will also remove the map from the page
        - ChartPerRow: Number of side by side chord charts to show on page.  Setup cannot handle more than 1 row of 4 or 5 charts
        - ZoneFilterFile: takes a csv file with the first column named ID for zone ID and that contains show/hide filters for each zone to be displayed, the labels of the zones MUST match the data FROM/TO labels
        - ZoneFile: Name of the GeoJSON file with the zone data to display on map requires each feature to have a "NAME" to link to data set, these zones will appear on the map color coded to the chord chart data points
        - LabelSize: the font size in pixels "10" is the default if not specified. 
        - LegendRows: the number of data points per row to be shown in the legend default is 4
        - LegendText: the text to show above the legend for the Chord chart and the title of the chart.
    - Scatter: Scatter chart that also shows a 45 degree regression line
    - POIMap: Barchart that displays a map that has points of interest plotted on the page, this chart also allows for a filter on the data not provided to the normal barchart and map 
        - BarSpacing: The space between the bars on the chart, default is 0.2, range is between 0.1 and 1.0.
        - RotateLabels: Number of degrees to rotate the labels on the Y-Axis.  Default is 0 can go from -90 to 90.
        - LegendTitle: Title shown above the legend of the bar chart
        - CenterMap: chart specific center lat/lng override, this will take precedence over the region and scenario level points
        - ZoneFile: Name of the GeoJSON file with the zone data to display on map requires each feature to have a "NAME" to link to data set
    - Sunburst: Sunburst tab specific configuration
        - ChartType: Determines which chart is shown on page, 1 for Sunburst, 2 for Pie Chart and 3 for Waffle Pie Chart
        - WaffleRow: Number of rows the waffle chart should have (default is 10)
        - WaffleColumn: Number of columns the waffle chart should have (default is 10 for 10x10 block)
        - BlockSize: Number of pixels each block in the waffle chart should have (default is 30)         
3. Data Folder - Scenario data folder with its name equal to its scenario entry, can either be local or in the cloud. Location of the region's scenario data folder is specified in the main config.json file 
4. Zones.geojson - Zone polygons with the *id* property equal to the zone number. Polygons also require the *NAME* property to display desire lines and link up with data sets.  The open source [mapshaper](http://www.mapshaper.org) will convert and simplify a shapefile to geojson.
5. Counties.geojson - County polygons with the *Name* property equal to the county name.

# Testing and Publishing 

## How to Run the Website Locally
1. Run the Python http server from this project directory via the following command:
  - Python 2: python -m SimpleHTTPServer
  - Python 3: python -m http.server
2. Go to http://localhost:8000 in your browser 

## How to Publish the Site via GitHub Pages under the RSG account
1. Push the master branch to a branch called gh-pages
2. Site address is http://rsginc.github.io/ActivityViz

## How to Publish the Site via GitHub Pages under your account
1. Fork the repo to your GitHub account, for example https://github.com/atlregional/ActivityViz
2. Make changes, such as removing the other example regions
3. Push the master branch to a branch called gh-pages
4. Site address is http://<your_account>.github.io/ActivityViz, for example http://atlregional.github.io/ActivityViz
