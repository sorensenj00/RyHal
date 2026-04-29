import React, { useEffect, useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { isSameDay, parseISO, format } from 'date-fns';
import { da } from 'date-fns/locale';
import api from '../../../api/axiosConfig';
import { resolveRoleColorValue } from '../../../data/roleColors';
import './RoleDistributionGraph.css';

const RoleDistributionGraph = ({
  targetDate,
  shifts = [],
  employees = [],
  distributionSource = 'shift-categories'
}) => {
  const [internalEmployees, setInternalEmployees] = useState([]);
  const [internalShifts, setInternalShifts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Funktion til at hente CSS-variabler (farver) fra dit stylesheet
  const getVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  const roleColorMap = {
    'Hal Mand': getVar('--color-hal-mand') || '#B8BB0B',
    'Hal Dreng': getVar('--color-hal-dreng') || '#D4D700',
    'Cafemedarbejder': getVar('--color-cafemedarbejder') || '#22C55E',
    'Administration': getVar('--color-administration') || '#F59E0B',
    'Rengøring': getVar('--color-rengoering') || '#7C3AED',
    'Opvasker': getVar('--color-opvasker') || '#06B6D4',
    'Andet': getVar('--color-andet') || '#94A3B8'
  };

  const shouldFetchEmployees = distributionSource === 'employee-roles' && employees.length === 0;
  const shouldFetchShifts = distributionSource === 'shift-categories' && shifts.length === 0;

  useEffect(() => {
    const fetchMissingData = async () => {
      if (!shouldFetchEmployees && !shouldFetchShifts) {
        return;
      }

      try {
        setIsLoading(true);

        const requests = [];

        if (shouldFetchEmployees) {
          requests.push(api.get('/employees'));
        }

        if (shouldFetchShifts) {
          requests.push(api.get('/shifts'));
        }

        const results = await Promise.all(requests);
        let resultIndex = 0;

        if (shouldFetchEmployees) {
          setInternalEmployees(results[resultIndex].data || []);
          resultIndex += 1;
        }

        if (shouldFetchShifts) {
          setInternalShifts(results[resultIndex].data || []);
        }
      } catch (error) {
        console.error('Fejl ved hentning af data til rollefordeling:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMissingData();
  }, [shouldFetchEmployees, shouldFetchShifts]);

  const resolvedEmployees = shouldFetchEmployees ? internalEmployees : employees;
  const resolvedShifts = shouldFetchShifts ? internalShifts : shifts;

  const getShiftDate = (shift) => {
    const rawValue = shift?.startTime ?? shift?.date;
    if (!rawValue) return null;
    return typeof rawValue === 'string' ? parseISO(rawValue) : new Date(rawValue);
  };

  const roleCounts = useMemo(() => {
    if (distributionSource === 'employee-roles') {
      return resolvedEmployees.reduce((acc, employee) => {
        const primaryRole = employee.roles?.[0];
        const roleName = primaryRole?.name || 'Andet';
        const roleColor = resolveRoleColorValue(primaryRole?.color);

        if (!acc[roleName]) {
          acc[roleName] = { count: 0, color: roleColor };
        }

        acc[roleName].count += 1;
        return acc;
      }, {});
    }

    if (targetDate && resolvedShifts.length > 0) {
      // LOGIK TIL VELKOMST-SIDE (Vagter på en bestemt dag)
      const shiftsToday = resolvedShifts.filter((shift) => {
        const shiftDate = getShiftDate(shift);
        return shiftDate ? isSameDay(shiftDate, targetDate) : false;
      });

      return shiftsToday.reduce((acc, shift) => {
        const roleName = shift.categoryName || shift.category?.name || shift.category || 'Andet';
        const roleColor = shift.categoryColor || roleColorMap[roleName] || getVar('--color-andet');

        if (!acc[roleName]) {
          acc[roleName] = { count: 0, color: roleColor };
        }

        acc[roleName].count += 1;
        return acc;
      }, {});
    }

    // LOGIK TIL OVERBLIKS-SIDE (Alle vagter)
    return resolvedShifts.reduce((acc, shift) => {
      const roleName = shift.categoryName || shift.category?.name || shift.category || 'Andet';
      const roleColor = shift.categoryColor || roleColorMap[roleName] || getVar('--color-andet');

      if (!acc[roleName]) {
        acc[roleName] = { count: 0, color: roleColor };
      }

      acc[roleName].count += 1;
      return acc;
    }, {});
  }, [distributionSource, targetDate, resolvedEmployees, resolvedShifts]);

  const getDynamicTitle = () => {
    if (distributionSource === 'employee-roles') {
      return 'Medarbejderfordeling (Total)';
    }

    if (targetDate) {
      return `Fordeling d. ${format(targetDate, 'd. MMMM', { locale: da })}`;
    }
    return 'Vagtfordeling (Total)';
  };

  // Formater data til Recharts format
  const data = Object.keys(roleCounts).map(role => ({
    name: role,
    value: roleCounts[role].count,
    fill: roleCounts[role].color || roleColorMap[role] || getVar('--color-andet')
  }));

  if (isLoading) {
    return (
      <div className="role-graph-container">
        <h3 className="graph-title">{getDynamicTitle()}</h3>
        <p className="text-muted text-center p-3">Henter data...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="role-graph-container">
        <h3 className="graph-title">{getDynamicTitle()}</h3>
        <p className="text-muted text-center p-3">Ingen data fundet.</p>
      </div>
    );
  }

  return (
    <div className="role-graph-container">
      <h3 className="graph-title">{getDynamicTitle()}</h3>
      <div className="graph-wrapper">
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="65%"
              outerRadius="85%"
              paddingAngle={4}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                borderRadius: '8px', 
                border: 'none', 
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', 
                fontSize: '12px' 
              }}
            />
            <Legend verticalAlign="bottom" align="center" iconSize={8} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RoleDistributionGraph;
