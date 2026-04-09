using Microsoft.AspNetCore.Mvc;
namespace SportCenter.Api.Controllers;
public class EmployeesController : ControllerBase {}

public void AddShiftToEmployee(int employeeId, Shift shift)
{
	var employee = 
	var shift =
	if (employee == null || shift == null)
	{
		return NotFound();
	}

	employee.Shifts.Add(shift);
	
	//tilføjer hos modparten
	if (shift.Employee != employee)
	{
		ShiftsController.setEmployee(shift.ShiftId, employee.EmployeeId)
	}

	
	//_employeeService.UpdateEmployee(employee);
	return Ok();
}

public void removeShiftFromEmployee(int employeeId, int shiftId) 
{
	var employee = 
	var shift =
	if (employee == null || shift == null)
	{
		return NotFound();
	}
	employee.Shifts.Remove(shift);

	//Fjerner hos modparten
	if (shift.Employee == employee) 
	{
		ShiftsController.SetEmployee(shift.ShiftId, null);
	}

	//_employeeService.UpdateEmployee(employee);
	return Ok();
}

public List<Shift> getFutureShiftsForEmployee(int employeeId)
{
	var employee = 
	if (employee == null)
	{
		return NotFound();
	}
	var futureShifts = employee.Shifts.Where(shift => shift.Date > DateOnly.FromDateTime(DateTime.Now)).ToList();
	return futureShifts;
}

public double getTotalHoursForMonth(int employeeId, int month, int year) 
{
	var employee = 
	if (employee == null)
	{
		return NotFound();
	}
	var shiftsInMonth = employee.Shifts.Where(shift => shift.Date.Month == month && shift.Date.Year == year).ToList();
	double totalHours = shiftsInMonth.Sum(shift => (shift.EndTime - shift.StartTime).TotalHours);
	return totalHours;
}