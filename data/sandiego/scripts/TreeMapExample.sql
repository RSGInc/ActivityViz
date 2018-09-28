
/* TreeMap example query for ABMVIZ HTML5 */
/* Ben Stabler, ben.stabler@rsginc.com, 07/08/16 */

/* modified for SANDAG ABM model, by YMA, 05/09/2017 */
/* This query is to sum up total regional trips, grouped by 3 mode levels: General Mode, Nest_Mode, and Detailed_Mode;*/ 


USE [abm_13_2_3]
GO

Declare @scenario_id INT;

--SET @scenario_id = 123;     --2012 rtp
--SET @scenario_id = 127;   --2015 rtp
--SET @scenario_id = 130;   --2020 rc
--SET @scenario_id = 133;   --2035 rc
SET @scenario_id = 132;   --2050 rc


SELECT GENERAL_MODE as "TRIPS BY MODE"
       ,NEST_MODE
       ,SIMPLE_MODE  
	   ,count(*) as QUANTITY
FROM [abm_13_2_3].[abm].[trip_ij] m
	JOIN ws.dbo.ref_mode rm on m.mode_id=rm.mode_id
WHERE scenario_id=@scenario_id 
GROUP by GENERAL_MODE,NEST_MODE,SIMPLE_MODE
ORDER by GENERAL_MODE,NEST_MODE,SIMPLE_MODE



select *
from ws.dbo.ref_mode
