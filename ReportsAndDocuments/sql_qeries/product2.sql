USE FarmVendorDb;
GO

/* 1) Add image columns only if they do not already exist */
IF COL_LENGTH('Product', 'ImageSource') IS NULL
    ALTER TABLE Product ADD ImageSource VARCHAR(50) NULL;
GO

IF COL_LENGTH('Product', 'ImageThumbUrl') IS NULL
    ALTER TABLE Product ADD ImageThumbUrl VARCHAR(MAX) NULL;
GO

IF COL_LENGTH('Product', 'ImageUrl') IS NULL
    ALTER TABLE Product ADD ImageUrl VARCHAR(MAX) NULL;
GO

IF COL_LENGTH('Product', 'PhotographerName') IS NULL
    ALTER TABLE Product ADD PhotographerName VARCHAR(100) NULL;
GO

IF COL_LENGTH('Product', 'PhotographerProfile') IS NULL
    ALTER TABLE Product ADD PhotographerProfile VARCHAR(MAX) NULL;
GO

/* 2) Update existing products that are already in your table */

UPDATE Product
SET
    Category = 'Vegetables',
    DefaultUnit = 'kg',
    ImageSource = 'Unsplash',
    ImageThumbUrl = 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200',
    ImageUrl = 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
    PhotographerName = 'Markus Spiske',
    PhotographerProfile = 'https://unsplash.com/@markusspiske'
WHERE Name IN ('Tomatoes', 'Tomato');
GO

UPDATE Product
SET
    Category = 'Vegetables',
    DefaultUnit = 'kg',
    ImageSource = 'Unsplash',
    ImageThumbUrl = 'https://images.unsplash.com/photo-1664975367131-4c7ac2efa704?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5MTQwODN8MHwxfHNlYXJjaHw2fHxvbmlvbnxlbnwwfHx8fDE3NzUxNzYwNzF8MA&ixlib=rb-4.1.0&q=80&w=200',
    ImageUrl = 'https://images.unsplash.com/photo-1664975367131-4c7ac2efa704?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5MTQwODN8MHwxfHNlYXJjaHw2fHxvbmlvbnxlbnwwfHx8fDE3NzUxNzYwNzF8MA&ixlib=rb-4.1.0&q=80&w=400',
    PhotographerName = 'Katerina Holmes',
    PhotographerProfile = 'https://unsplash.com/@katerinaholmes'
WHERE Name IN ('Onions', 'Onion');
GO

UPDATE Product
SET
    Category = 'Vegetables',
    DefaultUnit = 'kg',
    ImageSource = 'Unsplash',
    ImageThumbUrl = 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200',
    ImageUrl = 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
    PhotographerName = 'Jeshoots',
    PhotographerProfile = 'https://unsplash.com/@jeshoots'
WHERE Name IN ('Potatoes', 'Potato');
GO

UPDATE Product
SET
    Category = 'Dairy',
    DefaultUnit = 'L',
    ImageSource = 'Unsplash',
    ImageThumbUrl = 'https://images.unsplash.com/photo-1550583724-b2692b85b150?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200',
    ImageUrl = 'https://images.unsplash.com/photo-1550583724-b2692b85b150?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
    PhotographerName = 'Eiliv Aceron',
    PhotographerProfile = 'https://unsplash.com/@eilivaceron'
WHERE Name = 'Milk';
GO

UPDATE Product
SET
    Category = 'Dairy',
    DefaultUnit = 'dozen',
    ImageSource = 'Unsplash',
    ImageThumbUrl = 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200',
    ImageUrl = 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
    PhotographerName = 'Jakub Kapusnak',
    PhotographerProfile = 'https://unsplash.com/@foodiesfeed'
WHERE Name = 'Eggs';
GO

UPDATE Product
SET
    Category = 'Vegetables',
    DefaultUnit = 'kg',
    ImageSource = 'Unsplash',
    ImageThumbUrl = 'https://images.unsplash.com/photo-1622205313162-be1d5712a43d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200',
    ImageUrl = 'https://images.unsplash.com/photo-1622205313162-be1d5712a43d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
    PhotographerName = 'Dovile Ramoskaite',
    PhotographerProfile = 'https://unsplash.com/@dovilerm'
WHERE Name IN ('Romaine', 'Lettuce');
GO

UPDATE Product
SET
    Category = 'Fruit',
    DefaultUnit = 'kg',
    ImageSource = 'Unsplash',
    ImageThumbUrl = 'https://images.unsplash.com/photo-1626597825713-2cf6ad237229?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200',
    ImageUrl = 'https://images.unsplash.com/photo-1626597825713-2cf6ad237229?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
    PhotographerName = 'Moon Moons',
    PhotographerProfile = 'https://unsplash.com/@moonmoons_days'
WHERE Name = 'Raspberry';
GO

