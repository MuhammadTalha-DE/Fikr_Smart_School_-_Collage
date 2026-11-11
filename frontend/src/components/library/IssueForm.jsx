import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Select from 'react-select';
import Avatar from '../common/Avatar';   // adjust path if necessary

const IssueForm = ({ onClose, refresh }) => {
  const [form, setForm] = useState({
    bookId: '',
    userId: '',
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: '',
  });
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [books, setBooks] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await api.get('/library/users');
        const list = data.users || [];
        setUsers(
          list.map((u) => ({
            value: u._id,
            label: `${u.name || 'Unknown'} (${u.role})`,
            avatar: u.avatar,
          }))
        );
      } catch {
        setUsers([]);
      }
    };

    const fetchBooks = async () => {
      try {
        const { data } = await api.get('/books');
        const bookList = data?.books || (Array.isArray(data) ? data : []);
        setBooks(
          bookList.map((b) => ({
            value: b._id,
            label: `${b.title || 'Untitled'} - ${b.author || 'Unknown'}`,
          }))
        );
      } catch {
        setBooks([]);
      }
    };

    fetchUsers();
    fetchBooks();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.bookId || !form.userId || !form.dueDate)
      return toast.error('All fields are required');
    setLoading(true);
    try {
      await api.post('/library/issue', form);
      toast.success('Book issued');
      refresh();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Issue failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <h2 className="text-xl font-bold mb-4">Issue Book</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Borrower</label>
            <Select
              isClearable
              options={users}
              value={users.find((u) => u.value === form.userId) || null}
              onChange={(opt) => setForm({ ...form, userId: opt?.value || '' })}
              placeholder="Search user..."
              noOptionsMessage={() => "No users found"}
              formatOptionLabel={(option) => (
                <div className="flex items-center gap-2">
                  <Avatar src={option.avatar} name={option.label} size="w-6 h-6" />
                  <span>{option.label}</span>
                </div>
              )}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Book</label>
            <Select
              isClearable
              options={books}
              value={books.find((b) => b.value === form.bookId) || null}
              onChange={(opt) => setForm({ ...form, bookId: opt?.value || '' })}
              placeholder="Search book..."
              noOptionsMessage={() => "No books found"}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Issue Date</label>
              <input
                type="date"
                value={form.issueDate}
                onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Due Date *</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="input-field"
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary bg-blue-600 text-white"
            >
              {loading ? 'Issuing...' : 'Issue Book'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IssueForm;