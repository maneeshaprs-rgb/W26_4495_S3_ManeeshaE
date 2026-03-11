using Microsoft.ML;
using Microsoft.ML.Transforms.TimeSeries;

namespace FarmVendor.Api.Services.Forecasting;

public class MLDemandForecastingEngine
{
    private readonly MLContext _mlContext;

    public MLDemandForecastingEngine()
    {
        _mlContext = new MLContext(seed: 1);
    }

    public ForecastTrainingResult TrainAndForecast(
        List<float> orderedSeries,
        int horizon)
    {
        if (orderedSeries == null || orderedSeries.Count < 10)
            throw new InvalidOperationException("Not enough historical data to train forecasting model.");

        var data = orderedSeries
            .Select(x => new DemandTimeSeriesPoint { Quantity = x })
            .ToList();

        IDataView dataView = _mlContext.Data.LoadFromEnumerable(data);

        int seriesLength = Math.Max(orderedSeries.Count, horizon + 10);
        int trainSize = orderedSeries.Count;

        // reasonable defaults; tune later for research comparison
        int windowSize = Math.Min(7, Math.Max(3, orderedSeries.Count / 4));

        var pipeline = _mlContext.Forecasting.ForecastBySsa(
            outputColumnName: nameof(DemandForecastPrediction.ForecastedQuantity),
            inputColumnName: nameof(DemandTimeSeriesPoint.Quantity),
            windowSize: windowSize,
            seriesLength: seriesLength,
            trainSize: trainSize,
            horizon: horizon,
            confidenceLevel: 0.95f,
            confidenceLowerBoundColumn: nameof(DemandForecastPrediction.LowerBoundQuantity),
            confidenceUpperBoundColumn: nameof(DemandForecastPrediction.UpperBoundQuantity));

        SsaForecastingTransformer model = pipeline.Fit(dataView);

        TimeSeriesPredictionEngine<DemandTimeSeriesPoint, DemandForecastPrediction> engine =
            model.CreateTimeSeriesEngine<DemandTimeSeriesPoint, DemandForecastPrediction>(_mlContext);

        DemandForecastPrediction prediction = engine.Predict();

        return new ForecastTrainingResult
        {
            Forecast = prediction.ForecastedQuantity.ToList(),
            LowerBounds = prediction.LowerBoundQuantity.ToList(),
            UpperBounds = prediction.UpperBoundQuantity.ToList()
        };
    }
}