import NotificationBell from "./NotificationBell.jsx";

function SocietyNotificationBadge({ societyId }) {
  return <NotificationBell societyId={societyId} size="sm" />;
}

export default SocietyNotificationBadge;
