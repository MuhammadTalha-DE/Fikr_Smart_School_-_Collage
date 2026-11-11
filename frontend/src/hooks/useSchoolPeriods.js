import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const fallbackPeriods = [1, 2, 3, 4, 5, 6, 7, 8];

export const useSchoolPeriods = () => {
  const [periodRows, setPeriodRows] = useState([]);
  const [loadingPeriods, setLoadingPeriods] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchPeriods = async () => {
      try {
        const { data } = await api.get('/school-periods');
        if (mounted) setPeriodRows(Array.isArray(data) ? data : []);
      } catch (error) {
        if (mounted) setPeriodRows([]);
      } finally {
        if (mounted) setLoadingPeriods(false);
      }
    };

    fetchPeriods();
    return () => { mounted = false; };
  }, []);

  const periods = useMemo(() => {
    const classPeriods = periodRows
      .filter((period) => !period.type || period.type === 'class')
      .map((period) => Number(period.periodNumber))
      .filter(Boolean)
      .sort((left, right) => left - right);

    return classPeriods.length > 0 ? [...new Set(classPeriods)] : fallbackPeriods;
  }, [periodRows]);

  const maxPeriod = useMemo(() => (
    periods.reduce((max, period) => Math.max(max, period), 0) || fallbackPeriods.length
  ), [periods]);

  return { periods, maxPeriod, periodRows, loadingPeriods };
};

export default useSchoolPeriods;
