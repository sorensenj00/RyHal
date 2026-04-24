import { render, screen } from '@testing-library/react';
import EmployeeHoursSummaryCards from './components/employee-hours/EmployeeHoursSummaryCards';

test('renders employee hours summary cards', () => {
  render(
    <EmployeeHoursSummaryCards
      summary={{
        totalMinutes: 480,
        totalShiftCount: 2,
        activeEmployees: 1,
        totalEmployees: 2,
        employeesWithoutHours: 1,
      }}
    />
  );

  expect(screen.getByText(/Total timer/i)).toBeInTheDocument();
  expect(screen.getByText(/8\.00 timer/i)).toBeInTheDocument();
  expect(screen.getByText(/Aktive medarbejdere/i)).toBeInTheDocument();
});
