
# create abmviz input files from daysim outputs
# Ben Stabler, ben.stabler@rsginc.com, 07/31/18
# model test folder - C:\projects\development\sacog_daysim_test\daysim\sacog_regress_output
# survey test folder - C:\projects\sacog\daysim_survey_files

import pandas as pd
import numpy as np

################################################################################

# inputs

# model
trips_filename = '_trip.tsv'
households_filename = '_household.tsv'
persons_filename = '_person.tsv'
person_days_filename = '_person_day.tsv'
sep= "\t"
convert_times_to_minpastmid = False

# survey
trips_filename = 'sacog_tripx.dat'
households_filename = 'sacog_hhrecx.dat'
persons_filename = 'sacog_precx.dat'
person_days_filename = 'sacog_pdayx.dat'
sep= " "
convert_times_to_minpastmid = True

counties_filename = 'SACOG_counties.csv'
chord_districts_filename = 'districts.csv'

# outputs
animatedmap_filename = '3DAnimatedMapData.csv'
barchartandmap_filename = 'BarChartAndMapData.csv'
barchart_filename = 'BarChartData.csv'
timeuse_filename = 'TimeUseData.csv'
treemap_filename = 'TreeMapData.csv'
radarchart_filename = 'RadarChartsData.csv'
chorddata_filename = 'ChordData_old.csv'

# get input data and do some joins
trips = pd.read_csv(trips_filename, sep=sep)
households = pd.read_csv(households_filename, sep=sep)
persons = pd.read_csv(persons_filename, sep=sep)
person_days = pd.read_csv(person_days_filename, sep=sep)
counties = pd.read_csv(counties_filename)
districts = pd.read_csv(chord_districts_filename)

persons['uniq-id'] = persons['hhno'] * 100 + persons['pno']
trips['uniq-id'] = trips['hhno'] * 100 + trips['pno']
person_days['uniq-id'] = person_days['hhno'] * 100 + person_days['pno']

households = households.set_index("hhno", drop=False)
persons = persons.set_index("uniq-id", drop=False)
person_days = person_days.set_index("uniq-id", drop=False)
counties = counties.set_index("TAZ", drop=False)
districts = districts.set_index("ZONE", drop=False)

persons['hhtaz'] = households.loc[persons['hhno']]['hhtaz'].tolist()
households['hhcounty'] = counties.loc[households['hhtaz']]['COUNTY'].tolist()
households['hhdistrict'] = districts.loc[households['hhtaz']]['DISTRICT'].tolist()
persons['hhcounty'] = households.loc[persons['hhno']]['hhcounty'].tolist()
persons['hhdistrict'] = households.loc[persons['hhno']]['hhdistrict'].tolist()
trips['hhtaz'] = households.loc[trips['hhno']]['hhtaz'].tolist()
trips['hhcounty'] = counties.loc[trips['hhtaz']]['COUNTY'].tolist()
trips['hhdistrict'] = counties.loc[trips['hhtaz']]['DISTRICT'].tolist()

################################################################################

# code DaySim mode person type, mode, purpose labels, and times

persontype_codes_to_labels =	{
  1: "FULL TIME WORKER",
  2: "PART TIME WORKER",
  3: "NON WORKER AGE 65 PLUS",
  4: "OTHER NON WORKING ADULT",
  5: "UNIVERSITY STUDENT",
  6: "CHILD AGE 16 PLUS",
  7: "CHILD AGE 5 TO 15",
  8: "CHILD AGE 0 TO 4",
}

mode_codes_to_labels =	{
  1: "WALK",
  2: "BIKE",
  3: "SOV",
  4: "HOV2",
  5: "HOV3PLUS",
  6: "WALKTRANSIT",
  7: "PNR",
  8: "SCHBUS",
  9: "TNC",
 10: "OTHER"
}

mode_codes_to_nest_labels =	{
  1: "ACTIVE",
  2: "ACTIVE",
  3: "AUTO",
  4: "AUTO",
  5: "AUTO",
  6: "TRANSIT",
  7: "TRANSIT",
  8: "SCHBUS",
  9: "TNC",
 10: "OTHER"
}

