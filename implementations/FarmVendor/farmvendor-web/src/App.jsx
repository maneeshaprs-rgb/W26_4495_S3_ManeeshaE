import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import FarmerDashboard from "./pages/FarmerDashboard";
import VendorDashboard from "./pages/VendorDashboard";

import RequireAuth from "./routes/RequireAuth";
import RequireRole from "./routes/RequireRole";

import FarmerProducts from "./pages/FarmerProducts";
import FarmerRequests from "./pages/FarmerRequests";
import FarmerDispatch from "./pages/FarmerDispatch";

//vendor functionalities
import VendorStock from "./pages/VendorStock";
import VendorRequests from "./pages/VendorRequests";
import VendorIncoming from "./pages/VendorIncoming";

//analytics
import FarmerAnalytics from "./pages/FarmerAnalytics";
import VendorAnalytics from "./pages/VendorAnalytics";
//analytics ===Machine Learning model: ML.NET SSA forecasting
import FarmerForecast from "./pages/FarmerForecast";
import VendorForecast from "./pages/VendorForecast";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Any logged-in user */}
        <Route element={<RequireAuth />}>
          {/* Farmer-only */}
          <Route element={<RequireRole role="Farmer" />}>
            <Route path="/farmer" element={<FarmerDashboard />} />
            <Route path="/farmer/products" element={<FarmerProducts />} />
            <Route path="/farmer/requests" element={<FarmerRequests />} />
            <Route path="/farmer/dispatch" element={<FarmerDispatch />} />
            <Route path="/farmer/analytics" element={<FarmerAnalytics />} />
            <Route path="/farmer/forecasts" element={<FarmerForecast />} />

          </Route>

          {/* Vendor-only */}
          <Route element={<RequireRole role="Vendor" />}>
            <Route path="/vendor" element={<VendorDashboard />} />
            <Route path="/vendor/stock" element={<VendorStock />} />
            <Route path="/vendor/requests" element={<VendorRequests />} />
            <Route path="/vendor/incoming" element={<VendorIncoming />} />
            <Route path="/vendor/analytics" element={<VendorAnalytics />} />
            <Route path="/vendor/forecasts" element={<VendorForecast />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
