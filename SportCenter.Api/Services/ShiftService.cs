using SportCenter.Api.Controllers;
using SportCenter.Api.Models;

namespace SportCenter.Api.Services;

public class ShiftService
{
	public Shift CreateShift(DateTime startTime, DateTime endTime, ShiftCategory shiftCategory, int id)
	{
		//TODO: ADD DATABASE INTEGRATION
		return new Shift(startTime, endTime, shiftCategory, id);
	}

	public Shift RemoveShift(Shift shift)
	{
		//TODO: ADD DATABASE INTEGRATION
		shift.Employee.Shifts.Remove(shift); //Fjerner shift fra employee's liste
		return shift;
	}

	public void setEmployee(int shiftId, int employeeId)
	{
		Shift shift = null; //TODO: koble til database for at finde shift baseret på id
		Employee employee = null;
		if (employeeId != -1)
		{
			employee = null; //TODO: koble til database for at finde employee baseret på id og opdatere employee variablen
		}
		//Tjekker at shift findes
		if (shift == null)
		{
			throw new ArgumentNullException("Shift not found");
		}

		//Fjerner shift fra tidligere employee, hvis der er en
		if (shift.Employee != null)
		{
			shift.Employee.Shifts.Remove(shift);
		}

		//opdaterer shiftens employee
		shift.Employee = employee;

		//tjekker at modpartens link også opdateres
		if (employee != null && !employee.Shifts.Contains(shift))
		{
			EmployeeService.AddShiftToEmployee(employee.EmployeeId, shift);
		}

		//TODO: opdatere shift i database
	}
}
