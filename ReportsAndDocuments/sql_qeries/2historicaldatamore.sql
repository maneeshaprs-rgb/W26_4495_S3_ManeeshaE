USE FarmVendorDb;
GO

/* ----------------------------------------------------------
   1) Check current demand history per vendor-product pair
---------------------------------------------------------- */
SELECT 
    VendorId,
    ProductId,
    COUNT(*) AS RequestCount,
    MIN(CreatedAt) AS FirstRequest,
    MAX(CreatedAt) AS LastRequest
FROM DemandRequest
GROUP BY VendorId, ProductId
ORDER BY RequestCount DESC;
GO

/* ----------------------------------------------------------
   2) Insert more historical demand rows
   - Adds 12 earlier historical points per vendor-product pair
   - Uses weekly spacing
   - Slightly varies quantity around current average
   - Avoids duplicates by checking CreatedAt
---------------------------------------------------------- */
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
    UNION ALL SELECT 7
    UNION ALL SELECT 8
    UNION ALL SELECT 9
    UNION ALL SELECT 10
    UNION ALL SELECT 11
    UNION ALL SELECT 12
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
        WHEN ROUND(
            p.AvgQty
            + CASE 
                WHEN n.N % 4 = 1 THEN -4
                WHEN n.N % 4 = 2 THEN -1
                WHEN n.N % 4 = 3 THEN 2
                ELSE 5
              END,
            0
        ) < 1
        THEN 1
        ELSE CAST(
            ROUND(
                p.AvgQty
                + CASE 
                    WHEN n.N % 4 = 1 THEN -4
                    WHEN n.N % 4 = 2 THEN -1
                    WHEN n.N % 4 = 3 THEN 2
                    ELSE 5
                  END,
                0
            ) AS DECIMAL(18,2)
        )
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
);
GO

/* ----------------------------------------------------------
   3) Recheck history after insert
---------------------------------------------------------- */
SELECT 
    VendorId,
    ProductId,
    COUNT(*) AS RequestCount,
    MIN(CreatedAt) AS FirstRequest,
    MAX(CreatedAt) AS LastRequest
FROM DemandRequest
GROUP BY VendorId, ProductId
ORDER BY RequestCount DESC;
GO

/* ----------------------------------------------------------
   4) Optional: remove old forecasts before regenerating
---------------------------------------------------------- */
-- DELETE FROM DemandForecast;
-- GO

/* ----------------------------------------------------------
   5) Check forecast table
---------------------------------------------------------- */
SELECT TOP 50 *
FROM DemandForecast
ORDER BY CreatedAt DESC;
GO

/* ----------------------------------------------------------
   6) Counts
---------------------------------------------------------- */
SELECT COUNT(*) AS ProductsCount FROM Product;
SELECT COUNT(*) AS InventoryLotsCount FROM InventoryLot;
SELECT COUNT(*) AS DemandRequestsCount FROM DemandRequest;
SELECT COUNT(*) AS DispatchesCount FROM Dispatch;
SELECT COUNT(*) AS ForecastsCount FROM DemandForecast;
GO

/* ----------------------------------------------------------
   7) Check inventory
---------------------------------------------------------- */
SELECT FarmerId, ProductId, QuantityAvailable, Unit
FROM InventoryLot
WHERE QuantityAvailable > 0
ORDER BY FarmerId, ProductId;
GO