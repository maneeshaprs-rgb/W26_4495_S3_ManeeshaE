USE FarmVendorDb;
GO

IF (SELECT COUNT(*) FROM Product) < 20
BEGIN
    INSERT INTO Product (Name, Category, DefaultUnit, IsActive)
    VALUES
    ('Tomatoes','Vegetable','kg',1),
    ('Onions','Vegetable','kg',1),
    ('Potatoes','Vegetable','kg',1),
    ('Carrots','Vegetable','kg',1),
    ('Cabbage','Vegetable','kg',1),
    ('Spinach','Vegetable','kg',1),
    ('Lettuce','Vegetable','kg',1),
    ('Bell Pepper','Vegetable','kg',1),
    ('Cucumber','Vegetable','kg',1),
    ('Garlic','Vegetable','kg',1),

    ('Apples','Fruit','kg',1),
    ('Bananas','Fruit','kg',1),
    ('Strawberries','Fruit','kg',1),
    ('Blueberries','Fruit','kg',1),
    ('Grapes','Fruit','kg',1),

    ('Milk','Dairy','L',1),
    ('Yogurt','Dairy','L',1),
    ('Cheese','Dairy','kg',1),

    ('Eggs','Poultry','dozen',1),
    ('Chicken','Meat','kg',1),
    ('Beef','Meat','kg',1),
    ('Salmon','Seafood','kg',1);
END
GO