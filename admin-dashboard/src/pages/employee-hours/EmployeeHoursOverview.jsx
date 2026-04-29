import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import api from '../../api/axiosConfig';
import EmployeeHoursFilters from '../../components/employee-hours/EmployeeHoursFilters';
import EmployeeHoursSummaryCards from '../../components/employee-hours/EmployeeHoursSummaryCards';
import EmployeeHoursTable from '../../components/employee-hours/EmployeeHoursTable';
import './EmployeeHoursOverview.css';

const getMonthRange = (date = new Date()) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  return {
    startDate: format(start, 'yyyy-MM-dd'),
    endDate: format(end, 'yyyy-MM-dd'),
  };
};

const EmployeeHoursOverview = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const defaultRange = useMemo(() => getMonthRange(), []);

  const [filters, setFilters] = useState({
    startDate: searchParams.get('startDate') || defaultRange.startDate,
    endDate: searchParams.get('endDate') || defaultRange.endDate,
    employeeId: searchParams.get('employeeId') || '',
    roleName: searchParams.get('roleName') || '',
    shiftCategoryId: searchParams.get('shiftCategoryId') || '',
    search: searchParams.get('search') || '',
  });

  const [employees, setEmployees] = useState([]);
  const [categories, setCategories] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const roles = useMemo(() => {
    const roleNames = employees
      .flatMap((employee) => employee.roles || [])
      .map((role) => role.name)
      .filter(Boolean);

    return [...new Set(roleNames)].sort((a, b) => a.localeCompare(b, 'da'));
  }, [employees]);

  const fetchOverview = async (activeFilters) => {
    const params = {
      startDate: activeFilters.startDate || undefined,
      endDate: activeFilters.endDate || undefined,
      employeeId: activeFilters.employeeId || undefined,
      roleName: activeFilters.roleName || undefined,
      shiftCategoryId: activeFilters.shiftCategoryId || undefined,
      search: activeFilters.search || undefined,
    };

    const response = await api.get('/employee-hours', { params });
    setOverview(response.data);
  };

  useEffect(() => {
    const fetchStaticData = async () => {
      try {
        setLoading(true);
        const [employeeRes, categoryRes] = await Promise.all([
          api.get('/employees'),
          api.get('/shifts/categories'),
        ]);

        setEmployees(employeeRes.data || []);
        setCategories(categoryRes.data || []);
        await fetchOverview(filters);
        setError(null);
      } catch (err) {
        console.error('Fejl ved hentning af timeoversigt:', err);
        setError('Kunne ikke hente timeoversigten.');
      } finally {
        setLoading(false);
      }
    };

    fetchStaticData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const hasFiltersLoaded = filters.startDate && filters.endDate;
    if (!hasFiltersLoaded) return undefined;

    const run = async () => {
      try {
        setLoading(true);
        await fetchOverview(filters);
        setError(null);
      } catch (err) {
        console.error('Fejl ved opdatering af timeoversigt:', err);
        setError(err?.response?.data?.message || 'Kunne ikke opdatere timeoversigten.');
      } finally {
        setLoading(false);
      }
    };

    if (employees.length > 0 || categories.length > 0) {
      run();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    setFilters({
      startDate: defaultRange.startDate,
      endDate: defaultRange.endDate,
      employeeId: '',
      roleName: '',
      shiftCategoryId: '',
      search: '',
    });
  };

  const openEmployee = (employeeId) => {
    navigate(`/employee/${employeeId}`);
  };

  const periodLabel = useMemo(() => {
    if (!overview?.startDate || !overview?.endDate) return '';

    const start = new Date(overview.startDate);
    const end = new Date(overview.endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return '';
    }

    return `${format(start, 'dd. MMM yyyy', { locale: da })} - ${format(end, 'dd. MMM yyyy', { locale: da })}`;
  }, [overview]);

  if (loading && !overview) {
    return <div className="employee-hours-page employee-hours-loading">Henter timeoversigt...</div>;
  }

  if (error && !overview) {
    return <div className="employee-hours-page employee-hours-error">{error}</div>;
  }

  return (
    <div className="employee-hours-page">
      <header className="hours-page-header">
        <div>
          <p className="hours-page-eyebrow">Medarbejdere</p>
          <h1>Timeoversigt</h1>
          <p className="hours-page-subtitle">
            Administrativ oversigt over medarbejdernes timer for {periodLabel || 'den valgte periode'}.
          </p>
        </div>
      </header>

      <EmployeeHoursFilters
        filters={filters}
        employees={employees}
        roles={roles}
        categories={categories}
        onChange={handleFilterChange}
        onReset={handleReset}
      />

      <EmployeeHoursSummaryCards summary={overview?.summary} />

      {error && (
        <div className="hours-inline-error" role="alert">
          {error}
        </div>
      )}

      <section className="hours-table-card">
        <div className="hours-table-header">
          <div>
            <h2>Detaljer</h2>
            <p>Sorterede rækker med totaler og seneste aktivitet.</p>
          </div>
          <div className="hours-table-meta">
            <span>{overview?.rows?.length || 0} medarbejdere</span>
          </div>
        </div>

        {loading && <div className="hours-table-loading">Opdaterer data...</div>}

        {!loading && (
          <EmployeeHoursTable
            rows={overview?.rows || []}
            onOpenEmployee={openEmployee}
          />
        )}
      </section>
    </div>
  );
};

export default EmployeeHoursOverview;
