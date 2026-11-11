import { useEffect, useState } from 'react';
import { useSocket } from '../hooks/useSocket';
import { FiClock } from 'react-icons/fi';

const SchoolClock = () => {
  const { socket } = useSocket();
  const [state, setState] = useState({
    period: null,
    remaining: 0,
    nextPeriod: null,
    status: 'idle',
  });

  useEffect(() => {
    if (!socket) return;
    const handler = (newState) => setState(newState);
    socket.on('period-update', handler);
    return () => socket.off('period-update', handler);
  }, [socket]);

  // No data yet – connecting
  if (!state || state.status === 'idle') {
    return (
      <div className="card border-pink-100 p-3 flex items-center gap-3">
        <FiClock className="text-pink-500 text-xl" />
        <p className="text-sm text-slate-500">Waiting for data…</p>
      </div>
    );
  }

  // Administrator hasn't set up any periods
  if (state.status === 'unconfigured') {
    return (
      <div className="card border-pink-100 p-3 flex items-center gap-3">
        <FiClock className="text-pink-500 text-xl" />
        <p className="text-sm text-slate-500">School timings not configured</p>
      </div>
    );
  }

  // Sunday or holiday
  if (state.status === 'off') {
    return (
      <div className="card border-pink-100 p-3 flex items-center gap-3">
        <FiClock className="text-pink-500 text-xl" />
        <p className="text-sm text-slate-500">School is closed today</p>
      </div>
    );
  }

  // All periods finished
  if (state.status === 'finished') {
    return (
      <div className="card border-pink-100 p-3 flex items-center gap-3">
        <FiClock className="text-pink-500 text-xl" />
        <p className="text-sm text-slate-500">School day finished</p>
      </div>
    );
  }

  // Before first period
  if (state.status === 'before-school') {
    return (
      <div className="card border-pink-100 p-3 flex items-center gap-3">
        <FiClock className="text-pink-500 text-xl" />
        <div>
          <p className="text-sm font-semibold text-slate-800">School starts soon</p>
          <p className="text-xs text-slate-500">
            {state.remaining} min until {state.nextPeriod}
          </p>
        </div>
      </div>
    );
  }

  // Active period
  return (
    <div className="card border-pink-100 p-3 flex items-center gap-3">
      <FiClock className="text-pink-500 text-xl" />
      <div>
        <p className="text-sm font-semibold text-slate-800">
          {state.type === 'break' ? 'Break Time' : `Period ${state.period}`}
        </p>
        <p className="text-xs text-slate-500">
          {state.remaining} min remaining
        </p>
        {state.nextPeriod && (
          <p className="text-xs text-pink-600">Next: {state.nextPeriod}</p>
        )}
      </div>
    </div>
  );
};

export default SchoolClock;