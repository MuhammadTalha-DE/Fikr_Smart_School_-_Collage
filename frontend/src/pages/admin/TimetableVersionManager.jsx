import { useEffect, useMemo, useState } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiDownload, FiGitBranch, FiRotateCcw, FiUpload } from 'react-icons/fi';

const TimetableVersionManager = () => {
  const [timetables, setTimetables] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedTimetable, setSelectedTimetable] = useState('');
  const [versions, setVersions] = useState([]);
  const [leftVersion, setLeftVersion] = useState('');
  const [rightVersion, setRightVersion] = useState('');
  const [comparison, setComparison] = useState(null);
  const [templateText, setTemplateText] = useState('');
  const [importTarget, setImportTarget] = useState({
    classId: '',
    term: '',
    academicYear: '',
    scheduleType: 'regular',
  });
  const [loading, setLoading] = useState(false);

  const selected = useMemo(
    () => timetables.find((item) => item._id === selectedTimetable),
    [timetables, selectedTimetable]
  );

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedTimetable) fetchVersions(selectedTimetable);
  }, [selectedTimetable]);

  const fetchInitialData = async () => {
    const [ttRes, classRes] = await Promise.all([
      api.get('/timetables'),
      api.get('/classes'),
    ]);
    setTimetables(ttRes.data || []);
    setClasses(classRes.data || []);
  };

  const fetchVersions = async (timetableId) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/timetables/versions/${timetableId}`);
      setVersions(data || []);
      setLeftVersion(data?.[1]?._id || data?.[0]?._id || '');
      setRightVersion(data?.[0]?._id || '');
      setComparison(null);
      setImportTarget({
        classId: selected?.classId?._id || selected?.classId || '',
        term: selected?.term || '',
        academicYear: selected?.academicYear || '',
        scheduleType: selected?.scheduleType || 'regular',
      });
    } catch (error) {
      toast.error(error.userMessage || 'Failed to load versions');
    } finally {
      setLoading(false);
    }
  };

  const compareVersions = async () => {
    if (!leftVersion || !rightVersion) return toast.error('Select two versions');
    const { data } = await api.get(`/timetables/versions/${leftVersion}/compare/${rightVersion}`);
    setComparison(data);
  };

  const rollback = async (versionId) => {
    await api.post(`/timetables/versions/${versionId}/rollback`);
    toast.success('Timetable rolled back');
    fetchInitialData();
    if (selectedTimetable) fetchVersions(selectedTimetable);
  };

  const exportTemplate = async () => {
    if (!selectedTimetable) return toast.error('Select a timetable');
    const { data } = await api.get(`/timetables/templates/${selectedTimetable}/export`);
    setTemplateText(JSON.stringify(data, null, 2));
    toast.success('Template loaded below');
  };

  const importTemplate = async () => {
    if (!templateText.trim()) return toast.error('Paste a template JSON first');
    const template = JSON.parse(templateText);
    await api.post('/timetables/templates/import', {
      template,
      ...importTarget,
    });
    toast.success('Template imported');
    fetchInitialData();
  };

  const renderChangeList = (title, items, emptyText) => (
    <div className="border rounded p-3 bg-white">
      <h3 className="font-semibold text-slate-800 mb-2">{title}</h3>
      {items?.length ? (
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="text-sm text-slate-700 border-b last:border-b-0 pb-2 last:pb-0">
              {item.before && item.after ? (
                <span>{item.before.day} P{item.before.period}: {item.before.subject} to {item.after.subject}</span>
              ) : (
                <span>{item.day} P{item.period}: {item.subject}</span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500">{emptyText}</p>
      )}
    </div>
  );

  return (
    <Layout role="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Timetable Versions</h1>
          <p className="text-sm text-slate-500 mt-1">Compare, rollback, export, and import timetable templates.</p>
        </div>

        <div className="bg-white border rounded p-4">
          <label className="block text-sm font-medium mb-1">Timetable</label>
          <select
            value={selectedTimetable}
            onChange={(e) => setSelectedTimetable(e.target.value)}
            className="input-field max-w-xl"
          >
            <option value="">Select timetable</option>
            {timetables.map((tt) => (
              <option key={tt._id} value={tt._id}>
                {tt.classId?.name} - {tt.term} - {tt.academicYear} - {tt.scheduleType}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white border rounded p-4">
            <div className="flex items-center gap-2 mb-4">
              <FiGitBranch />
              <h2 className="font-semibold text-slate-900">Version Comparison</h2>
            </div>
            {loading ? <p>Loading...</p> : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <select value={leftVersion} onChange={(e) => setLeftVersion(e.target.value)} className="input-field">
                    <option value="">From version</option>
                    {versions.map((version) => (
                      <option key={version._id} value={version._id}>v{version.version}</option>
                    ))}
                  </select>
                  <select value={rightVersion} onChange={(e) => setRightVersion(e.target.value)} className="input-field">
                    <option value="">To version</option>
                    {versions.map((version) => (
                      <option key={version._id} value={version._id}>v{version.version}</option>
                    ))}
                  </select>
                </div>
                <button onClick={compareVersions} className="btn-primary mb-4">Compare</button>

                {comparison && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                    {renderChangeList('Added', comparison.added, 'No added slots')}
                    {renderChangeList('Removed', comparison.removed, 'No removed slots')}
                    {renderChangeList('Changed', comparison.changed, 'No changed slots')}
                  </div>
                )}

                <div className="mt-5 space-y-2">
                  {versions.map((version) => (
                    <div key={version._id} className="flex items-center justify-between border rounded p-3">
                      <span className="text-sm">Version {version.version} - {new Date(version.createdAt).toLocaleString()}</span>
                      <button onClick={() => rollback(version._id)} className="inline-flex items-center gap-1 text-sm text-blue-700">
                        <FiRotateCcw /> Rollback
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="bg-white border rounded p-4">
            <div className="flex items-center gap-2 mb-4">
              <FiDownload />
              <h2 className="font-semibold text-slate-900">Template Import/Export</h2>
            </div>
            <button onClick={exportTemplate} className="btn-secondary inline-flex items-center gap-2 mb-3">
              <FiDownload /> Export Selected
            </button>
            <textarea
              value={templateText}
              onChange={(e) => setTemplateText(e.target.value)}
              rows={12}
              className="input-field font-mono text-xs"
              placeholder="Exported template JSON or paste a template here"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <select value={importTarget.classId} onChange={(e) => setImportTarget({ ...importTarget, classId: e.target.value })} className="input-field">
                <option value="">Target class</option>
                {classes.map((cls) => <option key={cls._id} value={cls._id}>{cls.name}</option>)}
              </select>
              <input value={importTarget.academicYear} onChange={(e) => setImportTarget({ ...importTarget, academicYear: e.target.value })} className="input-field" placeholder="Academic year" />
              <select value={importTarget.term} onChange={(e) => setImportTarget({ ...importTarget, term: e.target.value })} className="input-field">
                <option value="">Term</option>
                <option>First Term</option>
                <option>Second Term</option>
                <option>Final Term</option>
              </select>
              <select value={importTarget.scheduleType} onChange={(e) => setImportTarget({ ...importTarget, scheduleType: e.target.value })} className="input-field">
                <option value="regular">Regular</option>
                <option value="ramadan">Ramadan</option>
                <option value="exam">Exam</option>
                <option value="half-day">Half-day</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <button onClick={importTemplate} className="btn-primary inline-flex items-center gap-2 mt-3">
              <FiUpload /> Import Template
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TimetableVersionManager;
