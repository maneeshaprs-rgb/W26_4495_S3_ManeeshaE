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

--Insert additional historical demand data automatically
/*
GO

;WITH PairBase AS
(
    SELECT
        VendorId,
        ProductId,
        MIN(CreatedAt) AS FirstCreatedAt,
        MAX(Unit) AS Unit,
        AVG(CAST(QuantityRequested AS DECIMAL(18,2))) AS AvgQty,
        COUNT(*) AS ExistingCount
    FROM DemandRequest
    GROUP BY VendorId, ProductId
),
Nums AS
(
    SELECT 1 AS N
    UNION ALL SELECT 2
    UNION ALL SELECT 3
    UNION ALL SELECT 4
    UNION ALL SELECT 5
    UNION ALL SELECT 6
)
INSERT INTO DemandRequest
(
    VendorId,
    ProductId,
    QuantityRequested,
    Unit,
    NeededBy,
    Status,
    CreatedAt
)
SELECT
    p.VendorId,
    p.ProductId,
    CASE
        WHEN ROUND(p.AvgQty + ((n.N % 3) - 1) * 3, 0) < 1 THEN 1
        ELSE CAST(ROUND(p.AvgQty + ((n.N % 3) - 1) * 3, 0) AS DECIMAL(18,2))
    END AS QuantityRequested,
    p.Unit,
    DATEADD(DAY, 5, DATEADD(DAY, -7 * n.N, CAST(p.FirstCreatedAt AS DATE))) AS NeededBy,
    'Fulfilled' AS Status,
    DATEADD(DAY, -7 * n.N, p.FirstCreatedAt) AS CreatedAt
FROM PairBase p
CROSS JOIN Nums n
WHERE NOT EXISTS
(
    SELECT 1
    FROM DemandRequest d
    WHERE d.VendorId = p.VendorId
      AND d.ProductId = p.ProductId
      AND d.CreatedAt = DATEADD(DAY, -7 * n.N, p.FirstCreatedAt)
);*/

--Recheck total counts

-- SELECT COUNT(*) AS UsersCount FROM AspNetUsers;
SELECT COUNT(*) AS ProductsCount FROM Product;
SELECT COUNT(*) AS InventoryLotsCount FROM InventoryLot;
SELECT COUNT(*) AS DemandRequestsCount FROM DemandRequest;
SELECT COUNT(*) AS DispatchesCount FROM Dispatch;
SELECT COUNT(*) AS ForecastsCount FROM DemandForecast;

/*
SELECT TOP 50 *
FROM DemandForecast
ORDER BY CreatedAt DESC;*/

SELECT COUNT(*) AS ForecastsCount FROM DemandForecast;


SELECT FarmerId, ProductId, QuantityAvailable, Unit
FROM InventoryLot
WHERE QuantityAvailable > 0
ORDER BY FarmerId, ProductId;