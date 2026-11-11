import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';  
import toast from 'react-hot-toast';
import { FiPlus, FiSearch, FiRefreshCw } from 'react-icons/fi';
import BookCard from '../../components/library/BookCard';
import BookForm from '../../components/library/BookForm';
import Avatar from '../../components/common/Avatar';

const BookInventory = () => {

     const { user } = useAuth();    
  const [books, setBooks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editBook, setEditBook] = useState(null);
  const [stats, setStats] = useState({ totalBooks: 0, totalIssued: 0, overdue: 0 });

  useEffect(() => { fetchBooks(); fetchStats();}, [search]);

  const fetchStats = async() =>{
    try{
        const {data}= await api.get('/library/stats');
        setStats(data);
    } catch{/* ignore*/}

  };

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const params = search ? { search } : {};
      const { data } = await api.get('/books', { params });
      setBooks(data.books);
    } catch { toast.error('Failed to load books'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this book?')) return;
    try {
      await api.delete(`/books/${id}`);
      toast.success('Book deleted');
      fetchBooks();
    } catch { toast.error('Delete failed'); }
  };

  const openEdit = (book) => {
    setEditBook(book);
    setShowForm(true);
  };

  const openCreate = () => {
    setEditBook(null);
    setShowForm(true);
  };

  return (
    <Layout role={user?.role}>   {/* role passed dynamically by ProtectedRoute / sidebar */}
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">📚 Book Inventory</h1>
            <p className="text-sm text-gray-500 mt-1">{books.length} books</p>
          </div>
          <button onClick={openCreate} className="btn-primary bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2">
            <FiPlus /> Add Book
          </button>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-6">
  <div className="bg-white rounded-xl border p-4 text-center">
    <p className="text-2xl font-bold text-gray-900">{stats.totalBooks}</p>
    <p className="text-sm text-gray-500">Total Books</p>
  </div>
  <div className="bg-white rounded-xl border p-4 text-center">
    <p className="text-2xl font-bold text-blue-600">{stats.totalIssued}</p>
    <p className="text-sm text-gray-500">Issued Books</p>
  </div>
  <div className="bg-white rounded-xl border p-4 text-center">
    <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
    <p className="text-sm text-gray-500">Overdue</p>
  </div>
</div>



        {/* Search */}
        <div className="relative mb-6 max-w-md">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title, author, ISBN..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-10 bg-white"
          />
        </div>

        {/* Book List */}
        {loading ? (
          <p className="text-center py-12 text-gray-500">Loading books...</p>
        ) : books.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No books found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {books.map(book => (
              <BookCard
                key={book._id}
                book={book}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* Book Form Modal */}
        {showForm && (
          <BookForm
            book={editBook}
            onClose={() => setShowForm(false)}
            refresh={fetchBooks}
          />
        )}
      </div>
    </Layout>
  );
};

export default BookInventory;