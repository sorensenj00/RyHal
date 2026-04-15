import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { employees } from '../../../data/DummyData';
import './RoleDistributionGraph.css';

const RoleDistributionGraph = () => {
  // Funktion til at hente CSS variabel farver
  const getVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  // Map roller til dine CSS variabler fra global.css
  const roleColorMap = {
    'Hal Mand': getVar('--color-hal-mand') || '#B8BB0B',
    'Hal Dreng': getVar('--color-hal-dreng') || '#D4D700',
    'Cafemedarbejder': getVar('--color-cafemedarbejder') || '#22C55E',
    'Administration': getVar('--color-administration') || '#F59E0B',
    'Rengøring': getVar('--color-rengoering') || '#7C3AED',
    'Opvasker': getVar('--color-opvasker') || '#06B6D4',
    'Andet': getVar('--color-andet') || '#94A3B8'
  };

  const roleCounts = employees.reduce((acc, emp) => {
    acc[emp.role] = (acc[emp.role] || 0) + 1;
    return acc;
  }, {});

  const data = Object.keys(roleCounts).map(role => ({
    name: role,
    value: roleCounts[role],
    fill: roleColorMap[role] || getVar('--color-andet')
  }));

  const renderCustomLegendText = (value, entry) => (
    <span className="legend-text">
      {value} <span className="legend-count">({entry.payload.value})</span>
    </span>
  );

  return (
    <div className="role-graph-container">
      <h3 className="graph-title">Rollefordeling</h3>
      <div className="graph-wrapper">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="45%"
              innerRadius="60%"
              outerRadius="90%"
              paddingAngle={4}
              dataKey="value"
              stroke="none"
              /* label er fjernet herfra for at få en ren cirkel */
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                borderRadius: '8px', 
                border: 'none', 
                boxShadow: 'var(--box-shadow-lg)',
                fontSize: '12px'
              }}
            />
            <Legend 
              verticalAlign="bottom" 
              align="center"
              iconSize={8}
              formatter={renderCustomLegendText}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RoleDistributionGraph;
