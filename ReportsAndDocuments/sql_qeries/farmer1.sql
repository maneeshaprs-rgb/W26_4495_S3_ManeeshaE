
--insert products for specific farmer
USE FarmVendorDb;

GO

SELECT Id, DisplayName, Email
FROM AspNetUsers
WHERE DisplayName LIKE '%Farmer%'
ORDER BY DisplayName;


INSERT INTO InventoryLot (FarmerId, ProductId, QuantityAvailable, Unit, ExpiryDate, CreatedAt)
VALUES
('41dada04-1899-4cce-aaac-6fc0b8f33b88', 1, 35, 'kg', DATEADD(day, 2, GETUTCDATE()), GETUTCDATE()),
('41dada04-1899-4cce-aaac-6fc0b8f33b88', 2, 18, 'kg', DATEADD(day, 4, GETUTCDATE()), GETUTCDATE()),
('41dada04-1899-4cce-aaac-6fc0b8f33b88', 4, 25, 'L',  DATEADD(day, 6, GETUTCDATE()), GETUTCDATE());

