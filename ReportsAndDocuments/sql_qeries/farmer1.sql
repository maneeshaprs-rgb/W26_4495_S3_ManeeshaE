
--insert products for specific farmer
USE FarmVendorDb;

GO

SELECT Id, DisplayName, Email
FROM AspNetUsers
WHERE DisplayName LIKE '%Farmer%'
ORDER BY DisplayName;

/*
INSERT INTO InventoryLot (FarmerId, ProductId, QuantityAvailable, Unit, ExpiryDate, CreatedAt)
VALUES
('75d539c0-31cd-4561-a092-c9ce1a3718aa', 1, 35, 'kg', DATEADD(day, 2, GETUTCDATE()), GETUTCDATE()),
('75d539c0-31cd-4561-a092-c9ce1a3718aa', 2, 18, 'kg', DATEADD(day, 4, GETUTCDATE()), GETUTCDATE()),
('75d539c0-31cd-4561-a092-c9ce1a3718aa', 4, 25, 'L',  DATEADD(day, 6, GETUTCDATE()), GETUTCDATE());

*/
USE FarmVendorDb;
SELECT *
FROM AspNetUsers