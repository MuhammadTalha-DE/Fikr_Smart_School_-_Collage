import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FiSave, FiX } from 'react-icons/fi';
import api from '../../services/api';

const BookForm = ({ book, onClose, refresh }) => {
  const [form, setForm] = useState({
    title: '', author: '', isbn: '', category: '',
    totalQuantity: 1, availableQuantity: 1, rackNo: '', coverImage: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (book) {
      setForm({
        title: book.title || '',
        author: book.author || '',
        isbn: book.isbn || '',
        category: book.category || '',
        totalQuantity: book.totalQuantity || 1,
        availableQuantity: book.availableQuantity || 1,
        rackNo: book.rackNo || '',
        coverImage: book.coverImage || '',
      });
    }
  }, [book]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.author) return toast.error('Title and author are required');
    setLoading(true);
    try {
      if (book) {
        await api.put(`/books/${book._id}`, form);
        toast.success('Book updated');
      } else {
        await api.post('/books', form);
        toast.success('Book created');
      }
      refresh();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{book ? 'Edit Book' : 'Add New Book'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><FiX size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Title *</label>
              <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Author *</label>
              <input type="text" value={form.author} onChange={e => setForm({...form, author: e.target.value})} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">ISBN</label>
              <input type="text" value={form.isbn} onChange={e => setForm({...form, isbn: e.target.value})} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <input type="text" value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Total Qty</label>
              <input type="number" min="1" value={form.totalQuantity} onChange={e => setForm({...form, totalQuantity: parseInt(e.target.value)||1})} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Available Qty</label>
              <input type="number" min="0" value={form.availableQuantity} onChange={e => setForm({...form, availableQuantity: parseInt(e.target.value)||0})} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Rack No</label>
              <input type="text" value={form.rackNo} onChange={e => setForm({...form, rackNo: e.target.value})} className="input-field" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Cover Image URL</label>
              <input type="text" value={form.coverImage} onChange={e => setForm({...form, coverImage: e.target.value})} className="input-field" placeholder="https://..." />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary bg-blue-600 text-white flex items-center gap-1">
              <FiSave /> {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookForm;