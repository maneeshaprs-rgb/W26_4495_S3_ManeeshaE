namespace FarmVendor.Api.Services.Forecasting;

public class ForecastTrainingResult
{
    public List<float> Forecast { get; set; } = new();
    public List<float> LowerBounds { get; set; } = new();
    public List<float> UpperBounds { get; set; } = new();
}