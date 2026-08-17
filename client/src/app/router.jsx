import { createBrowserRouter, Navigate } from "react-router";

import RootRoute from "../components/common/RootRoute.jsx";
import LoginPage from "../modules/auth/pages/LoginPage.jsx";
import RegisterPage from "../modules/auth/pages/RegisterPage.jsx";
import CreateSocietyPage from "../modules/societies/pages/CreateSocietyPage.jsx";
import JoinSocietyPage from "../modules/societies/pages/JoinSocietyPage.jsx";
import SocietiesPage from "../modules/societies/pages/SocietiesPage.jsx";
import SocietyDashboardPage from "../modules/societies/pages/SocietyDashboardPage.jsx";
import SocietyMembersPage from "../modules/societies/pages/SocietyMembersPage.jsx";
import SubscriptionPage from "../modules/subscriptions/pages/SubscriptionPage.jsx";
import NotFoundPage from "../pages/NotFoundPage.jsx";
import RouteErrorPage from "../pages/RouteErrorPage.jsx";
import ProtectedRoute from "../routes/ProtectedRoute.jsx";
import PublicOnlyRoute from "../routes/PublicOnlyRoute.jsx";

const router = createBrowserRouter([
  {
    element: <RootRoute />,
    errorElement: <RouteErrorPage />,
    children: [
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
          },
          {
            path: "/societies/join",
            element: <JoinSocietyPage />
          },
          {
            path: "/societies/create",
            element: <CreateSocietyPage />
          },
          {
            path: "/subscription",
            element: <SubscriptionPage />
          },
          {
            path: "/societies/:societyId/dashboard",
            element: <SocietyDashboardPage />
          },
          {
            path: "/societies/:societyId/members",
            element: <SocietyMembersPage />
          }
        ]
      },

      {
        path: "*",
        element: <NotFoundPage />
      }
    ]
  }
]);

export default router;
