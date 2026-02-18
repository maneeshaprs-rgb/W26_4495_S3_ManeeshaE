--check existing tables in FarmVendorDb
USE FarmVendorDb;
GO

SELECT name FROM sys.tables ORDER BY name;