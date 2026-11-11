import { Draggable } from './Draggable';

const SubjectTray = ({ subjects }) => (
  <div className="card border-pink-100 p-4 flex flex-wrap gap-2">
    <h3 className="w-full text-sm font-semibold text-slate-500 mb-2">Subjects</h3>
    {subjects.map(sub => (
      <Draggable key={`tray-${sub._id || sub.name}`} id={`tray-${sub._id || sub.name}`} data={{ type: 'subject', subject: sub.name }}>
        <div className="px-3 py-1 bg-pink-50 text-pink-700 rounded-full text-sm font-medium cursor-grab hover:bg-pink-100 transition-colors">
          {sub.name}
        </div>
      </Draggable>
    ))}
  </div>
);

export default SubjectTray;