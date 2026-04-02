USE FarmVendorDb;
GO

SELECT
    VendorId,
    ProductId,
    MAX(CreatedAt) AS LastHistoryDate,
    COUNT(*) AS HistoryCount
FROM DemandRequest
GROUP BY VendorId, ProductId
ORDER BY LastHistoryDate DESC;