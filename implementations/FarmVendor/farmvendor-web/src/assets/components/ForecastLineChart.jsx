import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function ForecastLineChart({ chartPoints }) {
  if (!chartPoints || chartPoints.length === 0) {
    return <div>No chart data available.</div>;
  }

  const allDates = [...new Set(chartPoints.map((p) => p.date))].sort();

  const historicalMap = {};
  const forecastMap = {};

  chartPoints.forEach((p) => {
    if (p.series === "Historical") historicalMap[p.date] = p.quantity;
    if (p.series === "Forecast") forecastMap[p.date] = p.quantity;
  });

  const historicalData = allDates.map((d) =>
    historicalMap[d] !== undefined ? historicalMap[d] : null
  );

  const forecastData = allDates.map((d) =>
    forecastMap[d] !== undefined ? forecastMap[d] : null
  );

  const data = {
    labels: allDates,
    datasets: [
      {
        label: "Historical Demand",
        data: historicalData,
        borderColor: "#2f855a",
        backgroundColor: "#2f855a",
        tension: 0.3,
        spanGaps: true,
      },
      {
        label: "Forecast",
        data: forecastData,
        borderColor: "#2563eb",
        backgroundColor: "#2563eb",
        borderDash: [6, 6],
        tension: 0.3,
        spanGaps: true,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Demand History vs Forecast",
      },
    },
  };

  return <Line data={data} options={options} />;
}