using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FarmVendor.Api.Migrations
{
    /// <inheritdoc />
    public partial class UpdateRelationshipStatForScoring : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CancelledCount",
                table: "RelationshipStat",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "DeliveredCount",
                table: "RelationshipStat",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastUpdatedAt",
                table: "RelationshipStat",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<int>(
                name: "OnTimeDeliveredCount",
                table: "RelationshipStat",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "RelationshipScore",
                table: "RelationshipStat",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "TotalDeliveredQty",
                table: "RelationshipStat",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "TotalDispatches",
                table: "RelationshipStat",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "TotalRequestedQty",
                table: "RelationshipStat",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CancelledCount",
                table: "RelationshipStat");

            migrationBuilder.DropColumn(
                name: "DeliveredCount",
                table: "RelationshipStat");

            migrationBuilder.DropColumn(
                name: "LastUpdatedAt",
                table: "RelationshipStat");

            migrationBuilder.DropColumn(
                name: "OnTimeDeliveredCount",
                table: "RelationshipStat");

            migrationBuilder.DropColumn(
                name: "RelationshipScore",
                table: "RelationshipStat");

            migrationBuilder.DropColumn(
                name: "TotalDeliveredQty",
                table: "RelationshipStat");

            migrationBuilder.DropColumn(
                name: "TotalDispatches",
                table: "RelationshipStat");

            migrationBuilder.DropColumn(
                name: "TotalRequestedQty",
                table: "RelationshipStat");
        }
    }
}
