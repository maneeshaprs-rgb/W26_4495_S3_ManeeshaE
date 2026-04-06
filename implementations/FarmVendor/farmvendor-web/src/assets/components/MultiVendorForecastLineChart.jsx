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

const COLORS = ["#2563eb", "#16a34a", "#dc2626", "#ca8a04"];

export default function MultiVendorForecastLineChart({ chartRows = [], vendorNames = [] }) {
  if (!chartRows || chartRows.length === 0) {
    return <div>No multi-vendor chart data available.</div>;
  }

  const labels = chartRows.map((r) => r.date);

  const datasets = vendorNames.map((vendorName, index) => ({
    label: vendorName,
    data: chartRows.map((row) =>
      row[vendorName] !== undefined ? row[vendorName] : null
    ),
    borderColor: COLORS[index % COLORS.length],
    backgroundColor: COLORS[index % COLORS.length],
    tension: 0.3,
    spanGaps: true,
  }));

  const data = {
    labels,
    datasets,
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Forecast Comparison for Selected Vendors",
      },
    },
  };

  return <Line data={data} options={options} />;
}