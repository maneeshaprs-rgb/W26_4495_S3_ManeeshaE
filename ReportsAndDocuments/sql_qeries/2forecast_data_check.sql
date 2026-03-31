USE FarmVendorDb;

SELECT VendorId, ProductId, COUNT(*) AS RequestCount
FROM DemandRequest
GROUP BY VendorId, ProductId
ORDER BY RequestCount DESC

SELECT COUNT(*) FROM DemandForecast;