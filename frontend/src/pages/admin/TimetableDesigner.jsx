import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  FiSave, FiCopy, FiAlertTriangle, FiTrash2, FiEdit2,
  FiPlus, FiX, FiClock, FiDownload, FiUpload
} from 'react-icons/fi';
import Select from 'react-select';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { Draggable } from '../../components/dnd/Draggable';
import { Droppable } from '../../components/dnd/Droppable';
import SubjectTray from '../../components/dnd/SubjectTray';
import useSchoolPeriods from '../../hooks/useSchoolPeriods';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TimetableDesigner = () => {
  // ── Master data ──
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // ── Selection ──
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('First Term');
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [scheduleType, setScheduleType] = useState('regular');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');

  // ── Timetable state ──
  const [timetable, setTimetable] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(false);
  const { periods } = useSchoolPeriods();

  // ── Cell editing ──
  const [editingCell, setEditingCell] = useState(null);
  const [slotForm, setSlotForm] = useState({ subject: '', teacherId: '', roomId: '' });

  // ── Copy from class ──
  const [copySource, setCopySource] = useState('');

  // ── DnD sensors ──
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // ── Initial data fetch ──
  useEffect(() => { fetchClasses(); fetchTeachers(); fetchRooms(); fetchSubjects(); }, []);
  useEffect(() => { if (selectedClass) loadTimetable(); }, [selectedClass, selectedTerm, academicYear, scheduleType]);

  const fetchClasses = async () => {
    try {
      const { data } = await api.get('/classes');
      setClasses(data);
      if (data.length > 0) setSelectedClass(data[0]._id);
    } catch { toast.error('Failed to load classes'); }
  };

  const fetchTeachers = async () => {
    try {
      const { data } = await api.get('/teachers');
      setTeachers(data);
    } catch { toast.error('Failed to load teachers'); }
  };

  const fetchRooms = async () => {
    try {
      const { data } = await api.get('/rooms');
      setRooms(data);
    } catch { toast.error('Failed to load rooms'); }
  };

  const fetchSubjects = async () => {
    try {
      const { data } = await api.get('/subjects');
      setSubjects(data.subjects || []);
    } catch { toast.error('Failed to load subjects'); }
  };

  const loadTimetable = async () => {
    if (!selectedClass) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/timetables/${selectedClass}`, {
        params: { term: selectedTerm, academicYear, scheduleType },
      });
      setTimetable(data || { slots: [], status: 'draft' });
      setValidFrom(data?.validFrom ? data.validFrom.slice(0, 10) : '');
      setValidUntil(data?.validUntil ? data.validUntil.slice(0, 10) : '');
      if (data?._id) {
        const { data: conflictData } = await api.get(`/timetables/${data._id}/conflicts`);
        setConflicts(conflictData);
      } else setConflicts([]);
    } catch {
      toast.error('Failed to load timetable');
      setTimetable(null);
      setConflicts([]);
    } finally { setLoading(false); }
  };

  const refreshConflicts = async () => {
    if (!timetable?._id) return;
    try {
      const { data } = await api.get(`/timetables/${timetable._id}/conflicts`);
      setConflicts(data);
    } catch { toast.error('Failed to refresh conflicts'); }
  };

  // ── Slot edit modal ──
  const openEditModal = (day, period, existingSlot = null) => {
    setEditingCell({ day, period });
    if (existingSlot) {
      setSlotForm({
        subject: existingSlot.subject || '',
        teacherId: existingSlot.teacherId?._id || existingSlot.teacherId || '',
        roomId: existingSlot.roomId?._id || existingSlot.roomId || '',
      });
    } else {
      setSlotForm({ subject: '', teacherId: '', roomId: '' });
    }
  };

  const handleSaveSlot = async () => {
    if (!slotForm.subject || !slotForm.teacherId) return toast.error('Subject and teacher are required');
    try {
      const { data: conflictCheck } = await api.post('/timetables/check-conflict', {
        teacherId: slotForm.teacherId,
        classId: selectedClass,
        roomId: slotForm.roomId || null,
        day: editingCell.day,
        period: editingCell.period,
        scheduleType,
        term: selectedTerm,
        academicYear,
        excludeTimetableId: timetable?._id,
      });
      if (conflictCheck.conflict) return toast.error(conflictCheck.detail);
    } catch { /* continue without conflict check if endpoint missing */ }

    const existing = timetable?.slots?.find(s => s.day === editingCell.day && s.period === editingCell.period);
    let newSlots = [...(timetable?.slots || [])];
    if (existing) {
      newSlots = newSlots.map(s =>
        s.day === editingCell.day && s.period === editingCell.period ? { ...s, ...slotForm } : s
      );
    } else {
      newSlots.push({ day: editingCell.day, period: editingCell.period, ...slotForm });
    }

    try {
      const { data } = await api.post('/timetables', {
        classId: selectedClass, term: selectedTerm, academicYear, scheduleType, validFrom, validUntil, slots: newSlots,
      });
      setTimetable(data);
      setEditingCell(null);
      refreshConflicts();
      toast.success('Slot saved');
    } catch { toast.error('Failed to save slot'); }
  };

  const handleDeleteSlot = async () => {
    const newSlots = timetable.slots.filter(s => !(s.day === editingCell.day && s.period === editingCell.period));
    try {
      const { data } = await api.post('/timetables', {
        classId: selectedClass, term: selectedTerm, academicYear, scheduleType, validFrom, validUntil, slots: newSlots,
      });
      setTimetable(data);
      setEditingCell(null);
      refreshConflicts();
      toast.success('Slot deleted');
    } catch { toast.error('Failed to delete slot'); }
  };

  // ── NEW: Save entire timetable (without opening modal) ──
  const handleSaveFullTimetable = async () => {
    if (!timetable?.slots) return toast.error('No timetable loaded');
    try {
      const { data } = await api.post('/timetables', {
        classId: selectedClass,
        term: selectedTerm,
        academicYear,
        scheduleType,
        validFrom,
        validUntil,
        slots: timetable.slots,
      });
      setTimetable(data);
      toast.success('Timetable saved');
      refreshConflicts();
    } catch { toast.error('Save failed'); }
  };

  // ── NEW: Delete entire timetable ──
  const handleDeleteTimetable = async () => {
    if (!timetable?._id) return toast.error('No timetable to delete');
    if (!window.confirm(`Permanently delete the timetable for ${selectedTerm} ${academicYear}?`)) return;
    try {
      await api.delete(`/timetables/${timetable._id}`);
      toast.success('Timetable deleted');
      setTimetable({ slots: [], status: 'draft' });  // reset placeholder
      setConflicts([]);
    } catch { toast.error('Deletion failed'); }
  };

  // ── NEW: Clear all slots (create empty draft) ──
  const handleClearSlots = async () => {
    if (!window.confirm('Remove all slots from this timetable?')) return;
    try {
      const { data } = await api.post('/timetables', {
        classId: selectedClass, term: selectedTerm, academicYear, scheduleType, validFrom, validUntil, slots: [],
      });
      setTimetable(data);
      setConflicts([]);
      toast.success('All slots cleared');
    } catch { toast.error('Failed to clear slots'); }
  };

  const handleStatusChange = async (newStatus) => {
    if (!timetable?._id) return toast.error('Save a timetable first');
    try {
      await api.put(`/timetables/${timetable._id}/status`, { status: newStatus });
      setTimetable(prev => ({ ...prev, status: newStatus }));
      toast.success(`Timetable ${newStatus}`);
    } catch { toast.error('Status change failed'); }
  };

  const handleCopyFromClass = async () => {
    if (!copySource) return;
    try {
      await api.post('/timetables/copy', {
        sourceClassId: copySource, targetClassId: selectedClass, term: selectedTerm, academicYear, scheduleType,
      });
      toast.success('Timetable copied');
      loadTimetable();
    } catch { toast.error('Copy failed'); }
  };

  // ── Drag‑and‑drop handler ──
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (activeData?.type === 'subject' && overData?.type === 'cell') {
      const { subject } = activeData;
      const { day, period } = overData;
      if (timetable?.slots?.some(s => s.day === day && s.period === period)) {
        return toast.error('Slot already occupied');
      }
      openEditModal(day, period);
      setSlotForm(prev => ({ ...prev, subject }));
      return;
    }

    if (activeData?.type === 'slot' && overData?.type === 'cell') {
      const { sourceDay, sourcePeriod } = activeData;
      const { day: targetDay, period: targetPeriod } = overData;
      if (sourceDay === targetDay && sourcePeriod === targetPeriod) return;

      const sourceSlot = timetable?.slots?.find(s => s.day === sourceDay && s.period === sourcePeriod);
      if (!sourceSlot) return;

      if (timetable?.slots?.some(s => s.day === targetDay && s.period === targetPeriod)) {
        return toast.error('Target slot already occupied');
      }

      const newSlots = timetable.slots.map(s => {
        if (s.day === sourceDay && s.period === sourcePeriod) {
          return { ...s, day: targetDay, period: targetPeriod };
        }
        return s;
      });

      try {
        const { data } = await api.post('/timetables', {
          classId: selectedClass, term: selectedTerm, academicYear, scheduleType, validFrom, validUntil, slots: newSlots,
        });
        setTimetable(data);
        refreshConflicts();
        toast.success('Slot moved');
      } catch { toast.error('Failed to move slot'); }
    }
  };

  // ── Lookup options ──
  const classOptions = classes.map(c => ({ value: c._id, label: c.name }));
  const teacherOptions = teachers.map(t => ({ value: t._id, label: t.userId?.name || 'Unnamed' }));
  const roomOptions = rooms.map(r => ({ value: r._id, label: r.name }));

  return (
    <Layout role="admin">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FiClock className="text-pink-500" /> Timetable Designer
          </h1>
          <div className="flex items-center gap-3">
            {timetable?._id && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-600">Status:</span>
                  <select
                    value={timetable.status || 'draft'}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="input-field w-28 text-sm"
                  >
                    <option value="draft">📄 Draft</option>
                    <option value="published">✅ Published</option>
                    <option value="archived">📦 Archived</option>
                  </select>
                </div>
                {/* NEW: Save full timetable button */}
                <button
                  onClick={handleSaveFullTimetable}
                  className="btn-secondary flex items-center gap-1 text-sm"
                >
                  <FiSave /> Save
                </button>

                <button
  onClick={async () => {
    if (!window.confirm('⚠️ Delete ALL timetables for the entire school? This cannot be undone!')) return;
    try {
      await api.delete('/timetables/clear-all');
      toast.success('All timetables cleared');
      setTimetable({ slots: [], status: 'draft' });
      setConflicts([]);
    } catch { toast.error('Failed to clear all timetables'); }
  }}
  className="btn-secondary text-red-600 flex items-center gap-1 text-sm"
>
  <FiTrash2 /> Clear All
</button>
                {/* NEW: Clear all slots button */}
                <button
                  onClick={handleClearSlots}
                  className="btn-secondary flex items-center gap-1 text-sm"
                >
                  <FiTrash2 /> Clear
                </button>
                {/* NEW: Delete entire timetable button */}
                <button
                  onClick={handleDeleteTimetable}
                  className="btn-secondary flex items-center gap-1 text-sm text-red-600"
                >
                  <FiTrash2 /> Delete
                </button>
              </>
            )}
            <Link to="/admin/timetable-conflicts" className="btn-secondary flex items-center gap-1 text-sm">
              <FiAlertTriangle /> Conflict Center
            </Link>
          </div>
        </div>

        {/* Selection bar */}
        <div className="card border-pink-100 p-4 mb-4 flex flex-wrap gap-4 items-end">
          <div className="w-56">
            <label className="block text-sm font-medium text-slate-700 mb-1">Class</label>
            <Select options={classOptions} value={classOptions.find(c => c.value === selectedClass) || null}
              onChange={(opt) => setSelectedClass(opt?.value || '')} placeholder="Select class..." className="basic-select" classNamePrefix="select" />
          </div>
          <div className="w-44">
            <label className="block text-sm font-medium text-slate-700 mb-1">Term</label>
            <select value={selectedTerm} onChange={e => setSelectedTerm(e.target.value)} className="input-field">
              <option>First Term</option><option>Second Term</option><option>Final Term</option>
            </select>
          </div>
          <div className="w-32">
            <label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
            <input type="text" value={academicYear} onChange={e => setAcademicYear(e.target.value)} className="input-field" placeholder="2025-2026" />
          </div>
          <div className="w-40">
            <label className="block text-sm font-medium text-slate-700 mb-1">Schedule</label>
            <select value={scheduleType} onChange={e => setScheduleType(e.target.value)} className="input-field">
              <option value="regular">Regular</option>
              <option value="ramadan">Ramadan</option>
              <option value="exam">Exam</option>
              <option value="half-day">Half Day</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div className="w-36">
            <label className="block text-sm font-medium text-slate-700 mb-1">Valid From</label>
            <input type="date" value={validFrom} onChange={e => setValidFrom(e.target.value)} className="input-field" />
          </div>
          <div className="w-36">
            <label className="block text-sm font-medium text-slate-700 mb-1">Valid Until</label>
            <input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} className="input-field" />
          </div>
          <button onClick={loadTimetable} className="btn-primary bg-pink-500 hover:bg-pink-600 text-white" disabled={!selectedClass}>Load</button>
          <div className="flex items-center gap-2 ml-auto">
            <Select options={classOptions.filter(c => c.value !== selectedClass)}
              value={classOptions.find(c => c.value === copySource) || null}
              onChange={(opt) => setCopySource(opt?.value || '')} placeholder="Copy from..." className="w-48 basic-select" classNamePrefix="select" isClearable />
            <button onClick={handleCopyFromClass} disabled={!copySource} className="btn-secondary flex items-center gap-1"><FiCopy /> Copy</button>
          </div>
        </div>

        {/* Main area: tray + grid */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="w-full lg:w-48 shrink-0">
            <SubjectTray subjects={subjects} />
          </div>

          <div className="flex-1 bg-white rounded-xl shadow-sm border border-pink-100 overflow-x-auto">
            {loading && <div className="text-center py-8 text-slate-500">Loading timetable...</div>}
            {!loading && !selectedClass && (
              <div className="text-center py-12 text-slate-500">Select a class and click "Load" to start designing.</div>
            )}
            {!loading && selectedClass && (
              <>
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="bg-pink-50">
                      <th className="border border-pink-100 p-2 font-medium text-sm text-slate-700">Day / Period</th>
                      {periods.map(p => <th key={p} className="border border-pink-100 p-2 font-medium text-sm text-slate-700">Period {p}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {days.map(day => (
                      <tr key={day}>
                        <td className="border border-pink-100 p-2 font-medium bg-pink-50/50 text-sm text-slate-700">{day}</td>
                        {periods.map(period => {
                          const slot = timetable?.slots?.find(s => s.day === day && s.period === period);
                          const isConflict = conflicts.some(c => c.day === day && c.period === period);
                          return (
                            <td key={period} className="border border-pink-100 p-0 w-[120px] h-[70px]">
                              <Droppable id={`${day}-${period}`} data={{ type: 'cell', day, period }}>
                                {slot ? (
                                  <Draggable id={`slot-${day}-${period}`} data={{ type: 'slot', sourceDay: day, sourcePeriod: period }}>
                                    <div
                                      className={`p-2 h-full cursor-pointer hover:bg-blue-50 transition-colors ${isConflict ? 'bg-red-100 border-2 border-red-500' : ''}`}
                                      onDoubleClick={() => openEditModal(day, period, slot)}
                                    >
                                      <div className="font-medium text-sm text-slate-800">{slot.subject}</div>
                                      <div className="text-xs text-slate-500 truncate">{slot.teacherId?.userId?.name || 'Teacher'}</div>
                                      {slot.roomId?.name && <div className="text-xs text-slate-400 truncate">{slot.roomId.name}</div>}
                                    </div>
                                  </Draggable>
                                ) : (
                                  <div className="p-2 h-full flex items-center justify-center text-slate-300 text-xs">
                                    Empty
                                  </div>
                                )}
                              </Droppable>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {conflicts.length > 0 && (
                  <div className="p-3 bg-red-100 text-red-800 text-sm mt-2 rounded-b-xl flex items-center gap-2">
                    <FiAlertTriangle />
                    <span>{conflicts.length} conflict(s). <Link to="/admin/timetable-conflicts" className="underline">Resolve them</Link></span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Slot Edit Modal */}
        {editingCell && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-slate-900">{editingCell.day} · Period {editingCell.period}</h3>
                <button onClick={() => setEditingCell(null)} className="text-slate-500 hover:text-slate-700"><FiX className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Subject *</label>
                  <Select
                    options={subjects.map(s => ({ value: s.name, label: `${s.code} - ${s.name}` }))}
                    value={
                      subjects
                        .map(s => ({ value: s.name, label: `${s.code} - ${s.name}` }))
                        .find(s => s.value === slotForm.subject) || null
                    }
                    onChange={(opt) => setSlotForm({ ...slotForm, subject: opt?.value || '' })}
                    placeholder="Select or type..."
                    isClearable
                    className="basic-select"
                    classNamePrefix="select"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Teacher *</label>
                  <Select options={teacherOptions}
                    value={teacherOptions.find(t => t.value === slotForm.teacherId) || null}
                    onChange={(opt) => setSlotForm({ ...slotForm, teacherId: opt?.value || '' })}
                    placeholder="Select teacher..." className="basic-select" classNamePrefix="select" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Room (optional)</label>
                  <Select options={roomOptions}
                    value={roomOptions.find(r => r.value === slotForm.roomId) || null}
                    onChange={(opt) => setSlotForm({ ...slotForm, roomId: opt?.value || '' })}
                    placeholder="Select room..." isClearable className="basic-select" classNamePrefix="select" />
                </div>
              </div>
              <div className="flex justify-between mt-6">
                <button onClick={handleDeleteSlot} className="text-red-600 hover:text-red-800 flex items-center gap-1"><FiTrash2 /> Delete</button>
                <div className="flex gap-2">
                  <button onClick={() => setEditingCell(null)} className="btn-secondary">Cancel</button>
                  <button onClick={handleSaveSlot} className="btn-primary bg-pink-500 hover:bg-pink-600 text-white flex items-center gap-1"><FiSave /> Save</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DndContext>
    </Layout>
  );
};

export default TimetableDesigner;
