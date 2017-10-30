
/* BarChart example query for ABMVIZ HTML5 */
/* Ben Stabler, ben.stabler@rsginc.com, 11/15/16 */

/* Set Scenario  */
ALTER USER [ATLANTAREGION\TAMConsult] WITH DEFAULT_SCHEMA = BS10

/* Count activity patterns by person type and return in BARGROUP, COLUMNS, QUANTITY format for Bar Chart visual */
SELECT PERSON_TYPE AS "PERSON GROUP", 
  REPLACE(REPLACE(REPLACE(ACTIVITY_PATTERN, 'M' collate Latin1_General_CS_AS ,'Mandatory'), 
  'H' collate Latin1_General_CS_AS, 'Home'), 
  'N' collate Latin1_General_CS_AS, 'Non-mandatory') AS "DAY PATTERN", 
  COUNT(ACTIVITY_PATTERN) AS "Count"
FROM PERSONDATA 
GROUP BY PERSON_TYPE, ACTIVITY_PATTERN 
ORDER BY PERSON_TYPE, ACTIVITY_PATTERN
