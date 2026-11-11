import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiEdit2 } from 'react-icons/fi';

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [form, setForm] = useState({ name: '', capacity: 30, type: 'Classroom', location: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const { data } = await api.get('/rooms');
      setRooms(data);
    } catch (error) {
      toast.error('Failed to load rooms');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return toast.error('Room name is required');
    setLoading(true);
    try {
      if (editingRoom) {
        await api.put(`/rooms/${editingRoom._id}`, form);
        toast.success('Room updated');
      } else {
        await api.post('/rooms', form);
        toast.success('Room created');
      }
      setShowModal(false);
      setForm({ name: '', capacity: 30, type: 'Classroom', location: '' });
      setEditingRoom(null);
      fetchRooms();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const deleteRoom = async (id) => {
    if (!window.confirm('Delete this room? It may be used in timetables.')) return;
    try {
      await api.delete(`/rooms/${id}`);
      toast.success('Room deleted');
      fetchRooms();
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  const openEditModal = (room) => {
    setEditingRoom(room);
    setForm({
      name: room.name,
      capacity: room.capacity,
      type: room.type,
      location: room.location || '',
    });
    setShowModal(true);
  };

  return (
    <Layout role="admin">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Room Management</h1>
        <button
          onClick={() => {
            setEditingRoom(null);
            setForm({ name: '', capacity: 30, type: 'Classroom', location: '' });
            setShowModal(true);
          }}
          className="btn-primary flex items-center"
        >
          <FiPlus className="mr-2" /> Add Room
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map(room => (
          <div key={room._id} className="bg-white rounded-lg shadow p-5">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-semibold">{room.name}</h3>
              <div className="flex space-x-2">
                <button onClick={() => openEditModal(room)} className="text-blue-600 hover:text-blue-800">
                  <FiEdit2 className="w-4 h-4" />
                </button>
                <button onClick={() => deleteRoom(room._id)} className="text-red-600 hover:text-red-800">
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Type: <span className="font-medium">{room.type}</span>
            </p>
            <p className="text-sm text-gray-600">
              Capacity: <span className="font-medium">{room.capacity}</span>
            </p>
            {room.location && (
              <p className="text-sm text-gray-500">Location: {room.location}</p>
            )}
          </div>
        ))}
      </div>

      {/* Room Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingRoom ? 'Edit Room' : 'Create New Room'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Room Name *"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="input-field"
                required
              />
              <input
                type="number"
                placeholder="Capacity"
                value={form.capacity}
                onChange={e => setForm({ ...form, capacity: e.target.value })}
                className="input-field"
              />
              <select
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
                className="input-field"
              >
                <option value="Classroom">Classroom</option>
                <option value="Lab">Lab</option>
                <option value="Hall">Hall</option>
                <option value="Library">Library</option>
                <option value="Other">Other</option>
              </select>
              <input
                type="text"
                placeholder="Location (optional)"
                value={form.location}
                onChange={e => setForm({ ...form, location: e.target.value })}
                className="input-field"
              />
              <div className="flex justify-end space-x-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Rooms;