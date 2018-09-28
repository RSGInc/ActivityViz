

/* Bar Chart and Map Example Query for ABMVIZ HTML5 */
/* Ben Stabler, ben.stabler@rsginc.com, 12/8/15 */

/* modified for SANDAG ABM model, by YMA, 05/09/2017*/
/* This query is to sum up total number of trips, grouped by mode_summary_abbr and by city/taz.*/ 

use [abm_13_2_3]
go

declare @scenario_id INT;
--SET @scenario_id = 123;     --2012 rtp
--SET @scenario_id = 127;   --2015 rtp
--SET @scenario_id = 130;   --2020 rc
--SET @scenario_id = 133;   --2035 rc
SET @scenario_id = 132;   --2050 rc


with temp as
(
select  taz,name,mode_summary_abbr
from [abm_13_2_3].[abm].[trip_ij] m
	join [ref].[mode] rm on m.mode_id=rm.mode_id
    join [ref].[geography_zone] r90 on (m.orig_geography_zone_id=r90.geography_zone_id and r90.geography_type_id=90)
	join [ws].[dbo].[ref.geo] rg on r90.zone=rg.mgra
where scenario_id= @scenario_id
)
select taz as ZONE,name as CITY,REPLACE(mode_summary_abbr, 'SBUS' ,'SCHOOLBUS') as "TRIP MODE",count(*) as QUANTITY
from temp
group BY taz,name,mode_summary_abbr

union
 
select taz as ZONE ,name as CITY,'Total' AS "TRIP MODE",count(*) AS QUANTITY 
from temp
group by taz,name
order by CITY,ZONE,"TRIP MODE"

