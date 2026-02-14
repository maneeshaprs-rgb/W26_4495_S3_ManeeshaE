import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import FarmerDashboard from "./pages/FarmerDashboard";
import VendorDashboard from "./pages/VendorDashboard";

import RequireAuth from "./routes/RequireAuth";
import RequireRole from "./routes/RequireRole";

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
          </Route>

          {/* Vendor-only */}
          <Route element={<RequireRole role="Vendor" />}>
            <Route path="/vendor" element={<VendorDashboard />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
