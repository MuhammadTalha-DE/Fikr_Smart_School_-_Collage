import { useState, useEffect, useMemo } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useDropdownData } from '../../hooks/useDropdownData';
import toast from 'react-hot-toast';
import {
  FiBook, FiBarChart2, FiLayers, FiExternalLink,
  FiSearch, FiX, FiRefreshCw, FiChevronRight
} from 'react-icons/fi';
import { Link } from 'react-router-dom';

const MySubjects = () => {
  const { user } = useAuth();
  const [teacher, setTeacher] = useState(null);
  const [loadingTeacher, setLoadingTeacher] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Detail panel states
  const [syllabusUnits, setSyllabusUnits] = useState([]);
  const [coverage, setCoverage] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [cachedStats, setCachedStats] = useState({}); // subjectId -> { units, coveragePct }

  // Fetch the logged‑in teacher's profile
  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        const { data } = await api.get('/teachers/me');
        setTeacher(data);
      } catch {
        toast.error('Could not load your subjects');
      } finally {
        setLoadingTeacher(false);
      }
    };
    fetchTeacher();
  }, []);

  // Fetch all subjects (for subject details like code, name, credits, etc.) – used as fallback
  const { data: allSubjects } = useDropdownData('/subjects', 'subjects');

  // Build a map subject _id → subject object (for quick lookup if subjects are ObjectIds)
  const subjectMap = useMemo(() => {
    const map = {};
    (allSubjects || []).forEach(s => { map[s._id] = s; });
    return map;
  }, [allSubjects]);

  // Normalise teacher.subjects into an array of subject objects
  const teacherSubjects = useMemo(() => {
    const raw = teacher?.subjects || [];
    return raw.map(item => {
      if (typeof item === 'object' && item._id) {
        return {
          _id: item._id,
          name: item.name || 'Unnamed',
          code: item.code || '—',
          credits: item.credits || 0,
          type: item.type || '—',
        };
      }
      const id = String(item);
      return subjectMap[id] || { _id: id, name: 'Unknown', code: '—', credits: 0, type: '—' };
    });
  }, [teacher, subjectMap]);

  // Filter by search term
  const filteredSubjects = useMemo(() => {
    if (!searchTerm.trim()) return teacherSubjects;
    const term = searchTerm.toLowerCase();
    return teacherSubjects.filter(s =>
      s.name.toLowerCase().includes(term) ||
      s.code.toLowerCase().includes(term)
    );
  }, [teacherSubjects, searchTerm]);

  // Fetch subject details (syllabus + coverage)
  const fetchSubjectDetails = async (subjectId) => {
    setSelectedSubject(subjectId);
    setDetailLoading(true);
    setSyllabusUnits([]);
    setCoverage(null);
    try {
      const [unitsRes, covRes] = await Promise.all([
        api.get('/syllabus', { params: { subject: subjectId } }),
        teacher?._id
          ? api.get('/course-coverage', { params: { teacher: teacher._id, subject: subjectId } })
          : Promise.resolve({ data: { coverage: [] } })
      ]);
      const units = unitsRes.data?.units || [];
      const coverageData = covRes.data?.coverage || [];
      setSyllabusUnits(units);
      setCoverage(coverageData);

      // Cache stats for this subject
      const totalCoverage = coverageData.length > 0
        ? coverageData.reduce((sum, c) => sum + (c.coveragePercentage || 0), 0) / coverageData.length
        : 0;
      setCachedStats(prev => ({
        ...prev,
        [subjectId]: { units: units.length, coveragePct: Math.round(totalCoverage) }
      }));
    } catch {
      toast.error('Could not load subject details');
    } finally {
      setDetailLoading(false);
    }
  };

  const clearSelection = () => setSelectedSubject(null);

  // Loading skeleton
  if (loadingTeacher) {
    return (
      <Layout role="teacher">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border p-5 h-36 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                <div className="h-6 bg-gray-200 rounded w-2/3 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout role="teacher">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header with search */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FiBook className="text-blue-600" /> My Subjects
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {teacherSubjects.length} subject{teacherSubjects.length !== 1 ? 's' : ''} assigned
            </p>
          </div>
          {teacherSubjects.length > 0 && (
            <div className="relative max-w-xs w-full">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition bg-white"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <FiX className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Subject Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSubjects.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              <FiBook className="mx-auto text-4xl text-gray-300 mb-3" />
              <p className="text-lg font-medium">
                {searchTerm ? 'No subjects match your search.' : 'No subjects assigned yet.'}
              </p>
              <p className="text-sm mt-1">
                {!searchTerm && 'Contact your administrator to get subjects assigned.'}
              </p>
            </div>
          ) : (
            filteredSubjects.map(sub => {
              const stats = cachedStats[sub._id];
              return (
                <button
                  key={sub._id}
                  onClick={() => fetchSubjectDetails(sub._id)}
                  className={`text-left bg-white rounded-2xl border p-5 transition-all hover:shadow-md ${
                    selectedSubject === sub._id
                      ? 'ring-2 ring-blue-500 shadow-md border-blue-300'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">
                      {sub.code}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">
                      {sub.type}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 leading-tight">{sub.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">Credits: {sub.credits || '—'}</p>

                  {/* Mini stats if cached */}
                  {stats && (
                    <div className="mt-3 flex items-center gap-4 text-xs text-gray-500 border-t pt-3">
                      <span className="flex items-center gap-1">
                        <FiLayers className="w-3.5 h-3.5" /> {stats.units} units
                      </span>
                      <span className="flex items-center gap-1">
                        <FiBarChart2 className="w-3.5 h-3.5" /> {stats.coveragePct}% covered
                      </span>
                    </div>
                  )}

                  {/* Loading indicator for stats */}
                  {selectedSubject === sub._id && detailLoading && (
                    <div className="mt-3 h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Detail Panel */}
        {selectedSubject && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm transition-all">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {teacherSubjects.find(s => s._id === selectedSubject)?.name || 'Subject Details'}
                </h2>
                <p className="text-sm text-gray-500">
                  Code: {teacherSubjects.find(s => s._id === selectedSubject)?.code} · Credits: {teacherSubjects.find(s => s._id === selectedSubject)?.credits}
                </p>
              </div>
              <button
                onClick={clearSelection}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
              >
                <FiX size={20} />
              </button>
            </div>

            {detailLoading ? (
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
                <div className="h-20 bg-gray-100 rounded-xl animate-pulse" />
                <div className="h-20 bg-gray-100 rounded-xl animate-pulse" />
              </div>
            ) : (
              <>
                {/* Syllabus Units */}
                <div className="mb-6">
                  <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <FiLayers className="text-blue-500" /> Syllabus Units
                  </h3>
                  {syllabusUnits.length > 0 ? (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {syllabusUnits.map(unit => (
                        <div key={unit._id} className="bg-gray-50 p-3 rounded-lg">
                          <p className="font-medium text-sm">Unit {unit.unitNumber}: {unit.title}</p>
                          <p className="text-xs text-gray-500">
                            {unit.topics?.length || 0} topics · Week {unit.weekNumber || '—'}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No syllabus units defined for this subject yet.</p>
                  )}
                </div>

                {/* Coverage Progress */}
                <div>
                  <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <FiBarChart2 className="text-blue-500" /> Coverage Progress
                  </h3>
                  {coverage && coverage.length > 0 ? (
                    <div className="space-y-3">
                      {coverage.map(cov => (
                        <div key={cov._id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              Unit {cov.syllabusUnit?.unitNumber}: {cov.syllabusUnit?.title}
                            </p>
                            <p className="text-xs text-gray-500">
                              {cov.class?.name} · {cov.coveredTopics?.length || 0} topics covered
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <div className="w-24 bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-green-500 h-2 rounded-full transition-all"
                                style={{ width: `${cov.coveragePercentage || 0}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold w-10 text-right">
                              {cov.coveragePercentage || 0}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No coverage data yet. Complete lesson plans to track progress.</p>
                  )}
                </div>
              </>
            )}

            {/* Quick link to Lesson Planner */}
            <div className="pt-4 mt-6 border-t text-right">
              <Link
                to="/teacher/lesson-planner"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center gap-1 group"
              >
                <FiExternalLink className="w-4 h-4" /> Plan Lessons for this Subject
                <FiChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MySubjects;