import { useEffect, useState } from "react";
import { useParams } from "react-router";

import AppShell from "../../../components/common/AppShell.jsx";
import { getApiErrorMessage } from "../../../lib/apiError.js";
import { getSocietyMembers } from "../../societies/api/society.api.js";
import { getMeeting, updateMeetingAttendance } from "../api/meeting.api.js";

function MeetingAttendancePage() {
  const { societyId, meetingId } = useParams();

  const [meeting, setMeeting] = useState(null);
  const [members, setMembers] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        const [meetingData, membersData] = await Promise.all([
          getMeeting(societyId, meetingId),
          getSocietyMembers(societyId)
        ]);

        const existingAttendance = {};

        meetingData.attendance?.forEach((record) => {
          existingAttendance[record.societyMemberId] = record.status;
        });

        const initialAttendance = {};

        membersData.forEach((member) => {
          const memberId = member.id || member._id || member.membershipId;

          initialAttendance[memberId] = existingAttendance[memberId] || "ABSENT";
        });

        if (!cancelled) {
          setMeeting(meetingData);
          setMembers(membersData);
          setAttendance(initialAttendance);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(getApiErrorMessage(error, "Unable to load attendance."));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [societyId, meetingId]);

  const getMemberId = (member) => member.id || member._id || member.membershipId;

  const getMemberName = (member) => {
    if (member.user?.name) {
      return member.user.name;
    }

    if (member.name) {
      return member.name;
    }

    if (member.user?.email) {
      return member.user.email;
    }

    return "Society member";
  };

  const handleStatusChange = (memberId, status) => {
    setAttendance((current) => ({
      ...current,
      [memberId]: status
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setErrorMessage("");

      const attendancePayload = members.map((member) => {
        const memberId = getMemberId(member);

        return {
          societyMemberId: memberId,
          status: attendance[memberId] || "ABSENT"
        };
      });

      const updatedMeeting = await updateMeetingAttendance(societyId, meetingId, attendancePayload);

      setMeeting(updatedMeeting);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Unable to save attendance."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppShell title="Meeting attendance" backTo={`/societies/${societyId}/meetings/${meetingId}`}>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading attendance...
        </div>
      </AppShell>
    );
  }

  if (!meeting) {
    return (
      <AppShell title="Meeting attendance" backTo={`/societies/${societyId}/meetings`}>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {errorMessage || "Meeting could not be loaded."}
        </div>
      </AppShell>
    );
  }

  if (meeting.status !== "COMPLETED") {
    return (
      <AppShell title="Meeting attendance" backTo={`/societies/${societyId}/meetings/${meetingId}`}>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold text-slate-950">Meeting is not completed</h2>

          <p className="mt-2 text-sm text-slate-500">
            Attendance can only be recorded after the meeting is marked as completed.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Meeting attendance"
      description={`Record attendance for ${meeting.title}.`}
      backTo={`/societies/${societyId}/meetings/${meetingId}`}
    >
      <div className="mx-auto max-w-4xl space-y-6">
        {errorMessage && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              Attendance
            </p>

            <h1 className="mt-2 text-2xl font-bold text-slate-950">{meeting.title}</h1>

            <p className="mt-2 text-sm text-slate-500">
              Mark each society member as present or absent.
            </p>
          </div>

          <div className="mt-6 space-y-3">
            {members.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                No society members found.
              </div>
            ) : (
              members.map((member) => {
                const memberId = getMemberId(member);

                return (
                  <div
                    key={memberId}
                    className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{getMemberName(member)}</p>

                      {member.flat && (
                        <p className="mt-1 text-xs text-slate-500">
                          Flat: {member.flat.wing} {member.flat.flatNumber}
                        </p>
                      )}

                      {member.role && <p className="mt-1 text-xs text-slate-400">{member.role}</p>}
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleStatusChange(memberId, "PRESENT")}
                        className={`rounded-xl px-4 py-2 text-xs font-bold ${
                          attendance[memberId] === "PRESENT"
                            ? "bg-slate-900 text-white"
                            : "border border-slate-300 text-slate-600"
                        }`}
                      >
                        Present
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStatusChange(memberId, "ABSENT")}
                        className={`rounded-xl px-4 py-2 text-xs font-bold ${
                          attendance[memberId] === "ABSENT"
                            ? "bg-slate-200 text-slate-900"
                            : "border border-slate-300 text-slate-600"
                        }`}
                      >
                        Absent
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || members.length === 0}
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save attendance"}
            </button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

export default MeetingAttendancePage;
