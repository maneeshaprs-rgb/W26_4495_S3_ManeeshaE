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


--Confirm whether forecast rows exist
USE FarmVendorDb;

SELECT TOP 50
    DemandForecastId,
    VendorId,
    ProductId,
    ForecastDate,
    ForecastQty,
    ModelName,
    LookbackPeriods,
    CreatedAt
FROM DemandForecast
ORDER BY CreatedAt DESC;

