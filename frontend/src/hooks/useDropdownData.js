// hooks/useDropdownData.js
import { useState, useEffect } from 'react';
import api from '../services/api';

export function useDropdownData(url, dataKey, deps = []) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await api.get(url);
        if (cancelled) return;
        const body = res.data;
        let arr = [];

        // 1. Use explicit key if provided
        if (dataKey && body && typeof body === 'object') {
          arr = Array.isArray(body[dataKey]) ? body[dataKey] : [];
        } else if (Array.isArray(body)) {
          arr = body;
        } else if (body && typeof body === 'object') {
          // 2. Try common wrapper keys in order
          const keys = [
            'data', 'subjects', 'classes', 'sessions', 'curriculums',
            'events', 'deadlines', 'plans', 'units', 'results',
          ];
          for (const key of keys) {
            if (Array.isArray(body[key])) {
              arr = body[key];
              break;
            }
          }
        }

        if (arr.length === 0 && body && typeof body === 'object') {
          // 3. Still empty – warn with the actual keys present
          console.warn(
            `[useDropdownData] Could not extract array from ${url}. Response keys:`,
            Object.keys(body)
          );
        }

        setData(arr);
      } catch (err) {
        console.warn(`[useDropdownData] Request failed for ${url}:`, err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetch();
    return () => { cancelled = true; };
  }, [url, dataKey, ...deps]);

  return { data, loading };
}