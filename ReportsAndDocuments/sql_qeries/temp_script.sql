--generate a realistic simulated dataset (requests + dispatches + expiring inventory + time periods)
USE FarmVendorDb;
GO
--Pick Farmers + Vendors (from Identity Roles)
SELECT Id, Name FROM AspNetRoles;
--Create temp tables of farmer/vendor user IDs
-- Farmers
IF OBJECT_ID('tempdb..#Farmers') IS NOT NULL DROP TABLE #Farmers;
SELECT TOP (15) u.Id
INTO #Farmers
FROM AspNetUsers u
JOIN AspNetUserRoles ur ON ur.UserId = u.Id
JOIN AspNetRoles r ON r.Id = ur.RoleId
WHERE r.Name = 'Farmer'
ORDER BY NEWID();

-- Vendors
IF OBJECT_ID('tempdb..#Vendors') IS NOT NULL DROP TABLE #Vendors;
SELECT TOP (20) u.Id
INTO #Vendors
FROM AspNetUsers u
JOIN AspNetUserRoles ur ON ur.UserId = u.Id
JOIN AspNetRoles r ON r.Id = ur.RoleId
WHERE r.Name = 'Vendor'
ORDER BY NEWID();

SELECT COUNT(*) AS Farmers FROM #Farmers;
SELECT COUNT(*) AS Vendors  FROM #Vendors;

--Seed Products (20–30)
-- If you already seeded products, skip this.
-- Add 25 products quickly
INSERT INTO Product (Name, Category, DefaultUnit, IsActive)
SELECT v.Name, v.Category, v.Unit, 1
FROM (VALUES
 ('Tomato','Vegetable','kg'),
 ('Onion','Vegetable','kg'),
 ('Potato','Vegetable','kg'),
 ('Carrot','Vegetable','kg'),
 ('Cucumber','Vegetable','kg'),
 ('Lettuce','Vegetable','kg'),
 ('Spinach','Vegetable','kg'),
 ('Bell Pepper','Vegetable','kg'),
 ('Broccoli','Vegetable','kg'),
 ('Cauliflower','Vegetable','kg'),
 ('Strawberry','Fruit','kg'),
 ('Blueberry','Fruit','kg'),
 ('Apple','Fruit','kg'),
 ('Pear','Fruit','kg'),
 ('Grape','Fruit','kg'),
 ('Orange','Fruit','kg'),
 ('Milk','Dairy','L'),
 ('Yogurt','Dairy','L'),
 ('Eggs','Dairy','dozen'),
 ('Cheese','Dairy','kg'),
 ('Basil','Herb','bunch'),
 ('Cilantro','Herb','bunch'),
 ('Parsley','Herb','bunch'),
 ('Mushroom','Vegetable','kg'),
 ('Garlic','Vegetable','kg')
) v(Name, Category, Unit)
WHERE NOT EXISTS (SELECT 1 FROM Product p WHERE p.Name = v.Name);

SELECT COUNT(*) AS ProductCount FROM Product;

