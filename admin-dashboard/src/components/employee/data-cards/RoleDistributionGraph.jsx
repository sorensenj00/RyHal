import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { isSameDay, parseISO, format } from 'date-fns';
import { da } from 'date-fns/locale';
import './RoleDistributionGraph.css';

const RoleDistributionGraph = ({ targetDate, employees = [], shifts = [] }) => {
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

  let roleCounts = {};

  if (targetDate && shifts.length > 0) {
    // LOGIK TIL VELKOMST-SIDE (Vagter på en bestemt dag)
    const shiftsToday = shifts.filter(shift => isSameDay(parseISO(shift.date), targetDate));
    roleCounts = shiftsToday.reduce((acc, shift) => {
      // Find medarbejderen via employeeId
      const emp = employees.find(e => e.employeeId === shift.employeeId);
      
      // Hent rolle-navnet fra databasens array-struktur: roles[0].name
      const roleName = emp && emp.roles && emp.roles.length > 0 
        ? emp.roles[0].name 
        : (shift.category || 'Andet');

      acc[roleName] = (acc[roleName] || 0) + 1;
      return acc;
    }, {});
  } else {
    // LOGIK TIL OVERBLIKS-SIDE (Alle medarbejdere fra API)
    roleCounts = employees.reduce((acc, emp) => {
      // Vi tager den første rolle fra listen "roles: [{name: '...'}]"
      const roleName = emp.roles && emp.roles.length > 0 
        ? emp.roles[0].name 
        : 'Andet';

      acc[roleName] = (acc[roleName] || 0) + 1;
      return acc;
    }, {});
  }

  const getDynamicTitle = () => {
    if (targetDate) {
      return `Fordeling d. ${format(targetDate, 'd. MMMM', { locale: da })}`;
    }
    return "Medarbejderfordeling (Total)";
  };

  // Formater data til Recharts format
  const data = Object.keys(roleCounts).map(role => ({
    name: role,
    value: roleCounts[role],
    fill: roleColorMap[role] || getVar('--color-andet')
  }));

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
