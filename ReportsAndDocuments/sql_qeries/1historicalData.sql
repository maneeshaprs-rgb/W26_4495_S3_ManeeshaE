USE FarmVendorDb;
/*
SELECT COUNT(*) AS UsersCount FROM AspNetUsers;
SELECT COUNT(*) AS ProductsCount FROM Product;
SELECT COUNT(*) AS InventoryLotsCount FROM InventoryLot;
SELECT COUNT(*) AS DemandRequestsCount FROM DemandRequest;
SELECT COUNT(*) AS DispatchesCount FROM Dispatch;
SELECT COUNT(*) AS ForecastsCount FROM DemandForecast;*/


--check repeated demand history

/*
SELECT 
    VendorId,
    ProductId,
    COUNT(*) AS RequestCount,
    MIN(CreatedAt) AS FirstRequest,
    MAX(CreatedAt) AS LastRequest
FROM DemandRequest
GROUP BY VendorId, ProductId
ORDER BY RequestCount DESC;*/

--Insert historical demand requests
--check required columns
/*SELECT TOP 5 * FROM DemandRequest;*/

--Insert farmer inventory history
--check required columns
/*SELECT TOP 10 * FROM InventoryLot;*/

--SELECT TOP 10 * FROM Dispatch;
----check required columns
--SELECT TOP 10 * FROM Dispatch;

SELECT TOP 50 *
FROM DemandForecast
ORDER BY CreatedAt DESC;