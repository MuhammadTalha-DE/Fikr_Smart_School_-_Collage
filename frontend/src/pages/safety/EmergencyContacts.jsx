import React, { useState, useEffect } from 'react';
import {
  Phone, Shield, Plus, Search, Star, User, Building2, 
  Ambulance, FireExtinguisher, Mail, MapPin, Edit3, Trash2,
  Loader2, X, AlertTriangle
} from 'lucide-react';
import { getContacts, createContact, updateContact, deleteContact } from '../../services/safetyApi';
import toast from 'react-hot-toast';
import { getApiErrorMessage, normalizeEmergencyContact, validateEmergencyContact } from '../../utils/safetyValidation';

const relationshipConfig = {
  guardian: { icon: User, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Guardian' },
  ambulance: { icon: Ambulance, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Ambulance' },
  police: { icon: Shield, color: 'text-indigo-400', bg: 'bg-indigo-500/10', label: 'Police' },
  fire: { icon: FireExtinguisher, color: 'text-orange-400', bg: 'bg-orange-500/10', label: 'Fire Service' },
  hospital: { icon: Building2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Hospital' },
  school_staff: { icon: User, color: 'text-purple-400', bg: 'bg-purple-500/10', label: 'School Staff' },
  other: { icon: Phone, color: 'text-gray-400', bg: 'bg-gray-500/10', label: 'Other' },
};

const EmergencyContacts = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '', relationship: 'other', phone: '', alternatePhone: '',
    email: '', address: '', priority: 0, notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchContacts = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await getContacts();
      setContacts(res.data.contacts);
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
      setError(getApiErrorMessage(error, 'Failed to load emergency contacts'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const filteredContacts = contacts.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search) ||
    c.relationship?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async () => {
    const validationError = validateEmergencyContact(form);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setSubmitting(true);
    try {
      const payload = normalizeEmergencyContact(form);
      if (editing) {
        const res = await updateContact(editing._id, payload);
        setContacts(contacts.map(c => c._id === editing._id ? res.data.contact : c));
        toast.success('Emergency contact updated');
      } else {
        const res = await createContact(payload);
        setContacts([res.data.contact, ...contacts]);
        toast.success('Emergency contact added');
      }
      setShowForm(false);
      setEditing(null);
      setForm({ name: '', relationship: 'other', phone: '', alternatePhone: '', email: '', address: '', priority: 0, notes: '' });
    } catch (error) {
      console.error('Failed to save:', error);
      toast.error(getApiErrorMessage(error, 'Failed to save emergency contact'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (contact) => {
    setEditing(contact);
    setForm({
      name: contact.name, relationship: contact.relationship, phone: contact.phone,
      alternatePhone: contact.alternatePhone || '', email: contact.email || '',
      address: contact.address || '', priority: contact.priority || 0, notes: contact.notes || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this emergency contact permanently? This action will be recorded in the audit log.')) return;
    try {
      await deleteContact(id);
      setContacts(contacts.filter(c => c._id !== id));
      toast.success('Emergency contact deleted');
    } catch (error) {
      console.error('Failed to delete:', error);
      toast.error(getApiErrorMessage(error, 'Failed to delete emergency contact'));
    }
  };

  const priorityContacts = filteredContacts.filter(c => c.priority > 0);
  const otherContacts = filteredContacts.filter(c => !c.priority || c.priority === 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Phone className="w-8 h-8 text-blue-400" />
              Emergency Contacts
            </h1>
            <p className="text-gray-400 mt-1">Manage important emergency contact numbers</p>
          </div>
          <button
            onClick={() => { setEditing(null); setForm({ name: '', relationship: 'other', phone: '', alternatePhone: '', email: '', address: '', priority: 0, notes: '' }); setShowForm(true); }}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium hover:from-blue-500 hover:to-blue-600 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> Add Contact
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search by name, phone, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </div>

        {error && !loading && (
          <div className="mb-8 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>{error}</span>
            </div>
            <button onClick={fetchContacts} className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-sm">
              Retry
            </button>
          </div>
        )}

        {/* Priority Contacts */}
        {priorityContacts.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" /> Priority Contacts
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {priorityContacts.map(contact => (
                <ContactCard key={contact._id} contact={contact} onEdit={handleEdit} onDelete={handleDelete} />
              ))}
            </div>
          </div>
        )}

        {/* All Contacts */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            [1,2,3,4,5,6].map(i => <div key={i} className="h-28 rounded-xl bg-white/5 animate-pulse" />)
          ) : otherContacts.length === 0 && priorityContacts.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <Phone className="w-16 h-16 text-gray-500/50 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No contacts added yet</p>
              <p className="text-gray-500 text-sm mt-1">Add emergency contacts to keep everyone informed</p>
              <button onClick={() => setShowForm(true)}
                className="mt-4 px-6 py-3 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all">
                <Plus className="w-4 h-4 inline mr-2" /> Add Your First Contact
              </button>
            </div>
          ) : (
            otherContacts.map(contact => (
              <ContactCard key={contact._id} contact={contact} onEdit={handleEdit} onDelete={handleDelete} />
            ))
          )}
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg mx-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">{editing ? 'Edit Contact' : 'Add Emergency Contact'}</h3>
              <button onClick={() => { setShowForm(false); setEditing(null); }} className="p-2 rounded-full hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <input type="text" placeholder="Full Name *" value={form.name}
                onChange={(e) => setForm({...form, name: e.target.value})}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
              <div className="grid grid-cols-2 gap-4">
                <select value={form.relationship} onChange={(e) => setForm({...form, relationship: e.target.value})}
                  className="px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none">
                  <option value="guardian">Guardian</option>
                  <option value="ambulance">Ambulance</option>
                  <option value="police">Police</option>
                  <option value="fire">Fire Service</option>
                  <option value="hospital">Hospital</option>
                  <option value="school_staff">School Staff</option>
                  <option value="other">Other</option>
                </select>
                <input type="number" placeholder="Priority (0-10)" value={form.priority}
                  onChange={(e) => setForm({...form, priority: parseInt(e.target.value) || 0})}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none" />
              </div>
              <input type="tel" placeholder="Phone Number *" value={form.phone}
                onChange={(e) => setForm({...form, phone: e.target.value})}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none" />
              <input type="tel" placeholder="Alternate Phone" value={form.alternatePhone}
                onChange={(e) => setForm({...form, alternatePhone: e.target.value})}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none" />
              <input type="email" placeholder="Email Address" value={form.email}
                onChange={(e) => setForm({...form, email: e.target.value})}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none" />
              <input type="text" placeholder="Address" value={form.address}
                onChange={(e) => setForm({...form, address: e.target.value})}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none" />
              <textarea placeholder="Notes" value={form.notes} rows={2}
                onChange={(e) => setForm({...form, notes: e.target.value})}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none resize-none" />
              <button onClick={handleSubmit} disabled={submitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium hover:from-blue-500 hover:to-blue-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <>{editing ? 'Update Contact' : 'Add Contact'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Contact Card Component
const ContactCard = ({ contact, onEdit, onDelete }) => {
  const config = relationshipConfig[contact.relationship] || relationshipConfig.other;
  const Icon = config.icon;

  return (
    <div className="p-5 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0 hover:bg-white/10 transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${config.bg}`}>
            <Icon className={`w-5 h-5 ${config.color}`} />
          </div>
          <div>
            <h4 className="font-semibold text-white flex items-center gap-2">
              {contact.name}
              {contact.priority > 0 && <Star className="w-4 h-4 text-amber-400 fill-amber-400" />}
            </h4>
            <span className={`text-xs ${config.color}`}>{config.label}</span>
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(contact)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400">
            <Edit3 className="w-4 h-4" />
          </button>
          <button onClick={() => onDelete(contact._id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="space-y-2 ml-12">
        <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300">
          <Phone className="w-3.5 h-3.5" /> {contact.phone}
        </a>
        {contact.alternatePhone && (
          <a href={`tel:${contact.alternatePhone}`} className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-300">
            <Phone className="w-3.5 h-3.5" /> {contact.alternatePhone}
          </a>
        )}
        {contact.email && (
          <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-300">
            <Mail className="w-3.5 h-3.5" /> {contact.email}
          </a>
        )}
        {contact.address && (
          <p className="flex items-center gap-2 text-sm text-gray-500"><MapPin className="w-3.5 h-3.5" /> {contact.address}</p>
        )}
      </div>
    </div>
  );
};

export default EmergencyContacts;
