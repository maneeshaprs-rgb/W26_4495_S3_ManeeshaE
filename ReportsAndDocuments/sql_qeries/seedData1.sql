USE FarmVendorDb;
GO

SELECT COUNT(*) AS Email FROM AspNetUsers;
SELECT COUNT(*) AS Products FROM Product;
SELECT COUNT(*) AS InventoryLots FROM InventoryLot;
SELECT COUNT(*) AS DemandRequests FROM DemandRequest;
SELECT COUNT(*) AS Dispatches FROM Dispatch;

SELECT TOP 10 Email, UserName FROM AspNetUsers;
SELECT TOP 10 * FROM AspNetUsers;
SELECT TOP 10 * FROM Product;

SELECT TOP 10 * FROM InventoryLot ORDER BY CreatedAt DESC;

SELECT TOP 10 * FROM DemandRequest ORDER BY NeededBy DESC;

SELECT TOP 10 * FROM Dispatch ORDER BY DispatchId DESC;

