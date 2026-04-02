USE FarmVendorDb;

SELECT VendorId, ProductId, COUNT(*) AS RequestCount
FROM DemandRequest
GROUP BY VendorId, ProductId
ORDER BY RequestCount DESC

SELECT COUNT(*) FROM DemandForecast;

--data check for today
USE FarmVendorDb;
GO

SELECT ForecastDate, COUNT(*) AS ForecastCount
FROM DemandForecast
GROUP BY ForecastDate
ORDER BY ForecastDate DESC;