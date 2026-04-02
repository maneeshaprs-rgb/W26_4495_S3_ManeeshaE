--Pick one row from DemandForecast and inspect its history
SELECT
    VendorId,
    ProductId,
    MAX(CreatedAt) AS LastHistoryDate,
    COUNT(*) AS HistoryCount
FROM DemandRequest
WHERE VendorId = '5e9a6e8f-1e62-46bf-b154-7d4609e2fe2b'
  AND ProductId = 4
GROUP BY VendorId, ProductId;

--compare with forecast rows
SELECT *
FROM DemandForecast
WHERE VendorId = '5e9a6e8f-1e62-46bf-b154-7d4609e2fe2b'
  AND ProductId = 4
ORDER BY ForecastDate;

USE FarmVendorDb;
GO

SELECT ForecastDate, COUNT(*) AS ForecastCount
FROM DemandForecast
WHERE ForecastDate = '2026-04-01'
GROUP BY ForecastDate;

SELECT TOP 50 *
FROM DemandForecast
WHERE ForecastDate = '2026-04-01'
ORDER BY VendorId, ProductId;