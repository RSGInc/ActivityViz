/* Time Use Data for ABMVIZ */
/* Originally by Ben Stabler, ben.stabler@rsginc.com, 07/08/16 */

/* modified for SANDAG ABM model, by YMA, 05/09/2017 
   This query is to sum up total number of tour persons by person type/tour-purpose/PER
*/


use ws
go

IF EXISTS (SELECT * FROM sys.objects WHERE name = 'TPERSON')  DROP TABLE TPERSON
IF EXISTS (SELECT * FROM sys.objects WHERE name = 'TIMEUSE_TEMP')  DROP TABLE TIMEUSE_TEMP
IF EXISTS (SELECT * FROM sys.objects WHERE name = 'TIMEUSE')  DROP TABLE TIMEUSE
CREATE TABLE TPERSON  (PERSON_TYPE VARCHAR(50), QUANTITY INT)
CREATE TABLE TIMEUSE_TEMP (PERSON_TYPE VARCHAR(50), PER INT, PURPOSE VARCHAR(50), QUANTITY INT)
CREATE TABLE TIMEUSE      (PERSON_TYPE VARCHAR(50), PER INT, PURPOSE VARCHAR(50), QUANTITY INT)


Declare @scenario_id INT;
--SET @scenario_id = 123;     --2012 rtp
--SET @scenario_id = 127;   --2015 rtp
--SET @scenario_id = 130;   --2020 rc
--SET @scenario_id = 133;   --2035 rc
SET @scenario_id = 132;   --2050 rc


insert into TPERSON
select PERSON_TYPE, QUANTITY
from (select  ptype_desc as PERSON_TYPE,count(*) as QUANTITY
	  from     [abm_13_2_3].[abm].[lu_person] lup 
			 join [abm_13_2_3].[ref].[ptype] rt on lup.ptype_id=rt.ptype_id
	  where lup.scenario_id=@scenario_id
	  group by ptype_desc) as temp


/* Loop by PERIOD and add to TIMEUSE_TEMP table */
declare @hr AS INT
set @hr = 8      
while @hr <= 47  
    begin
	       
		   insert into TIMEUSE_TEMP (PERSON_TYPE, PER, PURPOSE, QUANTITY)
           select ptype_desc as PERSON_TYPE, @hr as PER, purpose_desc as PURPOSE, COUNT(*) AS QUANTITY
           from [abm_13_2_3].[abm].[tour_ij_person] tijp
		      join [abm_13_2_3].[abm].[lu_person] lup on lup.scenario_id = tijp.scenario_id and lup.lu_person_id=tijp.lu_person_id
			  join [abm_13_2_3].[ref].[ptype] rt on lup.ptype_id=rt.ptype_id
		      join [abm_13_2_3].[abm].[tour_ij] tij on tij.scenario_id=tijp.scenario_id and tij.tour_ij_id=tijp.tour_ij_id
			  join [abm_13_2_3].[ref].[purpose] rp on rp.purpose_id=tij.purpose_id
		   where tijp.scenario_id=@scenario_id and start_time_period_id<=@hr and end_time_period_id>=@hr
	       group by ptype_desc,purpose_desc

		   insert into TIMEUSE_TEMP (PERSON_TYPE, PER, PURPOSE, QUANTITY)
		   select temp.PERSON_TYPE, temp.PER, 'Home' as PURPOSE, (TPERSON.QUANTITY-temp.QUANTITY) as QUANTITY
		   from (select PERSON_TYPE,PER,sum(QUANTITY) as QUANTITY
                 from TIMEUSE_TEMP
		         where PER = @hr
                 group by PERSON_TYPE,PER  ) as temp 
		   join TPERSON on TPERSON.PERSON_TYPE=temp.PERSON_TYPE

       set @hr = @hr + 1

   end

UPDATE TIMEUSE_TEMP SET PERSON_TYPE = REPLACE(PERSON_TYPE, 'Non-working Adult',  'Non-worker')
UPDATE TIMEUSE_TEMP SET PERSON_TYPE = REPLACE(PERSON_TYPE, 'Non-working Senior', 'Retired')


INSERT INTO TIMEUSE (PERSON_TYPE, PER, PURPOSE, QUANTITY)
SELECT UPPER(PERSON_TYPE) AS PERSON_TYPE, PER, UPPER(PURPOSE) AS PURPOSE, QUANTITY
FROM TIMEUSE_TEMP


INSERT INTO TIMEUSE (PERSON_TYPE, PER, PURPOSE, QUANTITY)
SELECT 'ALL' AS PERSON_TYPE, PER, UPPER(PURPOSE) AS PURPOSE, QUANTITY
FROM (
	select PER, PURPOSE, SUM(QUANTITY) AS QUANTITY
	from TIMEUSE_TEMP
    group by PER, PURPOSE
	) as temp2


select PERSON_TYPE,PER, PURPOSE, QUANTITY
       ,CASE 
	         WHEN PERSON_TYPE = 'FULL-TIME WORKER'    THEN 1
			 WHEN PERSON_TYPE = 'PART-TIME WORKER'    THEN 2
			 WHEN PERSON_TYPE = 'NON-WORKER'          THEN 3
			 WHEN PERSON_TYPE = 'RETIRED'             THEN 4
			 WHEN PERSON_TYPE = 'COLLEGE STUDENT'     THEN 5
			 WHEN PERSON_TYPE = 'DRIVING AGE STUDENT' THEN 6
			 WHEN PERSON_TYPE = 'NON-DRIVING STUDENT' THEN 7
			 WHEN PERSON_TYPE = 'PRE-SCHOOL'          THEN 8
			 WHEN PERSON_TYPE = 'ALL'                 THEN 9
         END AS person_order
from TIMEUSE
order by person_order,PER,PURPOSE

--DROP TABLE TPERSON
--DROP TABLE TIMEUSE_TEMP
--DROP TABLE TIMEUSE

















