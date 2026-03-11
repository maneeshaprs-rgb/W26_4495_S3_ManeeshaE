using Microsoft.ML.Data;

namespace FarmVendor.Api.Services.Forecasting;

public class DemandForecastPrediction
{
    [VectorType]
    public float[] ForecastedQuantity { get; set; } = Array.Empty<float>();

    [VectorType]
    public float[] LowerBoundQuantity { get; set; } = Array.Empty<float>();

    [VectorType]
    public float[] UpperBoundQuantity { get; set; } = Array.Empty<float>();
}