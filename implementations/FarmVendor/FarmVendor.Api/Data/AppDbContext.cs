using FarmVendor.Api.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace FarmVendor.Api.Data;

public class AppDbContext : IdentityDbContext<ApplicationUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    // DbSets (this is what makes EF create tables)
    //DbSets for MVP ATABLES
    public DbSet<Product> Product => Set<Product>();
    public DbSet<DemandRequest> DemandRequest => Set<DemandRequest>();
    public DbSet<Dispatch> Dispatch => Set<Dispatch>();
    public DbSet<RelationshipStat> RelationshipStat => Set<RelationshipStat>();
    public DbSet<InventoryLot> InventoryLot => Set<InventoryLot>();   // this resolve issue on  inventoryLot table unavailability
    public DbSet<DemandForecast> DemandForecast => Set<DemandForecast>();
    public DbSet<RecommendedDispatchPlan> RecommendedDispatchPlan => Set<RecommendedDispatchPlan>();
    public DbSet<Conversation> Conversation => Set<Conversation>();
    public DbSet<ChatMessage> ChatMessage => Set<ChatMessage>();
    
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

        
        builder.Entity<DemandForecast>()
            .HasOne(f => f.Vendor)
            .WithMany()
            .HasForeignKey(f => f.VendorId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.Entity<DemandForecast>()
            .HasOne(f => f.Product)
            .WithMany()
            .HasForeignKey(f => f.ProductId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.Entity<ApplicationUser>()
            .Property(u => u.Latitude)
            .HasPrecision(9, 6);

        builder.Entity<ApplicationUser>()
            .Property(u => u.Longitude)
            .HasPrecision(9, 6);

        builder.Entity<RecommendedDispatchPlan>()
            .HasOne(r => r.Farmer)
            .WithMany()
            .HasForeignKey(r => r.FarmerId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.Entity<RecommendedDispatchPlan>()
            .HasOne(r => r.Vendor)
            .WithMany()
            .HasForeignKey(r => r.VendorId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.Entity<RecommendedDispatchPlan>()
            .HasOne(r => r.Product)
            .WithMany()
            .HasForeignKey(r => r.ProductId)
            .OnDelete(DeleteBehavior.NoAction);

        //adding RelationshipStat
        builder.Entity<RelationshipStat>()
            .Property(r => r.TotalRequestedQty)
            .HasPrecision(18, 2);

        builder.Entity<RelationshipStat>()
            .Property(r => r.TotalDeliveredQty)
            .HasPrecision(18, 2);

        builder.Entity<RelationshipStat>()
            .Property(r => r.RelationshipScore)
            .HasPrecision(18, 2);

        builder.Entity<Conversation>()
            .HasOne(c => c.Farmer)
            .WithMany()
            .HasForeignKey(c => c.FarmerId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.Entity<Conversation>()
            .HasOne(c => c.Vendor)
            .WithMany()
            .HasForeignKey(c => c.VendorId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.Entity<ChatMessage>()
            .HasOne(m => m.Conversation)
            .WithMany(c => c.Messages)
            .HasForeignKey(m => m.ConversationId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<ChatMessage>()
            .HasOne(m => m.Sender)
            .WithMany()
            .HasForeignKey(m => m.SenderId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.Entity<ChatMessage>()
            .Property(m => m.MessageText)
            .HasMaxLength(1000);

    }
}