UPDATE Product
SET
    Category = 'Fruit',
    DefaultUnit = 'kg',
    ImageSource = 'Unsplash',
    ImageThumbUrl = 'https://images.unsplash.com/photo-1594002348772-bc0cb57ade8b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200',
    ImageUrl = 'https://images.unsplash.com/photo-1594002348772-bc0cb57ade8b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
    PhotographerName = 'Melissa Belanger',
    PhotographerProfile = 'https://unsplash.com/@melissabelanger'
WHERE Name IN ('Blueberry', 'blueberry');
GO

/* 3) Insert only missing products (without ProductId) */

IF NOT EXISTS (SELECT 1 FROM Product WHERE Name = 'Carrot')
INSERT INTO Product
(Name, Category, DefaultUnit, IsActive, ImageSource, ImageThumbUrl, ImageUrl, PhotographerName, PhotographerProfile)
VALUES
('Carrot','Vegetable','kg',1,'Unsplash',
'https://images.unsplash.com/photo-1445282768818-728615cc910a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200',
'https://images.unsplash.com/photo-1445282768818-728615cc910a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
'NeONBRAND','https://unsplash.com/@neonbrand');
GO

IF NOT EXISTS (SELECT 1 FROM Product WHERE Name = 'Cucumber')
INSERT INTO Product
(Name, Category, DefaultUnit, IsActive, ImageSource, ImageThumbUrl, ImageUrl, PhotographerName, PhotographerProfile)
VALUES
('Cucumber','Vegetable','kg',1,'Unsplash',
'https://images.unsplash.com/photo-1604977042946-1eecc30f269e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200',
'https://images.unsplash.com/photo-1604977042946-1eecc30f269e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
'Mockup Graphics','https://unsplash.com/@mockupgraphics');
GO

IF NOT EXISTS (SELECT 1 FROM Product WHERE Name = 'Spinach')
INSERT INTO Product
(Name, Category, DefaultUnit, IsActive, ImageSource, ImageThumbUrl, ImageUrl, PhotographerName, PhotographerProfile)
VALUES
('Spinach','Vegetable','kg',1,'Unsplash',
'https://images.unsplash.com/photo-1576045057995-568f588f82fb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200',
'https://images.unsplash.com/photo-1576045057995-568f588f82fb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
'Louis Hansel','https://unsplash.com/@louishansel');
GO

IF NOT EXISTS (SELECT 1 FROM Product WHERE Name = 'Bell Pepper')
INSERT INTO Product
(Name, Category, DefaultUnit, IsActive, ImageSource, ImageThumbUrl, ImageUrl, PhotographerName, PhotographerProfile)
VALUES
('Bell Pepper','Vegetable','kg',1,'Unsplash',
'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200',
'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
'Stephanie Studer','https://unsplash.com/@stephaniestuder');
GO

IF NOT EXISTS (SELECT 1 FROM Product WHERE Name = 'Broccoli')
INSERT INTO Product
(Name, Category, DefaultUnit, IsActive, ImageSource, ImageThumbUrl, ImageUrl, PhotographerName, PhotographerProfile)
VALUES
('Broccoli','Vegetable','kg',1,'Unsplash',
'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200',
'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
'Dan Gold','https://unsplash.com/@dangoldphoto');
GO

IF NOT EXISTS (SELECT 1 FROM Product WHERE Name = 'Cauliflower')
INSERT INTO Product
(Name, Category, DefaultUnit, IsActive, ImageSource, ImageThumbUrl, ImageUrl, PhotographerName, PhotographerProfile)
VALUES
('Cauliflower','Vegetable','kg',1,'Unsplash',
'https://images.unsplash.com/photo-1510627498534-cf7e9002facc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200',
'https://images.unsplash.com/photo-1510627498534-cf7e9002facc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
'Monika Grabkowska','https://unsplash.com/@moniqa');
GO

IF NOT EXISTS (SELECT 1 FROM Product WHERE Name = 'Strawberry')
INSERT INTO Product
(Name, Category, DefaultUnit, IsActive, ImageSource, ImageThumbUrl, ImageUrl, PhotographerName, PhotographerProfile)
VALUES
('Strawberry','Fruit','kg',1,'Unsplash',
'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200',
'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
'LuAnn Hunt','https://unsplash.com/@luannhunt180');
GO

IF NOT EXISTS (SELECT 1 FROM Product WHERE Name = 'Apple')
INSERT INTO Product
(Name, Category, DefaultUnit, IsActive, ImageSource, ImageThumbUrl, ImageUrl, PhotographerName, PhotographerProfile)
VALUES
('Apple','Fruit','kg',1,'Unsplash',
'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200',
'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
'Rachel Park','https://unsplash.com/@rachelpark');
GO

IF NOT EXISTS (SELECT 1 FROM Product WHERE Name = 'Pear')
INSERT INTO Product
(Name, Category, DefaultUnit, IsActive, ImageSource, ImageThumbUrl, ImageUrl, PhotographerName, PhotographerProfile)
VALUES
('Pear','Fruit','kg',1,'Unsplash',
'https://images.unsplash.com/photo-1615485925873-5b2f8d6e7ca7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200',
'https://images.unsplash.com/photo-1615485925873-5b2f8d6e7ca7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
'Markus Spiske','https://unsplash.com/@markusspiske');
GO

