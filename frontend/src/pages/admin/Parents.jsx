import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import { FiUsers, FiSearch, FiMail, FiUserCheck, FiX } from 'react-icons/fi';

const Parents = () => {
  const [parents, setParents] = useState([]);
  const [filteredParents, setFilteredParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchParents();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredParents(parents);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredParents(
        parents.filter(
          (p) =>
            p.userId?.name?.toLowerCase().includes(term) ||
            p.userId?.email?.toLowerCase().includes(term) ||
            p.userId?.username?.toLowerCase().includes(term) ||
            (p.children?.length || 0).toString().includes(term)
        )
      );
    }
  }, [parents, searchTerm]);

  const fetchParents = async () => {
    try {
      const { data } = await api.get('/parents');
      setParents(data);
      setFilteredParents(data);
    } catch (error) {
      console.error('Failed to load parents', error);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => setSearchTerm('');

  return (
    <Layout role="admin">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
          <FiUsers className="text-pink-500" />
          Parents
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {filteredParents.length} parent(s) found
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6 max-w-md">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name, email, username, or number of children..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-100 focus:border-pink-400 outline-none transition bg-white"
        />
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <FiX className="w-4 h-4" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading parents…</div>
      ) : filteredParents.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          No parents found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredParents.map((p) => (
            <Link
              key={p._id}
              to={`/admin/parents/${p._id}`}
              className="card p-5 hover:border-pink-200 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-700 font-bold overflow-hidden">
                  {p.userId?.avatar ? (
                    <img
                      src={p.userId.avatar}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    p.userId?.name?.charAt(0)?.toUpperCase()
                  )}
                </div>
                <div>
                  <p className="font-medium text-slate-900 group-hover:text-pink-600 transition-colors">
                    {p.userId?.name}
                  </p>
                  <p className="text-sm text-slate-500 flex items-center gap-1">
                    <FiMail className="w-3.5 h-3.5" /> {p.userId?.email}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                <FiUserCheck className="w-4 h-4 text-purple-500" />
                <span>
                  {p.children?.length || 0} child{+p.children?.length !== 1 ? 'ren' : ''}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Layout>
  );
};

export default Parents;