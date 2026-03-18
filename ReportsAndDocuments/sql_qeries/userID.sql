--select user id for specific user
USE FarmVendorDb;
SELECT Id, Email
FROM AspNetUsers
WHERE Email IN ('farmer1@test.com','vendor1@test.com');