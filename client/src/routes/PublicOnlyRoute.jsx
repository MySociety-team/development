import { Navigate, Outlet } from "react-router";

import LoadingSpinner from "../components/common/LoadingSpinner.jsx";
import { useAuth } from "../modules/auth/hooks/useAuth.js";

function PublicOnlyRoute() {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen={true} />;
  }

  if (isAuthenticated) {
    return <Navigate to="/societies" replace />;
  }

  return <Outlet />;
}

export default PublicOnlyRoute;
