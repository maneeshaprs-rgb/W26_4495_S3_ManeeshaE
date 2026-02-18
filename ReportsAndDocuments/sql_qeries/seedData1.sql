USE FarmVendorDb;
GO

SELECT COUNT(*) AS Products FROM Product;
SELECT COUNT(*) AS DemandRequests FROM DemandRequest;
SELECT COUNT(*) AS Dispatches FROM Dispatch;
SELECT COUNT(*) AS InventoryLots FROM InventoryLot;

SELECT TOP 10 Email, UserName FROM AspNetUsers;

SELECT * FROM AspNetUsers;