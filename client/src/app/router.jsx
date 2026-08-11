import { createBrowserRouter, Navigate } from "react-router";

import LoginPage from "../modules/auth/pages/LoginPage.jsx";
import RegisterPage from "../modules/auth/pages/RegisterPage.jsx";
import NotFoundPage from "../pages/NotFoundPage.jsx";
import ProtectedRoute from "../routes/ProtectedRoute.jsx";
import PublicOnlyRoute from "../routes/PublicOnlyRoute.jsx";

// Replace this with the real Societies page
// once that module exists.
import SocietiesPage from "../modules/societies/pages/SocietiesPage.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/societies" replace />
  },

  {
    element: <PublicOnlyRoute />,
    children: [
      {
        path: "/login",
        element: <LoginPage />
      },
      {
        path: "/register",
        element: <RegisterPage />
      }
    ]
  },

  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/societies",
        element: <SocietiesPage />
      }
    ]
  },
  {
    path: "*",
    element: <NotFoundPage />
  }
]);

export default router;