purpose_codes_to_labels =	{
  0: "HOME",
  1: "WORK",
  2: "SCHOOL",
  3: "ESCORT",
  4: "PERS-BUS AND MED",
  5: "SHOP",
  6: "MEAL",
  7: "SOC AND REC",
  8: "RED",
  9: "MED",
 10: "CHANGE MODE"
}

trips['pptyp'] = persons.loc[trips['uniq-id']]['pptyp'].tolist()
persons['person_type_label'] = map(lambda x: persontype_codes_to_labels[x], persons['pptyp'])
trips['person_type_label'] = map(lambda x: persontype_codes_to_labels[x], trips['pptyp'])

trips['mode_label'] = map(lambda x: mode_codes_to_labels[x], trips['mode'])
trips['mode_nest_label'] = map(lambda x: mode_codes_to_nest_labels[x], trips['mode'])

times = pd.Series(range(180, 1440 + 180 + 1, 30)) #from 3am to 3am
if convert_times_to_minpastmid: #for the survey
  trips['arrtm'] = trips['arrtm'] / 100 * 60 + trips['arrtm'] % 100
  trips['endacttm'] = trips['endacttm'] / 100 * 60 + trips['endacttm'] % 100

trips['arrtm'][trips['arrtm'] < 180] = trips['arrtm'][trips['arrtm'] < 180] + 1440
trips['endacttm'][trips['endacttm'] < 180] = trips['endacttm'][trips['endacttm'] < 180] + 1440

# code activity times and locations

def code_times(row, times):
  return(times.isin(range(int(row['arrtm']), int(row['endacttm'])+1)) * row['trexpfac'])

in_period = trips.apply(code_times, axis=1, times=times)
in_period = pd.DataFrame(in_period)
in_period['taz'] = trips['dtaz'].tolist()
in_period['purpose'] = trips['dpurp'].tolist()
in_period['person_type_label'] = trips['person_type_label'].tolist()

## start of day at home

start_at_home = trips[['deptm','otaz','person_type_label','trexpfac']][(trips['tour']==1) & (trips['half']==1) & (trips['tseg']==1)]

def code_at_home_times(row, times):
  return(times.isin(range(180, int(row['deptm'])+1)) * row['trexpfac'])

in_period_at_home = start_at_home.apply(code_at_home_times, axis=1, times=times)
in_period_at_home = pd.DataFrame(in_period_at_home)
in_period_at_home['taz'] = start_at_home['otaz'].tolist()
in_period_at_home['purpose'] = 0 #home
in_period_at_home['person_type_label'] = start_at_home['person_type_label'].tolist()

## stay at home all day

stay_home = persons[~persons['uniq-id'].isin(trips['uniq-id'])]

in_period_stay_home = np.array(np.tile(stay_home['psexpfac'].tolist(), len(times)))
in_period_stay_home.shape = (len(stay_home), len(times))
in_period_stay_home = pd.DataFrame(in_period_stay_home)
in_period_stay_home['taz'] = stay_home['hhtaz'].tolist()
in_period_stay_home['purpose'] = 0 #home
in_period_stay_home['person_type_label'] = stay_home['person_type_label'].tolist()

in_period_table = in_period.append(in_period_at_home, ignore_index=True).append(in_period_stay_home, ignore_index=True)

## convert from period fields * len(times) to a record for each

in_period_items = np.array(in_period_table[in_period_table.columns[range(len(times))]].values.T.flatten().tolist())
in_period_items_periods = np.repeat(map(lambda x: "PER" + str(x), map(lambda y: '%02d' % y, range(1,len(times)+1))),len(in_period_table))
in_period_items_tazs = np.tile(in_period_table['taz'],len(times))
in_period_items_purposes = np.tile(in_period_table['purpose'],len(times))
in_period_items_ptypes = np.tile(in_period_table['person_type_label'],len(times))

