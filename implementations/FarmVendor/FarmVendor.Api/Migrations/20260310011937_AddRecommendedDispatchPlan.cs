using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FarmVendor.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddRecommendedDispatchPlan : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "RecommendedDispatchPlan",
                columns: table => new
                {
                    RecommendedDispatchPlanId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FarmerId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    VendorId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ProductId = table.Column<int>(type: "int", nullable: false),
                    RecommendedQty = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PlanDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Algorithm = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RecommendedDispatchPlan", x => x.RecommendedDispatchPlanId);
                    table.ForeignKey(
                        name: "FK_RecommendedDispatchPlan_AspNetUsers_FarmerId",
                        column: x => x.FarmerId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_RecommendedDispatchPlan_AspNetUsers_VendorId",
                        column: x => x.VendorId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_RecommendedDispatchPlan_Product_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Product",
                        principalColumn: "ProductId");
                });

            migrationBuilder.CreateIndex(
                name: "IX_RecommendedDispatchPlan_FarmerId",
                table: "RecommendedDispatchPlan",
                column: "FarmerId");

            migrationBuilder.CreateIndex(
                name: "IX_RecommendedDispatchPlan_ProductId",
                table: "RecommendedDispatchPlan",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_RecommendedDispatchPlan_VendorId",
                table: "RecommendedDispatchPlan",
                column: "VendorId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RecommendedDispatchPlan");
        }
    }
}
