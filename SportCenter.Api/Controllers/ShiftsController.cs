using Microsoft.AspNetCore.Mvc;
namespace SportCenter.Api.Controllers;
public class ShiftsController : ControllerBase {}

public void setEmployee(int shiftId, int employeeId)
{
	var shift = 
	var employee =
	//Tjekker at både shift og employee findes
	if (shift == null || employee == null)
	{
		return NotFound();
	}

	//Fjerner shift fra tidligere employee, hvis der er en
	if (shift.Employee != null)
	{
		shift.Employee.Shifts.Remove(shift);
	}

	//opdaterer shiftens employee
	shift.Employee = employee;

	//tjekker at modpartens link også opdateres
	if (!employeeId.Shifts.Contains(shift))
	{
		EmployeesController.AddShiftToEmployee(employee.EmployeeId, shift.ShiftId);
	}

	//_shiftService.UpdateShift(shift);
	return Ok();
}