in_period_table_period_field = pd.DataFrame({"period":in_period_items_periods, "taz":in_period_items_tazs, 
                                            "purpose":in_period_items_purposes, "expfac":in_period_items, "ptype":in_period_items_ptypes})

################################################################################

# create 3D animated map file

animatedmap = in_period_table_period_field[in_period_table_period_field['purpose']!=0][['taz','period','expfac']].groupby(['taz','period']).sum().reset_index()
animatedmap.columns = ["ZONE","PER","PERSONS NOT AT HOME"]
animatedmap.to_csv(animatedmap_filename, index=False)

# create bar chart and map file

barchart_map = trips[['hhcounty','hhtaz','mode_label','trexpfac']].groupby(['hhcounty','hhtaz','mode_label']).sum().reset_index()
barchat_map_total = trips[['hhcounty','hhtaz','trexpfac']].groupby(['hhcounty','hhtaz']).sum().reset_index()
barchat_map_total["mode_label"] = 'TOTAL'
barchart_map = barchart_map.append(barchat_map_total, ignore_index=True)
barchart_map.columns = ["COUNTY","ZONE","TRIP MODE","QUANTITY"]
barchart_map = barchart_map[["ZONE","COUNTY","TRIP MODE","QUANTITY"]]
barchart_map.to_csv(barchartandmap_filename, index=False)

# create bar chart file

person_days['person_type_label'] = persons.loc[person_days['uniq-id']]['person_type_label'].tolist()
person_days['daypattern'] = 'Home All Day'
person_days['daypattern'][((person_days['wktours']>0) + (person_days['sctours']>0)>0)] = 'Work and/or School Travel'
person_days['daypattern'][((person_days['estours']>0) + (person_days['pbtours']>0) + (person_days['shtours']>0) + 
                          (person_days['mltours']>0) + (person_days['sotours']>0) + (person_days['retours']>0) + 
                          (person_days['metours']>0))>0] = 'Other Travel'

barchart = person_days[['daypattern','person_type_label','pdexpfac']].groupby(['daypattern','person_type_label']).sum().reset_index()
barchart.columns = ["DAY PATTERN","PERSON GROUP","Count"]
barchart = barchart[["PERSON GROUP","DAY PATTERN","Count"]]
barchart["CHART"] = 'Day Pattern'
barchart.to_csv(barchart_filename, index=False)

# create timeuse file

timeuse = in_period_table_period_field[['ptype','period','purpose','expfac']].groupby(['ptype','period','purpose']).sum().reset_index()
timeuse_all = in_period_table_period_field[['period','purpose','expfac']].groupby(['period','purpose']).sum().reset_index()
timeuse_all['ptype'] = "ALL"
timeuse_all = timeuse_all[["ptype","period","purpose","expfac"]]
timeuse = timeuse.append(timeuse_all, ignore_index=True)
timeuse['purpose'] = map(lambda x: purpose_codes_to_labels[x], timeuse['purpose'])
timeuse['period'] = map(lambda x: int(x.replace("PER","")), timeuse['period'])
timeuse.columns = ["PERSON_TYPE","PER","ORIG_PURPOSE","QUANTITY"]
timeuse.to_csv(timeuse_filename, index=False)

# create treemap file

treemap = trips[['mode_nest_label','mode_label','trexpfac']].groupby(['mode_nest_label','mode_label']).sum().reset_index()
treemap.columns = ["SIMPLE MODE","TRIP MODE","QUANTITY"]
treemap.to_csv(treemap_filename, index=False)

# create radar chart file

## person daily travel time (less is better)

person_travel_times = trips[['uniq-id','travtime','hhcounty']].groupby(['uniq-id','hhcounty']).sum().reset_index()
person_travel_times = person_travel_times.set_index("uniq-id", drop=False)
person_travel_times['psexpfac'] = persons.loc[person_travel_times['uniq-id']]['psexpfac'].tolist()
person_travel_times = person_travel_times.groupby(['hhcounty']).apply(lambda x: np.average(x['travtime'], weights=x['psexpfac'])).reset_index()
person_travel_times.columns = ["CHART","QUANTITY"]
person_travel_times["AXIS"] = 'Daily Travel Time'
person_travel_times = person_travel_times[["AXIS","CHART","QUANTITY"]] #metric, county, value