--Seed InventoryLots (with expiry spread)
--This creates lots over the last 12 weeks, including some expiring soon.
;WITH N AS (
  SELECT TOP (180) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS n
  FROM sys.objects
),
RandLots AS (
  SELECT
    f.Id AS FarmerId,
    p.ProductId,
    CAST(ABS(CHECKSUM(NEWID())) % 220 + 20 AS decimal(18,2)) AS QuantityAvailable,
    p.DefaultUnit AS Unit,
    DATEADD(day, - (ABS(CHECKSUM(NEWID())) % 84), CAST(GETUTCDATE() AS date)) AS CreatedAt,
    ABS(CHECKSUM(NEWID())) % 100 AS ExpiryRoll
  FROM N
  CROSS APPLY (SELECT TOP 1 Id FROM #Farmers ORDER BY NEWID()) f
  CROSS APPLY (SELECT TOP 1 ProductId, DefaultUnit FROM Product ORDER BY NEWID()) p
)
INSERT INTO InventoryLot (FarmerId, ProductId, QuantityAvailable, Unit, ExpiryDate, CreatedAt)
SELECT
  FarmerId,
  ProductId,
  QuantityAvailable,
  Unit,
  CASE
    WHEN ExpiryRoll < 15 THEN DATEADD(day, 1, CAST(GETUTCDATE() AS date))      -- expiring tomorrow
    WHEN ExpiryRoll < 35 THEN DATEADD(day, 3, CAST(GETUTCDATE() AS date))      -- expiring in 3 days
    WHEN ExpiryRoll < 55 THEN DATEADD(day, 7, CreatedAt)                      -- normal
    ELSE DATEADD(day, 14 + (ABS(CHECKSUM(NEWID())) % 10), CreatedAt)           -- fresh
  END AS ExpiryDate,
  CreatedAt
FROM RandLots;

SELECT TOP 10 * FROM InventoryLot ORDER BY CreatedAt DESC;
SELECT COUNT(*) AS InventoryLots FROM InventoryLot;

--Seed DemandRequests (multiple time periods)
--Creates 100–160 requests across 12 weeks.
;WITH N AS (
  SELECT TOP (140) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS n
  FROM sys.objects
),
Req AS (
  SELECT
    v.Id AS VendorId,
    p.ProductId,
    CAST(ABS(CHECKSUM(NEWID())) % 190 + 10 AS decimal(18,2)) AS QuantityRequested,
    p.DefaultUnit AS Unit,
    DATEADD(day, - (ABS(CHECKSUM(NEWID())) % 84), CAST(GETUTCDATE() AS date)) AS CreatedAt
  FROM N
  CROSS APPLY (SELECT TOP 1 Id FROM #Vendors ORDER BY NEWID()) v
  CROSS APPLY (SELECT TOP 1 ProductId, DefaultUnit FROM Product ORDER BY NEWID()) p
)
INSERT INTO DemandRequest (VendorId, ProductId, QuantityRequested, Unit, NeededBy, Status, CreatedAt)
SELECT
  VendorId,
  ProductId,
  QuantityRequested,
  Unit,
  DATEADD(day, 1 + (ABS(CHECKSUM(NEWID())) % 6), CreatedAt) AS NeededBy,
  'Open' AS Status,
  CreatedAt
FROM Req;

SELECT COUNT(*) AS DemandRequests FROM DemandRequest;
SELECT MIN(CreatedAt) MinDate, MAX(CreatedAt) MaxDate FROM DemandRequest;

--Seed Dispatches (history)
;WITH DR AS (
  SELECT
    DemandRequestId,
    VendorId,
    ProductId,
    QuantityRequested,
    Unit,
    CreatedAt
  FROM DemandRequest
),
Pick AS (
  SELECT
    dr.*,
    ABS(CHECKSUM(NEWID())) % 100 AS Roll,
    f.Id AS FarmerId
  FROM DR dr
  CROSS APPLY (SELECT TOP 1 Id FROM #Farmers ORDER BY NEWID()) f
),
ToDispatch AS (
  SELECT *
  FROM Pick
  WHERE Roll < 80  -- only create dispatch for 0-79 (80% of requests)
)
INSERT INTO Dispatch
(DemandRequestId, FarmerId, VendorId, ProductId, QuantityDispatched, Unit, DispatchDate, DeliveryStatus, CreatedAt)
SELECT
  DemandRequestId,
  FarmerId,
  VendorId,
  ProductId,
  CASE
    WHEN Roll < 65 THEN CAST(QuantityRequested * (0.80 + (ABS(CHECKSUM(NEWID())) % 21) / 100.0) AS decimal(18,2)) -- 80%-100%
    ELSE CAST(0 AS decimal(18,2))
  END AS QuantityDispatched,
  Unit,
  DATEADD(day, 1 + (ABS(CHECKSUM(NEWID())) % 5), CreatedAt) AS DispatchDate,
  CASE WHEN Roll < 65 THEN 'Delivered' ELSE 'Cancelled' END AS DeliveryStatus,
  DATEADD(day, 1 + (ABS(CHECKSUM(NEWID())) % 5), CreatedAt) AS CreatedAt
FROM ToDispatch;

--update DemandRequest status based on dispatch outcome
-- Set Fulfilled where Delivered
UPDATE dr
SET dr.Status = 'Fulfilled'
FROM DemandRequest dr
JOIN Dispatch d ON d.DemandRequestId = dr.DemandRequestId
WHERE d.DeliveryStatus = 'Delivered';

-- Set Cancelled where Cancelled
UPDATE dr
SET dr.Status = 'Cancelled'
FROM DemandRequest dr
JOIN Dispatch d ON d.DemandRequestId = dr.DemandRequestId
WHERE d.DeliveryStatus = 'Cancelled';

SELECT Status, COUNT(*) AS Cnt
FROM DemandRequest
GROUP BY Status;

SELECT DeliveryStatus, COUNT(*) AS Cnt
FROM Dispatch
GROUP BY DeliveryStatus;
