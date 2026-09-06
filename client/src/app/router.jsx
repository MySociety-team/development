import { createBrowserRouter, Navigate } from "react-router";

import RootRoute from "../components/common/RootRoute.jsx";

import LoginPage from "../modules/auth/pages/LoginPage.jsx";
import RegisterPage from "../modules/auth/pages/RegisterPage.jsx";

import CreateSocietyPage from "../modules/societies/pages/CreateSocietyPage.jsx";
import JoinSocietyPage from "../modules/societies/pages/JoinSocietyPage.jsx";
import SocietiesPage from "../modules/societies/pages/SocietiesPage.jsx";
import SocietyDashboardPage from "../modules/societies/pages/SocietyDashboardPage.jsx";
import SocietyMembersPage from "../modules/societies/pages/SocietyMembersPage.jsx";

import ContactsPage from "../modules/contacts/pages/ContactsPage.jsx";
import CreateContactPage from "../modules/contacts/pages/CreateContactPage.jsx";

import ComplaintsPage from "../modules/complaints/pages/ComplaintsPage.jsx";

import SubscriptionPage from "../modules/subscriptions/pages/SubscriptionPage.jsx";

import MeetingsPage from "../modules/meetings/pages/MeetingsPage.jsx";
import CreateMeetingPage from "../modules/meetings/pages/CreateMeetingPage.jsx";
import MeetingDetailsPage from "../modules/meetings/pages/MeetingDetailsPage.jsx";
import EditMeetingPage from "../modules/meetings/pages/EditMeetingPage.jsx";
import MeetingAttendancePage from "../modules/meetings/pages/MeetingAttendancePage.jsx";

import AnnouncementsPage from "../modules/announcements/pages/AnnouncementsPage.jsx";
import CreateAnnouncementPage from "../modules/announcements/pages/CreateAnnouncementPage.jsx";
import AnnouncementDetailsPage from "../modules/announcements/pages/AnnouncementDetailsPage.jsx";
import EditAnnouncementPage from "../modules/announcements/pages/EditAnnouncementPage.jsx";

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
          },

          {
            path: "/societies/:societyId/contacts",
            element: <ContactsPage />
          },

          {
            path: "/societies/:societyId/contacts/create",
            element: <CreateContactPage />
          },

          {
            path: "/societies/:societyId/meetings",
            element: <MeetingsPage />
          },

          {
            path: "/societies/:societyId/meetings/create",
            element: <CreateMeetingPage />
          },

          {
            path: "/societies/:societyId/meetings/:meetingId",
            element: <MeetingDetailsPage />
          },

          {
            path: "/societies/:societyId/meetings/:meetingId/edit",
            element: <EditMeetingPage />
          },

          {
            path: "/societies/:societyId/meetings/:meetingId/attendance",
            element: <MeetingAttendancePage />
          },

          {
            path: "/societies/:societyId/complaints",
            element: <ComplaintsPage />
          },

          {
            path: "/societies/:societyId/announcements",
            element: <AnnouncementsPage />
          },

          {
            path: "/societies/:societyId/announcements/create",
            element: <CreateAnnouncementPage />
          },

          {
            path: "/societies/:societyId/announcements/:announcementId",
            element: <AnnouncementDetailsPage />
          },

          {
            path: "/societies/:societyId/announcements/:announcementId/edit",
            element: <EditAnnouncementPage />
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
