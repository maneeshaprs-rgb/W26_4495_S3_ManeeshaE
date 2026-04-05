SELECT *
FROM DemandForecast
WHERE VendorId = 'a9f844e2-3407-45bb-bc09-25d5733c7fd9'
  AND ProductId = 3
  AND ModelName = 'MLNET_SSA'
  AND ForecastDate >= '2026-04-05'
ORDER BY ForecastDate;