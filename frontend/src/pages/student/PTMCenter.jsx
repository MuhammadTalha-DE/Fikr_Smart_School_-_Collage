import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { BellRing, CalendarDays, CheckCircle2, Users } from 'lucide-react';
import Layout from '../../components/common/Layout';
import { DashboardCard, DashboardHero, DashboardSectionHeader, DashboardStatCard } from '../../components/common/RoleDashboardUI';
import {
  acknowledgeStudentPTMMeeting,
  getStudentPTMCenter,
  requestStudentPTMReminder,
} from '../../services/studentWorkflowService';

const StudentPTMCenter = () => {
  const [data, setData] = useState(null);
  const [notes, setNotes] = useState({});

  const load = async () => {
    const response = await getStudentPTMCenter();
    setData(response.data?.data || null);
  };

  useEffect(() => { load(); }, []);

  const handleAcknowledge = async (id) => {
    try {
      await acknowledgeStudentPTMMeeting(id, { note: notes[id] || '' });
      toast.success('PTM acknowledged');
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to acknowledge PTM');
    }
  };

  const handleReminder = async (id) => {
    try {
      await requestStudentPTMReminder(id, { note: notes[id] || '' });
      toast.success('Reminder requested');
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to request reminder');
    }
  };

  if (!data) {
    return <Layout role="student"><div className="p-6 text-center text-slate-500">Loading PTM center...</div></Layout>;
  }

  return (
    <Layout role="student">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <DashboardHero
          eyebrow="Student Meetings"
          title="Student PTM Center"
          subtitle="See scheduled PTMs, track whether your parent has responded, and nudge the reminder flow when a meeting still needs attention."
          meta={[
            `${data.summary.total || 0} meetings`,
            `${data.summary.scheduled || 0} scheduled`,
            `${data.summary.pendingParentResponses || 0} awaiting parent response`,
          ]}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard icon={CalendarDays} label="Scheduled" value={data.summary.scheduled || 0} helper="Upcoming PTMs" tone="blue" />
          <DashboardStatCard icon={Users} label="Parent Pending" value={data.summary.pendingParentResponses || 0} helper="Waiting for guardian response" tone="amber" />
          <DashboardStatCard icon={CheckCircle2} label="Acknowledged" value={data.summary.acknowledged || 0} helper="Meetings you have seen" tone="emerald" />
          <DashboardStatCard icon={BellRing} label="Reminder Requests" value={data.summary.remindersRequested || 0} helper="Student-triggered reminder actions" tone="indigo" />
        </div>

        <DashboardCard className="p-5 md:p-6">
          <DashboardSectionHeader icon={CalendarDays} title="Meeting Queue" subtitle="Acknowledge the meeting or request a reminder for home" tone="blue" />
          <div className="space-y-3">
            {(data.items || []).map((item) => (
              <div key={item._id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-black text-slate-950">{item.topic}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Teacher: {item.teacherId?.userId?.name || 'Teacher'} | {item.classId?.name || 'Class'}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {new Date(item.scheduledAt).toLocaleString()} | Parent response: {item.parentResponseStatus}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px] font-bold">
                    <span className={`rounded-full px-3 py-1 ${item.studentAcknowledgedAt ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      {item.studentAcknowledgedAt ? 'Acknowledged' : 'Not yet acknowledged'}
                    </span>
                    <span className={`rounded-full px-3 py-1 ${item.parentResponseStatus === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                      {item.parentResponseStatus}
                    </span>
                  </div>
                </div>
                {item.latestNote?.note ? <p className="mt-2 text-xs text-slate-500">Latest note: {item.latestNote.note}</p> : null}
                <textarea
                  value={notes[item._id] || ''}
                  onChange={(event) => setNotes((current) => ({ ...current, [item._id]: event.target.value }))}
                  rows={2}
                  placeholder="Add a note for your parent or class team"
                  className="mt-3 w-full rounded-2xl border border-slate-200 px-3 py-2 text-xs"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => handleAcknowledge(item._id)} className="rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white">
                    Acknowledge
                  </button>
                  <button type="button" onClick={() => handleReminder(item._id)} className="rounded-2xl bg-amber-500 px-4 py-2 text-xs font-bold text-white">
                    Request Reminder
                  </button>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>
      </div>
    </Layout>
  );
};

export default StudentPTMCenter;