IF NOT EXISTS (SELECT 1 FROM Product WHERE Name = 'Grape')
INSERT INTO Product
(Name, Category, DefaultUnit, IsActive, ImageSource, ImageThumbUrl, ImageUrl, PhotographerName, PhotographerProfile)
VALUES
('Grape','Fruit','kg',1,'Unsplash',
'https://images.unsplash.com/photo-1515778767554-36f52d32d77f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200',
'https://images.unsplash.com/photo-1515778767554-36f52d32d77f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
'Sonja Langford','https://unsplash.com/@sonjalangford');
GO

IF NOT EXISTS (SELECT 1 FROM Product WHERE Name = 'Orange')
INSERT INTO Product
(Name, Category, DefaultUnit, IsActive, ImageSource, ImageThumbUrl, ImageUrl, PhotographerName, PhotographerProfile)
VALUES
('Orange','Fruit','kg',1,'Unsplash',
'https://images.unsplash.com/photo-1547514701-42782101795e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200',
'https://images.unsplash.com/photo-1547514701-42782101795e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
'Bruno Nascimento','https://unsplash.com/@bruno_nascimento');
GO

IF NOT EXISTS (SELECT 1 FROM Product WHERE Name = 'Yogurt')
INSERT INTO Product
(Name, Category, DefaultUnit, IsActive, ImageSource, ImageThumbUrl, ImageUrl, PhotographerName, PhotographerProfile)
VALUES
('Yogurt','Dairy','L',1,'Unsplash',
'https://images.unsplash.com/photo-1571212515416-fef01fc43637?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200',
'https://images.unsplash.com/photo-1571212515416-fef01fc43637?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
'Sara Cervera','https://unsplash.com/@saracervera');
GO

IF NOT EXISTS (SELECT 1 FROM Product WHERE Name = 'Cheese')
INSERT INTO Product
(Name, Category, DefaultUnit, IsActive, ImageSource, ImageThumbUrl, ImageUrl, PhotographerName, PhotographerProfile)
VALUES
('Cheese','Dairy','kg',1,'Unsplash',
'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200',
'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
'Alex Munsell','https://unsplash.com/@alexmunsell');
GO

IF NOT EXISTS (SELECT 1 FROM Product WHERE Name = 'Basil')
INSERT INTO Product
(Name, Category, DefaultUnit, IsActive, ImageSource, ImageThumbUrl, ImageUrl, PhotographerName, PhotographerProfile)
VALUES
('Basil','Herb','bunch',1,'Unsplash',
'https://images.unsplash.com/photo-1618375569909-3c8616cf7731?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200',
'https://images.unsplash.com/photo-1618375569909-3c8616cf7731?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
'Markus Spiske','https://unsplash.com/@markusspiske');
GO

IF NOT EXISTS (SELECT 1 FROM Product WHERE Name = 'Cilantro')
INSERT INTO Product
(Name, Category, DefaultUnit, IsActive, ImageSource, ImageThumbUrl, ImageUrl, PhotographerName, PhotographerProfile)
VALUES
('Cilantro','Herb','bunch',1,'Unsplash',
'https://images.unsplash.com/photo-1625943553852-781c6dd46c4f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200',
'https://images.unsplash.com/photo-1625943553852-781c6dd46c4f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
'Louis Hansel','https://unsplash.com/@louishansel');
GO

IF NOT EXISTS (SELECT 1 FROM Product WHERE Name = 'Parsley')
INSERT INTO Product
(Name, Category, DefaultUnit, IsActive, ImageSource, ImageThumbUrl, ImageUrl, PhotographerName, PhotographerProfile)
VALUES
('Parsley','Herb','bunch',1,'Unsplash',
'https://images.unsplash.com/photo-1604908176997-431a6b8b8a57?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200',
'https://images.unsplash.com/photo-1604908176997-431a6b8b8a57?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
'Anna Pelzer','https://unsplash.com/@annapelzer');
GO

IF NOT EXISTS (SELECT 1 FROM Product WHERE Name = 'Mushroom')
INSERT INTO Product
(Name, Category, DefaultUnit, IsActive, ImageSource, ImageThumbUrl, ImageUrl, PhotographerName, PhotographerProfile)
VALUES
('Mushroom','Vegetable','kg',1,'Unsplash',
'https://images.unsplash.com/photo-1506806732259-39c2d0268443?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200',
'https://images.unsplash.com/photo-1506806732259-39c2d0268443?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
'Igor Miske','https://unsplash.com/@igormiske');
GO

IF NOT EXISTS (SELECT 1 FROM Product WHERE Name = 'Garlic')
INSERT INTO Product
(Name, Category, DefaultUnit, IsActive, ImageSource, ImageThumbUrl, ImageUrl, PhotographerName, PhotographerProfile)
VALUES
('Garlic','Vegetable','kg',1,'Unsplash',
'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200',
'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
'Markus Spiske','https://unsplash.com/@markusspiske');
GO