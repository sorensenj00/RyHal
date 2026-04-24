import React from 'react';

const EmployeeHoursFilters = ({
  filters,
  employees,
  roles,
  categories,
  onChange,
  onReset,
}) => {
  return (
    <section className="hours-filters-card" aria-label="Filtre til timeoversigt">
      <div className="hours-filter-grid">
        <label className="hours-field">
          <span>Fra</span>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => onChange('startDate', e.target.value)}
          />
        </label>

        <label className="hours-field">
          <span>Til</span>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => onChange('endDate', e.target.value)}
          />
        </label>

        <label className="hours-field">
          <span>Medarbejder</span>
          <select
            value={filters.employeeId}
            onChange={(e) => onChange('employeeId', e.target.value)}
          >
            <option value="">Alle medarbejdere</option>
            {employees.map((employee) => (
              <option key={employee.employeeId} value={employee.employeeId}>
                {employee.firstName} {employee.lastName}
              </option>
            ))}
          </select>
        </label>

        <label className="hours-field">
          <span>Rolle</span>
          <select
            value={filters.roleName}
            onChange={(e) => onChange('roleName', e.target.value)}
          >
            <option value="">Alle roller</option>
            {roles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </label>

        <label className="hours-field">
          <span>Kategori</span>
          <select
            value={filters.shiftCategoryId}
            onChange={(e) => onChange('shiftCategoryId', e.target.value)}
          >
            <option value="">Alle kategorier</option>
            {categories.map((category) => (
              <option key={category.shiftCategoryId} value={category.shiftCategoryId}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label className="hours-field hours-field-wide">
          <span>Søg</span>
          <input
            type="text"
            value={filters.search}
            placeholder="Søg på navn eller rolle"
            onChange={(e) => onChange('search', e.target.value)}
          />
        </label>
      </div>

      <div className="hours-filter-actions">
        <button type="button" className="hours-btn hours-btn-secondary" onClick={onReset}>
          Nulstil filtre
        </button>
      </div>
    </section>
  );
};

export default EmployeeHoursFilters;
