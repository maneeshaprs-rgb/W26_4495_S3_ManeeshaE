using FarmVendor.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace FarmVendor.Api.Data;

public static class SeedData
{
    public static async Task InitializeAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();

        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();

        // 1) Ensure DB is ready
        await db.Database.MigrateAsync();

        // 2) Create roles
        await EnsureRoleAsync(roleManager, "Farmer");
        await EnsureRoleAsync(roleManager, "Vendor");

        // 3) Seed products
        await SeedProductsAsync(db);

        // 4) Seed users (farmers & vendors)
        var farmers = await SeedUsersAsync(userManager, "Farmer", 10);
        var vendors  = await SeedUsersAsync(userManager, "Vendor", 15);

        // 5) Seed inventory lots
        await SeedInventoryLotsAsync(db, farmers);

        // 6) Seed demand requests
        await SeedDemandRequestsAsync(db, vendors);

        // 7) Seed dispatches (history)
        await SeedDispatchesAsync(db, farmers, vendors);

        await db.SaveChangesAsync();
    }

    static async Task EnsureRoleAsync(RoleManager<IdentityRole> roleManager, string role)
    {
        if (!await roleManager.RoleExistsAsync(role))
            await roleManager.CreateAsync(new IdentityRole(role));
    }

    static async Task SeedProductsAsync(AppDbContext db)
    {
        if (await db.Products.AnyAsync()) return;

        var products = new List<Product>
        {
            new() { Name="Tomatoes", Category="Vegetables", DefaultUnit="kg", IsActive=true },
            new() { Name="Onions", Category="Vegetables", DefaultUnit="kg", IsActive=true },
            new() { Name="Potatoes", Category="Vegetables", DefaultUnit="kg", IsActive=true },
            new() { Name="Milk", Category="Dairy", DefaultUnit="L", IsActive=true },
            new() { Name="Eggs", Category="Dairy", DefaultUnit="dozen", IsActive=true },
            // add more until 20–30
        };

        db.Products.AddRange(products);
        await db.SaveChangesAsync();
    }

    static async Task<List<ApplicationUser>> SeedUsersAsync(
        UserManager<ApplicationUser> userManager,
        string role,
        int count)
    {
        var list = new List<ApplicationUser>();

        for (int i = 1; i <= count; i++)
        {
            var email = $"{role.ToLower()}{i}@test.com";   // farmer1@test.com etc.
            var user = await userManager.FindByEmailAsync(email);

            if (user == null)
            {
                user = new ApplicationUser
                {
                    UserName = email,
                    Email = email,
                    DisplayName = $"{role} {i}",
                    City = "Surrey",
                    Province = "BC",
                    PostalCode = "V3T0A1",
                    Latitude = 49.1913m + (i * 0.001m),
                    Longitude = -122.8490m - (i * 0.001m),
                    CreatedAt = DateTime.UtcNow
                };

                // password must meet Identity rules
                await userManager.CreateAsync(user, "Test@123");
                await userManager.AddToRoleAsync(user, role);
            }

            list.Add(user);
        }

        return list;
    }

    static async Task SeedInventoryLotsAsync(AppDbContext db, List<ApplicationUser> farmers)
    {
        if (await db.InventoryLots.AnyAsync()) return;

        var products = await db.Products.ToListAsync();
        var rnd = new Random();

        foreach (var farmer in farmers)
        {
            // give each farmer 3 lots
            for (int i = 0; i < 3; i++)
            {
                var p = products[rnd.Next(products.Count)];

                db.InventoryLots.Add(new InventoryLot
                {
                    FarmerId = farmer.Id,
                    ProductId = p.ProductId,
                    QuantityAvailable = rnd.Next(10, 100),
                    Unit = p.DefaultUnit,
                    ExpiryDate = DateTime.UtcNow.AddDays(rnd.Next(3, 20)),
                    CreatedAt = DateTime.UtcNow
                });
            }
        }

        await db.SaveChangesAsync();
    }

    static async Task SeedDemandRequestsAsync(AppDbContext db, List<ApplicationUser> vendors)
    {
        if (await db.DemandRequests.AnyAsync()) return;

        var products = await db.Products.ToListAsync();
        var rnd = new Random();

        foreach (var vendor in vendors)
        {
            // 2 requests each vendor
            for (int i = 0; i < 2; i++)
            {
                var p = products[rnd.Next(products.Count)];

                db.DemandRequests.Add(new DemandRequest
                {
                    VendorId = vendor.Id,
                    ProductId = p.ProductId,
                    QuantityRequested = rnd.Next(5, 60),
                    Unit = p.DefaultUnit,
                    NeededBy = DateTime.UtcNow.AddDays(rnd.Next(2, 14)),
                    Status = "Open",
                    CreatedAt = DateTime.UtcNow.AddDays(-rnd.Next(1, 10))
                });
            }
        }

        await db.SaveChangesAsync();
    }

    static async Task SeedDispatchesAsync(AppDbContext db, List<ApplicationUser> farmers, List<ApplicationUser> vendors)
    {
        if (await db.Dispatches.AnyAsync()) return;

        var products = await db.Products.ToListAsync();
        var rnd = new Random();

        // create ~30 dispatch history records
        for (int i = 0; i < 30; i++)
        {
            var farmer = farmers[rnd.Next(farmers.Count)];
            var vendor = vendors[rnd.Next(vendors.Count)];
            var p = products[rnd.Next(products.Count)];

            db.Dispatches.Add(new Dispatch
            {
                FarmerId = farmer.Id,
                VendorId = vendor.Id,
                ProductId = p.ProductId,
                QuantityDispatched = rnd.Next(5, 80),
                Unit = p.DefaultUnit,
                DispatchDate = DateTime.UtcNow.AddDays(-rnd.Next(1, 30)),
                DeliveryStatus = (i % 3 == 0) ? "Delivered" : "InTransit",
                CreatedAt = DateTime.UtcNow.AddDays(-rnd.Next(1, 30))
            });
        }

        await db.SaveChangesAsync();
    }
}
