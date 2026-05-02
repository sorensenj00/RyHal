import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { da } from 'date-fns/locale';
import api from '../../../api/axiosConfig';
import { resolveRoleColorValue } from '../../../data/roleColors';
import './EmployeeRoleShiftHoursGraph.css';

const EmployeeRoleShiftHoursGraph = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const now = new Date();
        const startDate = format(startOfMonth(now), 'yyyy-MM-dd');
        const endDate = format(endOfMonth(now), 'yyyy-MM-dd');

        const response = await api.get('/employee-hours', { params: { startDate, endDate } });
        const rows = response.data?.rows ?? [];

        const roleMap = {};
        for (const row of rows) {
          const key = row.roleName || 'Ingen rolle';
          if (!roleMap[key]) {
            roleMap[key] = { roleName: key, roleColor: row.roleColor, totalHours: 0 };
          }
          roleMap[key].totalHours += row.totalHours;
        }

        const chartData = Object.values(roleMap)
          .map((r) => ({ ...r, totalHours: Math.round(r.totalHours * 10) / 10 }))
          .sort((a, b) => b.totalHours - a.totalHours);

        setData(chartData);
      } catch (err) {
        console.error('Fejl ved hentning af timeoversigt for roller:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const monthLabel = format(new Date(), 'MMMM yyyy', { locale: da });

  if (loading) {
    return (
      <div className="role-hours-graph role-hours-graph--loading">
        <p className="graph-title">Timer fordelt på roller – {monthLabel}</p>
        <div className="role-hours-graph__skeleton" />
      </div>
    );
  }

  return (
    <div className="role-hours-graph">
      <p className="graph-title">Timer fordelt på roller – {monthLabel}</p>
      {data.length === 0 ? (
        <p className="role-hours-graph__empty">Ingen timer registreret denne måned.</p>
      ) : (
        <div className="role-hours-graph__chart-wrapper">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 12, left: 0, bottom: 56 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="roleName"
                tick={{ fontSize: 11, fill: '#64748b' }}
                angle={-35}
                textAnchor="end"
                interval={0}
              />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} unit="t" width={36} />
              <Tooltip
                formatter={(value) => [`${value} timer`, 'Timer']}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
              />
              <Bar dataKey="totalHours" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={resolveRoleColorValue(entry.roleColor) || '#94a3b8'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default EmployeeRoleShiftHoursGraph;
