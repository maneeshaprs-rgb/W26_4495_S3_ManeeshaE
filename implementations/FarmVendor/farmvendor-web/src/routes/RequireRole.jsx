import { Navigate, Outlet } from "react-router-dom";

export default function RequireRole({ role }) {
  const userRole = localStorage.getItem("role"); // "Farmer" or "Vendor"

  if (!userRole) return <Navigate to="/login" replace />;

  if (userRole === role) return <Outlet />;

  // logged in but wrong role -> send to their dashboard
  return <Navigate to={userRole === "Vendor" ? "/vendor" : "/farmer"} replace />;
}