## person auto vmt (less is better)

auto_vmt = trips[trips['mode'].isin([3,4,5])][['uniq-id','travdist','hhcounty']].groupby(['uniq-id','hhcounty']).sum().reset_index()
auto_vmt = auto_vmt.set_index("uniq-id", drop=False)
auto_vmt['psexpfac'] = persons.loc[auto_vmt['uniq-id']]['psexpfac'].tolist()
auto_vmt = auto_vmt.groupby(['hhcounty']).apply(lambda x: np.average(x['travdist'], weights=x['psexpfac'])).reset_index()
auto_vmt.columns = ["CHART","QUANTITY"]
auto_vmt["AXIS"] = 'Auto VMT Per Person'
auto_vmt = auto_vmt[["AXIS","CHART","QUANTITY"]]

## person distance to work (less is better)

person_workdist = persons[(persons['pwaudist']>0)]
person_workdist = person_workdist[['uniq-id','pwaudist','hhcounty']].groupby(['uniq-id','hhcounty']).sum().reset_index()
person_workdist = person_workdist.set_index("uniq-id", drop=False)
person_workdist['psexpfac'] = persons.loc[person_workdist['uniq-id']]['psexpfac'].tolist()
person_workdist = person_workdist.groupby(['hhcounty']).apply(lambda x: np.average(x['pwaudist'], weights=x['psexpfac'])).reset_index()
person_workdist.columns = ["CHART","QUANTITY"]
person_workdist["AXIS"] = 'Distance to Work'
person_workdist = person_workdist[["AXIS","CHART","QUANTITY"]]

## auto mode share (less is better)

auto_mode_share = trips[['hhcounty','mode_nest_label','trexpfac']].groupby(['hhcounty','mode_nest_label']).sum().reset_index()
auto_mode_share_total = trips[['hhcounty','mode_nest_label','trexpfac']].groupby(['hhcounty',]).sum()
auto_mode_share['total_trips'] = auto_mode_share_total.loc[auto_mode_share['hhcounty']]['trexpfac'].tolist()
auto_mode_share['pct'] = auto_mode_share['trexpfac'] / auto_mode_share['total_trips']
auto_mode_share = auto_mode_share[auto_mode_share['mode_nest_label']=="AUTO"]
auto_mode_share = auto_mode_share[["hhcounty","pct"]]
auto_mode_share.columns = ["CHART","QUANTITY"]
auto_mode_share["AXIS"] = 'Auto Mode Share'
auto_mode_share = auto_mode_share[["AXIS","CHART","QUANTITY"]]

radarchart = person_travel_times.append(auto_vmt, ignore_index=True).append(person_workdist, ignore_index=True).append(auto_mode_share, ignore_index=True)
radarchart.to_csv(radarchart_filename, index=False)

# create chord data file

trips['odistrict'] = districts.loc[trips['otaz']]['DISTRICT'].tolist()
trips['ddistrict'] = districts.loc[trips['dtaz']]['DISTRICT'].tolist()
chorddata = trips[['odistrict','ddistrict','mode_label','trexpfac']].groupby(['odistrict','ddistrict','mode_label']).sum().reset_index()
chorddata_total = trips[['odistrict','ddistrict','trexpfac']].groupby(['odistrict','ddistrict']).sum().reset_index()
chorddata_total["mode_label"] = 'TOTAL'
chorddata = chorddata.append(chorddata_total, ignore_index=True)
chorddata.columns = ["FROM","TRIP MODE","TO","TRIPS"]
chorddata = pd.pivot_table(chorddata, values="TRIPS", index=["FROM","TO"], columns="TRIP MODE", aggfunc=np.sum, fill_value=0).reset_index()
chorddata.to_csv(chorddata_filename, index=False)
