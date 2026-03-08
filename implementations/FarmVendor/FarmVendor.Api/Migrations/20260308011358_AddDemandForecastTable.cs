using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FarmVendor.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddDemandForecastTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DemandForecast",
                columns: table => new
                {
                    DemandForecastId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    VendorId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ProductId = table.Column<int>(type: "int", nullable: false),
                    ForecastDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ForecastQty = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ModelName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LookbackPeriods = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DemandForecast", x => x.DemandForecastId);
                    table.ForeignKey(
                        name: "FK_DemandForecast_AspNetUsers_VendorId",
                        column: x => x.VendorId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_DemandForecast_Product_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Product",
                        principalColumn: "ProductId");
                });

            migrationBuilder.CreateIndex(
                name: "IX_DemandForecast_ProductId",
                table: "DemandForecast",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_DemandForecast_VendorId",
                table: "DemandForecast",
                column: "VendorId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DemandForecast");
        }
    }
}
