USE FarmVendorDb;
GO

INSERT INTO DemandRequest
    (VendorId, ProductId, QuantityRequested, Unit, NeededBy, Status, CreatedAt)
VALUES
('2660cd91-4a85-4083-b925-ceceab6b8529',4,30,'kg','2026-03-29','Open','2026-03-01'),
('2660cd91-4a85-4083-b925-ceceab6b8529',4,32,'kg','2026-03-29','Open','2026-03-02'),
('2660cd91-4a85-4083-b925-ceceab6b8529',4,28,'kg','2026-03-29','Open','2026-03-03'),
('2660cd91-4a85-4083-b925-ceceab6b8529',4,35,'kg','2026-03-29','Open','2026-03-04'),
('2660cd91-4a85-4083-b925-ceceab6b8529',4,29,'kg','2026-03-29','Open','2026-03-05'),
('2660cd91-4a85-4083-b925-ceceab6b8529',4,40,'kg','2026-03-29','Open','2026-03-06');