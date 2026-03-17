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
        if (orderedSeries == null || orderedSeries.Count < 5)
            throw new InvalidOperationException("Not enough historical data to train forecasting model.");

        var data = orderedSeries
            .Select(x => new DemandTimeSeriesPoint { Quantity = x })
            .ToList();

        IDataView dataView = _mlContext.Data.LoadFromEnumerable(data);

        int trainSize = orderedSeries.Count;
        int seriesLength = orderedSeries.Count;

        // safer settings for small datasets
        int windowSize = Math.Min(3, Math.Max(2, orderedSeries.Count / 3));

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
            Forecast = prediction.ForecastedQuantity?.ToList() ?? new List<float>(),
            LowerBounds = prediction.LowerBoundQuantity?.ToList() ?? new List<float>(),
            UpperBounds = prediction.UpperBoundQuantity?.ToList() ?? new List<float>()
        };
    }
}