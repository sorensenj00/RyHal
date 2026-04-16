import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { shifts, employees as allEmployees } from '../../../data/DummyData';
import { isSameDay, parseISO, format } from 'date-fns';
import { da } from 'date-fns/locale'; // Husk dansk sprog til datoer
import './RoleDistributionGraph.css';

const RoleDistributionGraph = ({ targetDate, employees }) => {
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

  let roleCounts = {};

  if (targetDate) {
    // LOGIK TIL VELKOMST-SIDE (Vagter på en bestemt dag)
    const shiftsToday = shifts.filter(shift => isSameDay(parseISO(shift.date), targetDate));
    roleCounts = shiftsToday.reduce((acc, shift) => {
      const emp = allEmployees.find(e => e.id === shift.employeeId);
      const role = emp ? emp.role : shift.category;
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});
  } else {
    // LOGIK TIL OVERBLIKS-SIDE (Alle medarbejdere)
    const sourceData = employees || allEmployees;
    roleCounts = sourceData.reduce((acc, emp) => {
      acc[emp.role] = (acc[emp.role] || 0) + 1;
      return acc;
    }, {});
  }

  // Dynamisk titel baseret på dato eller total
  const getDynamicTitle = () => {
    if (targetDate) {
      return `Fordeling d. ${format(targetDate, 'd. MMMM', { locale: da })}`;
    }
    return "Medarbejderfordeling (Total)";
  };

  const data = Object.keys(roleCounts).map(role => ({
    name: role,
    value: roleCounts[role],
    fill: roleColorMap[role] || getVar('--color-andet')
  }));

  // Beregn total til center-label
  const totalCount = Object.values(roleCounts).reduce((sum, val) => sum + val, 0);

  if (data.length === 0) {
    return (
      <div className="role-graph-container">
        <h3 className="graph-title">{getDynamicTitle()}</h3>
        <p className="text-muted text-center p-3">Ingen data fundet for denne dag.</p>
      </div>
    );
  }

  return (
    <div className="role-graph-container">
      <h3 className="graph-title">
       {getDynamicTitle()}
      </h3>
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
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--box-shadow-lg)', fontSize: '12px' }}
            />
            <Legend verticalAlign="bottom" align="center" iconSize={8} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RoleDistributionGraph;
