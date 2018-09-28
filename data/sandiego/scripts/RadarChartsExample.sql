
/* Radar Charts Example for ABMVIZ HTML5 */
/* Ben Stabler, ben.stabler@rsginc.com, 07/08/16 */
/* Originally written for ARC by Ben Stabler at RSG*/

/* Modified for SANDAG ABM Model, by YMA, 05/09/17*/
/*This file includes 4 query, each of which measures one area of performance, for each city.
Query 1 sum up the total number of households/empployments from lu_mgra_input table,and calculate the ratio to measure the balance. 
Query 2 sum up the total employments of all MGRAs which are within the 30mins of City center, which is represented by a specific MGRA.
Query 3 calcuate the ratio of total transit trips vs. all modes trips of each city;
Query 4 calcuate the average transit trips per households with Zero cars made*/


Declare @scenario_id INT;

--SET @scenario_id = 123;     --2012 rtp
--SET @scenario_id = 127;   --2015 rtp
--SET @scenario_id = 130;   --2020 rc
--SET @scenario_id = 133;   --2035 rc
SET @scenario_id = 132;   --2050 rc


select 'Jobs Housing Balance' AS AXIS,sum(hh)/sum(emp_total) as QUANTITY,name AS CHART
FROM [abm_13_2_3].abm.lu_mgra_input m
    join [abm_13_2_3].[ref].[geography_zone] r90 on (m.geography_zone_id=r90.geography_zone_id and r90.geography_type_id=90)
    join [ws].[dbo].[ref.geo] rg on r90.zone=rg.mgra
where scenario_id = @scenario_id
group by name


UNION 

select 'Accessible Employment' AS AXIS, SUM(emp_total) AS QUANTITY, TEMP.name AS CHART
from (select distinct Omgra,rc.name
    from (select distinct rgo.mgra as Omgra, rgd.mgra as Dmgra, min(trip_time) as time
          from [abm_13_2_3].[abm].[trip_ij] mt
		  join [abm_13_2_3].[ref].[geography_zone] ro on (mt.orig_geography_zone_id=ro.geography_zone_id and ro.geography_type_id=90)
          join [ws].[dbo].[ref.geo] rgo    on ro.zone=rgo.mgra
          join [ws].[dbo].[ref.cityzone] rco on rco.name=rgo.name
		  join [abm_13_2_3].[ref].[geography_zone] rd on (mt.dest_geography_zone_id=rd.geography_zone_id and rd.geography_type_id=90)
          join [ws].[dbo].[ref.geo] rgd    on rd.zone=rgd.mgra
          join [ws].[dbo].[ref.cityzone] rcd on rcd.name=rgd.name
          where scenario_id=@scenario_id
          group by rgo.mgra,rgd.mgra) as t
	      join [ws].[dbo].[ref.cityzone] rc  on t.Dmgra=rc.mgra
          where time<=30 and time>0	)as TEMP
join [abm_13_2_3].[ref].[geography_zone] r90 on (r90.zone=TEMP.Omgra and r90.geography_type_id=90)
join [abm_13_2_3].[abm].[lu_mgra_input] m on r90.geography_zone_id=m.geography_zone_id
WHERE scenario_id=@scenario_id
Group by name 


UNION

SELECT 'Transit Mode Share' AS AXIS, SUM(TRANSIT_TRIPS)/SUM(TOTAL_TRIPS*1.0) AS QUANTITY, name AS CHART
FROM [ws].[dbo].[ref.geo] rg,
  (SELECT r90.zone as mgra, COUNT(mode_id) AS TOTAL_TRIPS 
  FROM [abm_13_2_3].[abm].[trip_ij] t
      join [abm_13_2_3].[ref].[geography_zone] r90 on (t.orig_geography_zone_id=r90.geography_zone_id and r90.geography_type_id=90) 
  WHERE scenario_id=@scenario_id
  GROUP BY r90.zone) AS TEMP,
  (SELECT r90.zone as mgra, COUNT(mode_id) AS TRANSIT_TRIPS 
  FROM [abm_13_2_3].[abm].[trip_ij] t
      join [abm_13_2_3].[ref].[geography_zone] r90 on (t.orig_geography_zone_id=r90.geography_zone_id and r90.geography_type_id=90) 
  WHERE scenario_id=@scenario_id and mode_id between 11 and 25
  GROUP BY r90.zone) AS TEMP2
WHERE temp.mgra=rg.mgra AND temp2.mgra=rg.mgra
GROUP BY name


UNION

SELECT  'Zero Car Transit Trips Per HH' AS AXIS, (trips_by_0auto * 1.0 / hhs_0auto) AS QUANTITY, TEMP.name AS CHART
FROM
  (select   rg.name ,count(*) as trips_by_0auto
   from [abm_13_2_3].[abm].[trip_ij] t
     join [abm_13_2_3].[abm].[tour_ij_person] tp
	    on t.scenario_id=tp.scenario_id and t.tour_ij_id=tp.tour_ij_id
			join [abm_13_2_3].[abm].[lu_person] lp on lp.lu_person_id =tp.lu_person_id and lp.scenario_id=tp.scenario_id
			    join [abm_13_2_3].abm.lu_hh hh on lp.lu_hh_id=hh.lu_hh_id and hh.scenario_id=lp.scenario_id
				    join [abm_13_2_3].[ref].[geography_zone] r90 on (hh.geography_zone_id=r90.geography_zone_id and r90.geography_type_id=90)
					    join [ws].[dbo].[ref.geo] rg on rg.mgra=r90.zone
  where t.scenario_id=@scenario_id and mode_id between 11 and 25 and autos=0 and unit_type_id=0 
  group by name) AS temp, 
  (select name,count(*) as hhs_0auto
   from [abm_13_2_3].abm.lu_hh hh
       join [abm_13_2_3].[ref].[geography_zone] r90 on (hh.geography_zone_id=r90.geography_zone_id and r90.geography_type_id=90)
	       join [ws].[dbo].[ref.geo] rg on rg.mgra=r90.zone
   where scenario_id=@scenario_id and autos=0 and unit_type_id=0 
   group by name) AS temp2
WHERE temp.name=temp2.name

