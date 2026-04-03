USE FarmVendorDb;
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