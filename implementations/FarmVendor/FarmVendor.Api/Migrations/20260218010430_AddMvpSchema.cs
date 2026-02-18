using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FarmVendor.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddMvpSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "City",
                table: "AspNetUsers",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "AspNetUsers",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<decimal>(
                name: "Latitude",
                table: "AspNetUsers",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Longitude",
                table: "AspNetUsers",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PostalCode",
                table: "AspNetUsers",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Province",
                table: "AspNetUsers",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "Product",
                columns: table => new
                {
                    ProductId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Category = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DefaultUnit = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Product", x => x.ProductId);
                });

            migrationBuilder.CreateTable(
                name: "RelationshipStat",
                columns: table => new
                {
                    RelationshipStatId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FarmerId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    VendorId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    SuccessfulDispatchCount = table.Column<int>(type: "int", nullable: false),
                    CancelledDispatchCount = table.Column<int>(type: "int", nullable: false),
                    LastDispatchDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RelationshipStat", x => x.RelationshipStatId);
                    table.ForeignKey(
                        name: "FK_RelationshipStat_AspNetUsers_FarmerId",
                        column: x => x.FarmerId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_RelationshipStat_AspNetUsers_VendorId",
                        column: x => x.VendorId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "DemandRequest",
                columns: table => new
                {
                    DemandRequestId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    VendorId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ProductId = table.Column<int>(type: "int", nullable: false),
                    QuantityRequested = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Unit = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    NeededBy = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DemandRequest", x => x.DemandRequestId);
                    table.ForeignKey(
                        name: "FK_DemandRequest_AspNetUsers_VendorId",
                        column: x => x.VendorId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DemandRequest_Product_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Product",
                        principalColumn: "ProductId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Dispatch",
                columns: table => new
                {
                    DispatchId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DemandRequestId = table.Column<int>(type: "int", nullable: true),
                    FarmerId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    VendorId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ProductId = table.Column<int>(type: "int", nullable: false),
                    QuantityDispatched = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Unit = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DispatchDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DeliveryStatus = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Dispatch", x => x.DispatchId);
                    table.ForeignKey(
                        name: "FK_Dispatch_AspNetUsers_FarmerId",
                        column: x => x.FarmerId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Dispatch_AspNetUsers_VendorId",
                        column: x => x.VendorId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Dispatch_DemandRequest_DemandRequestId",
                        column: x => x.DemandRequestId,
                        principalTable: "DemandRequest",
                        principalColumn: "DemandRequestId");
                    table.ForeignKey(
                        name: "FK_Dispatch_Product_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Product",
                        principalColumn: "ProductId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DemandRequest_ProductId",
                table: "DemandRequest",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_DemandRequest_VendorId",
                table: "DemandRequest",
                column: "VendorId");

            migrationBuilder.CreateIndex(
                name: "IX_Dispatch_DemandRequestId",
                table: "Dispatch",
                column: "DemandRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_Dispatch_FarmerId",
                table: "Dispatch",
                column: "FarmerId");

            migrationBuilder.CreateIndex(
                name: "IX_Dispatch_ProductId",
                table: "Dispatch",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_Dispatch_VendorId",
                table: "Dispatch",
                column: "VendorId");

            migrationBuilder.CreateIndex(
                name: "IX_RelationshipStat_FarmerId",
                table: "RelationshipStat",
                column: "FarmerId");

            migrationBuilder.CreateIndex(
                name: "IX_RelationshipStat_VendorId",
                table: "RelationshipStat",
                column: "VendorId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Dispatch");

            migrationBuilder.DropTable(
                name: "RelationshipStat");

            migrationBuilder.DropTable(
                name: "DemandRequest");

            migrationBuilder.DropTable(
                name: "Product");

            migrationBuilder.DropColumn(
                name: "City",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "Latitude",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "Longitude",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "PostalCode",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "Province",
                table: "AspNetUsers");
        }
    }
}
