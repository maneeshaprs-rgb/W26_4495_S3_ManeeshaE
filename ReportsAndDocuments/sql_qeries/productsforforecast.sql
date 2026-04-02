USE FarmVendorDb;
GO

SELECT 
    i.FarmerId,
    p.ProductId,
    p.Name AS ProductName,
    i.QuantityAvailable,
    i.ExpiryDate
FROM InventoryLot i
JOIN Product p ON i.ProductId = p.ProductId
WHERE i.FarmerId = (
    SELECT TOP 1 Id
    FROM AspNetUsers
    WHERE DisplayName = 'Farmer One'
)
AND i.QuantityAvailable > 0
ORDER BY p.Name;

USE FarmVendorDb;
GO
--Check whether ML forecasts exist for 2026-04-01
SELECT 
    ForecastDate,
    ModelName,
    COUNT(*) AS ForecastCount
FROM DemandForecast
WHERE ForecastDate = '2026-04-01'
GROUP BY ForecastDate, ModelName
ORDER BY ModelName;
-- Check whether 2026-04-01 ML forecasts overlap with Farmer One’s products
USE FarmVendorDb;
GO

SELECT 
    p.Name AS ProductName,
    f.VendorId,
    f.ForecastQty,
    f.ForecastDate,
    f.ModelName
FROM DemandForecast f
JOIN Product p ON f.ProductId = p.ProductId
WHERE f.ForecastDate = '2026-04-01'
  AND f.ModelName = 'MLNET_SSA'
  AND p.Name IN ('Blueberry', 'Onions', 'Tomatoes', 'Milk')
ORDER BY p.Name, f.ForecastQty DESC;