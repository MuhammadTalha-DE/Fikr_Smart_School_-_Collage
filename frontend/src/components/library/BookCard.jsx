import { FiEdit2, FiTrash2, FiBook } from 'react-icons/fi';

const BookCard = ({ book, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-xl border p-4 shadow-sm hover:shadow-md transition flex gap-4">
      <div className="w-16 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
        {book.coverImage ? (
          <img src={book.coverImage} alt={book.title} className="object-cover w-full h-full" />
        ) : (
          <FiBook className="text-gray-400 text-2xl" />
        )}
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-gray-900">{book.title}</h3>
        <p className="text-sm text-gray-600">by {book.author}</p>
        <p className="text-xs text-gray-500 mt-1">
          ISBN: {book.isbn || '—'} | Rack: {book.rackNo || '—'}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <span className={`px-2 py-0.5 text-xs rounded-full ${
            book.availableQuantity > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {book.availableQuantity}/{book.totalQuantity} available
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <button onClick={() => onEdit(book)} className="text-blue-600 hover:text-blue-800" title="Edit">
          <FiEdit2 />
        </button>
        <button onClick={() => onDelete(book._id)} className="text-red-600 hover:text-red-800" title="Delete">
          <FiTrash2 />
        </button>
      </div>
    </div>
  );
};

export default BookCard;