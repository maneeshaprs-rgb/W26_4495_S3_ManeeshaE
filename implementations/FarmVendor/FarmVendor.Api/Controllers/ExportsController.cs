using System.Text;
using FarmVendor.Api.Data;
using FarmVendor.Api.Models.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FarmVendor.Api.Controllers;

[ApiController]
[Route("api/exports")]
[Authorize]
public class ExportsController : ControllerBase
{
    private readonly AppDbContext _db;
    public ExportsController(AppDbContext db) { _db = db; }

    // GET /api/exports/demandrequests.csv?from=2026-01-01&to=2026-03-31
    [HttpGet("demandrequests.csv")]
    public async Task<IActionResult> ExportDemandRequestsCsv([FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        var q = _db.DemandRequest
            .Include(r => r.Product)
            .AsNoTracking()
            .AsQueryable();

        if (from.HasValue) q = q.Where(r => r.CreatedAt >= from.Value);
        if (to.HasValue) q = q.Where(r => r.CreatedAt <= to.Value);

        // dispatch aggregation per demand request
        var dispatchAgg = _db.Dispatch
            .AsNoTracking()
            .Where(d => d.DemandRequestId != null)
            .GroupBy(d => d.DemandRequestId!.Value)
            .Select(g => new
            {
                DemandRequestId = g.Key,
                TotalDispatchedQty = g.Sum(x => x.QuantityDispatched),
                FirstDispatchDate = g.Min(x => (DateTime?)x.DispatchDate),
                DeliveredDate = g.Where(x => x.DeliveryStatus == "Delivered")
                                 .Select(x => (DateTime?)x.DispatchDate)
                                 .Max()
            });

        var rows = await (
            from r in q
            join da in dispatchAgg on r.DemandRequestId equals da.DemandRequestId into daj
            from da in daj.DefaultIfEmpty()
            select new DemandRequestExportRowDto
            {
                DemandRequestId = r.DemandRequestId,
                VendorId = r.VendorId,
                ProductId = r.ProductId,
                ProductName = r.Product.Name,

                QuantityRequested = r.QuantityRequested,
                Unit = r.Unit,
                CreatedAt = r.CreatedAt,
                NeededBy = r.NeededBy,
                Status = r.Status,

                TotalDispatchedQty = da != null ? da.TotalDispatchedQty : 0,
                FirstDispatchDate = da != null ? da.FirstDispatchDate : null,
                DeliveredDate = da != null ? da.DeliveredDate : null,

                IsDelivered = da != null && da.DeliveredDate != null,
                IsFulfilledOnTime = da != null && da.DeliveredDate != null && da.DeliveredDate <= r.NeededBy
            }
        ).ToListAsync();

        // Build CSV
        var sb = new StringBuilder();
        sb.AppendLine("DemandRequestId,VendorId,ProductId,ProductName,QuantityRequested,Unit,CreatedAt,NeededBy,Status,TotalDispatchedQty,FirstDispatchDate,DeliveredDate,IsDelivered,IsFulfilledOnTime");

        foreach (var x in rows)
        {
            string Esc(string s) => "\"" + (s ?? "").Replace("\"", "\"\"") + "\"";
            sb.AppendLine(string.Join(",",
                x.DemandRequestId,
                Esc(x.VendorId),
                x.ProductId,
                Esc(x.ProductName),
                x.QuantityRequested,
                Esc(x.Unit),
                x.CreatedAt.ToString("o"),
                x.NeededBy.ToString("o"),
                Esc(x.Status),
                x.TotalDispatchedQty,
                x.FirstDispatchDate?.ToString("o") ?? "",
                x.DeliveredDate?.ToString("o") ?? "",
                x.IsDelivered ? "1" : "0",
                x.IsFulfilledOnTime ? "1" : "0"
            ));
        }

        var bytes = Encoding.UTF8.GetBytes(sb.ToString());
        return File(bytes, "text/csv", "demandrequests_export.csv");
    }
}