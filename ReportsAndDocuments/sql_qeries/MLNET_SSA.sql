
--MLNET_SSA dates actually exist
USE FarmVendorDb;
GO

SELECT ForecastDate, ModelName, COUNT(*) AS ForecastCount
FROM DemandForecast
WHERE ModelName = 'MLNET_SSA'
GROUP BY ForecastDate, ModelName
ORDER BY ForecastDate;

SELECT ForecastDate, ModelName, COUNT(*) 
FROM DemandForecast
WHERE ForecastDate = '2026-04-01'
GROUP BY ForecastDate, ModelName;