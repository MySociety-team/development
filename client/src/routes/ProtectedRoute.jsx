import { Navigate, Outlet, useLocation } from "react-router";

import LoadingSpinner from "../components/common/LoadingSpinner.jsx";
import { useAuth } from "../modules/auth/hooks/useAuth.js";

function ProtectedRoute() {
  const { loading, isAuthenticated } = useAuth();

  const location = useLocation();

  if (loading) {
    return <LoadingSpinner fullScreen={true} />;
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname
        }}
      />
    );
  }

  return <Outlet />;
}

export default ProtectedRoute;
