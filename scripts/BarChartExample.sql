
/* BarChart example query for ABMVIZ HTML5 */
/* Ben Stabler, ben.stabler@rsginc.com, 11/15/16 */

/* Set Scenario  */
ALTER USER [ATLANTAREGION\TAMConsult] WITH DEFAULT_SCHEMA = BS10

/* Count activity patterns by person type and return in BARGROUP, COLUMNS, QUANTITY format for Bar Chart visual */
SELECT PERSON_TYPE AS "Person Group", ACTIVITY_PATTERN AS "Day Pattern", COUNT(ACTIVITY_PATTERN) AS "Count"
FROM PERSONDATA 
GROUP BY PERSON_TYPE, ACTIVITY_PATTERN 
ORDER BY PERSON_TYPE, ACTIVITY_PATTERN
