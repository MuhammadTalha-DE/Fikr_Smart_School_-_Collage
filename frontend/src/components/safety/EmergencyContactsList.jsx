import React from 'react';
import { 
  Phone, Mail, MapPin, User, Star, Shield, 
  Truck, FireExtinguisher, Building2, Ambulance, Plus, Trash2, Edit3 
} from 'lucide-react';

const relationshipConfig = {
  guardian: { icon: User, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Guardian' },
  ambulance: { icon: Ambulance, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Ambulance' },
  police: { icon: Shield, color: 'text-indigo-400', bg: 'bg-indigo-500/10', label: 'Police' },
  fire: { icon: FireExtinguisher, color: 'text-orange-400', bg: 'bg-orange-500/10', label: 'Fire Service' },
  hospital: { icon: Building2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Hospital' },
  school_staff: { icon: User, color: 'text-purple-400', bg: 'bg-purple-500/10', label: 'School Staff' },
  other: { icon: Phone, color: 'text-gray-400', bg: 'bg-gray-500/10', label: 'Other' },
};

const EmergencyContactsList = ({ contacts = [], onAdd, onEdit, onDelete, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-xl bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="text-center py-12">
        <Phone className="w-16 h-16 text-gray-500/50 mx-auto mb-4" />
        <p className="text-gray-400">No emergency contacts added yet</p>
        {onAdd && (
          <button
            onClick={onAdd}
            className="mt-4 px-6 py-3 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all"
          >
            <Plus className="w-4 h-4 inline mr-2" /> Add Contact
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {contacts.map((contact) => {
        const config = relationshipConfig[contact.relationship] || relationshipConfig.other;
        const Icon = config.icon;
        return (
          <div 
            key={contact._id}
            className="p-5 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0 
              hover:bg-white/10 transition-all group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${config.bg}`}>
                  <Icon className={`w-5 h-5 ${config.color}`} />
                </div>
                <div>
                  <h4 className="font-semibold text-white flex items-center gap-2">
                    {contact.name}
                    {contact.priority > 0 && (
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    )}
                  </h4>
                  <span className={`text-xs ${config.color}`}>{config.label}</span>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {onEdit && (
                  <button onClick={() => onEdit(contact)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400">
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}
                {onDelete && (
                  <button onClick={() => onDelete(contact._id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2 ml-12">
              <a 
                href={`tel:${contact.phone}`}
                className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                {contact.phone}
              </a>
              {contact.alternatePhone && (
                <a 
                  href={`tel:${contact.alternatePhone}`}
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-300 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  {contact.alternatePhone}
                </a>
              )}
              {contact.email && (
                <a 
                  href={`mailto:${contact.email}`}
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-300 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  {contact.email}
                </a>
              )}
              {contact.address && (
                <p className="flex items-center gap-2 text-sm text-gray-500">
                  <MapPin className="w-3.5 h-3.5" />
                  {contact.address}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default EmergencyContactsList;
