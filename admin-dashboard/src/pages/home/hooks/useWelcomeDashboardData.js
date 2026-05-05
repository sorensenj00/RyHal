import { useEffect, useMemo, useState } from 'react';
import { endOfWeek, format, startOfWeek } from 'date-fns';
import api from '../../../api/axiosConfig';
import { shiftDurationHours, toDateKey, parseDateSafe } from '../../../utils/dateUtils';

const PENDING_SWAP_STATUSES = new Set(['pending', 'awaitingapproval']);

const getStatusName = (swap) => {
  const nestedName = swap?.status?.name ?? swap?.Status?.Name;
  const flatName = swap?.statusName ?? swap?.StatusName;
  return String(nestedName ?? flatName ?? '').trim().toLowerCase();
};

const buildAlerts = ({ openShifts, pendingSwaps }) => {
  const alerts = [];

  if (openShifts > 0) {
    alerts.push({
      id: 'open-shifts',
      severity: 'critical',
      title: `${openShifts} ledig${openShifts === 1 ? '' : 'e'} vagt${openShifts === 1 ? '' : 'er'} i dag`,
      description: 'Der mangler bemanding pa dagens plan.',
      actionLabel: 'Aaben bemanding',
      actionTo: '/staffing-overview',
    });
  }

  if (pendingSwaps > 0) {
    alerts.push({
      id: 'pending-swaps',
      severity: 'warning',
      title: `${pendingSwaps} bytteanmodning${pendingSwaps === 1 ? '' : 'er'} afventer`,
      description: 'Tjek om der er anmodninger, der skal godkendes.',
      actionLabel: 'Se bytteanmodninger',
      actionTo: '/event-shift-overview',
    });
  }

  return alerts;
};

export default function useWelcomeDashboardData(selectedDate) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [swaps, setSwaps] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [shiftsRes, employeesRes, swapsRes] = await Promise.all([
          api.get('/shifts'),
          api.get('/employees'),
          api.get('/swaprequests'),
        ]);

        if (!isMounted) return;

        setShifts(Array.isArray(shiftsRes?.data) ? shiftsRes.data : []);
        setEmployees(Array.isArray(employeesRes?.data) ? employeesRes.data : []);
        setSwaps(Array.isArray(swapsRes?.data) ? swapsRes.data : []);
      } catch (err) {
        console.error('Fejl ved hentning af welcome dashboard-data:', err);
        if (isMounted) {
          setError('Kunne ikke hente dashboard-data lige nu.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedDateKey = useMemo(() => format(selectedDate, 'yyyy-MM-dd'), [selectedDate]);

  const stats = useMemo(() => {
    const shiftsForDay = shifts.filter((shift) => {
      const shiftStart = shift?.startTime ?? shift?.StartTime;
      return toDateKey(shiftStart) === selectedDateKey;
    });

    const staffedShifts = shiftsForDay.filter((shift) => {
      const employeeId = shift?.employeeId ?? shift?.EmployeeId;
      return Boolean(employeeId);
    });

    const totalWorkHours = shiftsForDay.reduce((sum, shift) => {
      const startTime = shift?.startTime ?? shift?.StartTime;
      const endTime = shift?.endTime ?? shift?.EndTime;
      return sum + shiftDurationHours(startTime, endTime);
    }, 0);

    const startOfTargetWeek = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const endOfTargetWeek = endOfWeek(selectedDate, { weekStartsOn: 1 });

    const weeklyHours = shifts.reduce((sum, shift) => {
      const start = parseDateSafe(shift?.startTime ?? shift?.StartTime);
      const end = parseDateSafe(shift?.endTime ?? shift?.EndTime);

      if (!start || !end) {
        return sum;
      }

      if (start >= startOfTargetWeek && start <= endOfTargetWeek) {
        return sum + shiftDurationHours(start, end);
      }

      return sum;
    }, 0);

    const pendingSwaps = swaps.filter((swap) => PENDING_SWAP_STATUSES.has(getStatusName(swap))).length;

    return {
      openShifts: Math.max(shiftsForDay.length - staffedShifts.length, 0),
      staffedCount: staffedShifts.length,
      targetStaffing: shiftsForDay.length,
      totalWorkHours,
      weeklyHours,
      pendingSwaps,
    };
  }, [selectedDate, selectedDateKey, shifts, swaps]);

  const alerts = useMemo(() => {
    return buildAlerts({
      openShifts: stats.openShifts,
      pendingSwaps: stats.pendingSwaps,
    });
  }, [stats.openShifts, stats.pendingSwaps]);

  return {
    loading,
    error,
    stats,
    alerts,
    employees,
  };
}
