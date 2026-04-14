using SportCenter.Api.Controllers;
using SportCenter.Api.Models;

namespace SportCenter.Api.Services;

public class ShiftService
{
	public Shift CreateShift(DateTime startTime, DateTime endTime, ShiftCategory shiftCategory int id)
	{
		//TODO: ADD DATABASE INTEGRATION
		return new Shift(startTime, endTime, shiftCategory, id);
	}

	public Shift RemoveShift(Shift shift)
	{
		//TODO: ADD DATABASE INTEGRATION
		return shift;
	}

	public void setEmployee(int shiftId, int employeeId)
	{
		Shift shift = null; //TODO: koble til database for at finde shift baseret på id
		Employee employee = null; //TODO: koble til database for at finde employee baseret på id
								  //Tjekker at både shift og employee findes
		if (shift == null || employee == null)
		{
			throw new ArgumentNullException("Shift or Employee not found");
		}

		//Fjerner shift fra tidligere employee, hvis der er en
		if (shift.Employee != null)
		{
			//TODO lave dette kald til employeeservice: removeShiftFromEmployee(shift.employee.EmployeeId, shiftId);
		}

		//opdaterer shiftens employee
		shift.Employee = employee;

		//tjekker at modpartens link også opdateres
		if (!employee.Shifts.Contains(shift))
		{
			//TODO lave dette kald til employeeservice: AddShiftToEmployee(employeeId, shiftId);
		}

		//TODO: opdatere shift i database
	}
}
