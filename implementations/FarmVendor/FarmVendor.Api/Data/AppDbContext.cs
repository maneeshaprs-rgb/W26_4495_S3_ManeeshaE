using FarmVendor.Api.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace FarmVendor.Api.Data;

public class AppDbContext : IdentityDbContext<ApplicationUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Fix SQL Server "multiple cascade paths" on RelationshipStats
        modelBuilder.Entity<RelationshipStat>()
            .HasOne(x => x.Farmer)
            .WithMany()
            .HasForeignKey(x => x.FarmerId)
            .OnDelete(DeleteBehavior.Restrict); // or NoAction

        modelBuilder.Entity<RelationshipStat>()
            .HasOne(x => x.Vendor)
            .WithMany()
            .HasForeignKey(x => x.VendorId)
            .OnDelete(DeleteBehavior.Restrict); // or NoAction

        // Optional but recommended: prevent decimal truncation for Lat/Lng
        modelBuilder.Entity<ApplicationUser>()
            .Property(x => x.Latitude)
            .HasPrecision(9, 6);

        modelBuilder.Entity<ApplicationUser>()
            .Property(x => x.Longitude)
            .HasPrecision(9, 6);
    }
}
