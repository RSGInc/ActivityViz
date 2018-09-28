

/* BarChart example query for ABMVIZ HTML5 */
/* Ben Stabler, ben.stabler@rsginc.com, 11/15/16 */

/* Modified for SANDAG ABM Model, by YMA, 05/08/17
 This query is to sum up number of persons from [abm].[lu_person] table, grouped by person_type and activity pattern*/

use abm_13_2_3
go

Declare @scenario_id INT;
--SET @scenario_id = 123;     --2012 rtp
--SET @scenario_id = 127;   --2015 rtp
--SET @scenario_id = 130;   --2020 rc
--SET @scenario_id = 133;   --2035 rc
SET @scenario_id = 132;   --2050 rc

with temp as
(
select 
       ptype_desc
      ,activity_pattern_desc 
      ,CASE
	        WHEN m.ptype_id =1 THEN 1
			WHEN m.ptype_id =2 THEN 2
			WHEN m.ptype_id =3 THEN 5
			WHEN m.ptype_id =4 THEN 3
			WHEN m.ptype_id =5 THEN 4
			WHEN m.ptype_id =6 THEN 6
			WHEN m.ptype_id =7 THEN 7
			WHEN m.ptype_id =8 THEN 8
			END AS myorder
from [abm].[lu_person] m
    join ref.ptype rp on m.ptype_id=rp.ptype_id
	join [ref].[activity_pattern] ra on m.activity_pattern_id=ra.activity_pattern_id
where scenario_id = @scenario_id
)
select 	REPLACE(REPLACE(ptype_desc, 'Non-working Senior' ,'Retired'),'Non-working Adult','Non-worker')  AS "PERSON GROUP"
    ,activity_pattern_desc as "ACTIVITY PATTERN"
    ,count(*) as "Count"
from temp
group by ptype_desc,activity_pattern_desc,myorder
order by myorder
