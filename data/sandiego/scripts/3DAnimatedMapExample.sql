
/* 3D Animated Map Example Query for ABMVIZ HTML5 */
/* Ben Stabler, ben.stabler@rsginc.com, 07/08/16 */

/* modified for SANDAG AMB model, YMA, 05/08/17 
The query is to sum up total number of persons(out), grouped by home/origin/destination taz.
*/

use ws
go

IF EXISTS (SELECT * FROM sys.objects WHERE name = 'Person_out_home')  DROP TABLE Person_out_home
IF EXISTS (SELECT * FROM sys.objects WHERE name = 'Person_out_org')   DROP TABLE Person_out_org
IF EXISTS (SELECT * FROM sys.objects WHERE name = 'Person_out_des')  DROP TABLE Person_out_des

CREATE TABLE Person_out_home (TAZ INT, PER INT, PERSONS_OUT INT)
CREATE TABLE Person_out_org  (TAZ INT, PER INT, PERSONS_ORG INT)
CREATE TABLE Person_out_des  (TAZ INT, PER INT, PERSONS_DES INT)


Declare @scenario_id INT;

--SET @scenario_id = 123;     --2012 rtp
--SET @scenario_id = 127;   --2015 rtp
--SET @scenario_id = 130;   --2020 rc
--SET @scenario_id = 133;   --2035 rc
SET @scenario_id = 132;   --2050 rc


DECLARE @hr AS INT
SET @hr = 8      
WHILE @hr <= 47  
    BEGIN
	     		   

			--sum up total number of persons home taz
            INSERT INTO Person_out_home (PER,TAZ,PERSONS_OUT) 
            SELECT @hr as PER, taz as TAZ,COUNT(*) AS PERSONS_OUT
            FROM [abm_13_2_3].[abm].[tour_ij_person] tijp
		   	   join [abm_13_2_3].[abm].[tour_ij] tij    on   tij.scenario_id=tijp.scenario_id     and  tij.tour_ij_id=tijp.tour_ij_id
		       join [abm_13_2_3].[abm].[lu_person] lp   on   lp.scenario_id = tijp.scenario_id    and  lp.lu_person_id=tijp.lu_person_id
			   join [abm_13_2_3].[abm].[lu_hh] hh       on   lp.lu_hh_id=hh.lu_hh_id              and  hh.scenario_id=lp.scenario_id
               join [abm_13_2_3].[ref].[geography_zone] r90 on (hh.geography_zone_id=r90.geography_zone_id and r90.geography_type_id=90)
			   join [ws].[dbo].[ref.geo] rg on rg.mgra=r90.zone
		    WHERE tijp.scenario_id=@scenario_id and start_time_period_id<=@hr and end_time_period_id>=@hr
	        GROUP BY taz


           --sum up total number of persons  by orig
           INSERT INTO Person_out_org (PER,TAZ,PERSONS_ORG)
		   SELECT @hr as PER, taz as TAZ,COUNT(*) AS PERSONS_ORG
           FROM [abm_13_2_3].[abm].[tour_ij_person] tijp  
		       join [abm_13_2_3].[abm].[tour_ij] tij    on tij.scenario_id=tijp.scenario_id    and  tij.tour_ij_id=tijp.tour_ij_id
		       join [abm_13_2_3].[ref].[geography_zone] r90 on (tij.orig_geography_zone_id=r90.geography_zone_id and r90.geography_type_id=90)
			   join [ws].[dbo].[ref.geo] rg on rg.mgra=r90.zone
           WHERE tijp.scenario_id=@scenario_id and start_time_period_id<=@hr and end_time_period_id>=@hr
		   GROUP BY taz


		    --sum up total number of persons by destination
           INSERT INTO Person_out_des (PER,TAZ,PERSONS_DES)
		   SELECT @hr as PER, taz as TAZ,COUNT(*) AS PERSONS_DES
           FROM  [abm_13_2_3].[abm].[tour_ij_person] tijp  
		       join [abm_13_2_3].[abm].[tour_ij] tij      on tij.scenario_id=tijp.scenario_id    and  tij.tour_ij_id=tijp.tour_ij_id
		       join [abm_13_2_3].[ref].[geography_zone] r90 on (tij.dest_geography_zone_id=r90.geography_zone_id and r90.geography_type_id=90)
			   join [ws].[dbo].[ref.geo] rg on rg.mgra=r90.zone
           WHERE tijp.scenario_id=@scenario_id and start_time_period_id<=@hr and end_time_period_id>=@hr
		   GROUP BY taz

       SET @hr = @hr + 1

    END


 --output person-not-home
 SELECT TAZ as ZONE,'PER'+CAST(PER AS VARCHAR(6)) as PER,PERSONS_OUT as QUANTITY
 FROM Person_out_home
 ORDER BY ZONE,PER 
 
 --output by origion
 SELECT TAZ as ZONE,'PER'+CAST(PER AS VARCHAR(6)) as PER,PERSONS_ORG as QUANTITY
 FROM Person_out_org
 ORDER BY ZONE,PER 
 
  --output by destination
 SELECT TAZ as ZONE,'PER'+CAST(PER AS VARCHAR(6)) as PER,PERSONS_DES as QUANTITY
 FROM Person_out_des
 ORDER BY ZONE,PER 

  
 --DROP TABLE Person_out_home
 --DROP TABLE Person_out_org
 --DROP TABLE Person_out_des


