using FarmVendor.Api.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace FarmVendor.Api.Data;

public class AppDbContext : IdentityDbContext<ApplicationUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Dispatch>()
            .HasOne(d => d.Farmer)
            .WithMany()
            .HasForeignKey(d => d.FarmerId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.Entity<Dispatch>()
            .HasOne(d => d.Vendor)
            .WithMany()
            .HasForeignKey(d => d.VendorId)
            .OnDelete(DeleteBehavior.NoAction);

        // (Optional but recommended) RelationshipStats fix too
        builder.Entity<RelationshipStat>()
            .HasOne(r => r.Farmer)
            .WithMany()
            .HasForeignKey(r => r.FarmerId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.Entity<RelationshipStat>()
            .HasOne(r => r.Vendor)
            .WithMany()
            .HasForeignKey(r => r.VendorId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.Entity<ApplicationUser>()
            .Property(u => u.Latitude)
            .HasPrecision(9, 6);

        builder.Entity<ApplicationUser>()
            .Property(u => u.Longitude)
            .HasPrecision(9, 6);
    }
}
