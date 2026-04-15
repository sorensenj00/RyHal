using Azure.Identity;
using Microsoft.EntityFrameworkCore.Metadata.Conventions;
using SportCenter.Api.Controllers;
using SportCenter.Api.Models;
namespace SportCenter.Api.Services
{
    public class EmployeeService
    {
        public Employee CreateEmployee(string firstname, string lastName, int id)
        {
            //TODO: ADD DATABASE INTEGRATION

            return new Employee(firstname, lastName, id);
        }

        public Employee RemoveEmployee(int employeeID)
        {
            Employee employee = null; //TODO: find employee in database based on ID

            foreach (var shift in employee.Shifts)
            {
                ShiftService.SetEmployee(shift.ShiftId, -1); //Fjerner employee reference fra alle shifts
            }
			return null;
        }

        /// <summary>
        /// Checks if Employee birthday is exactly or over 18 years ago
        /// </summary>
        /// <param name="employeeID"></param>
        /// <returns>Boolean</returns>
        /// <exception cref="ArgumentNullException"></exception>
        public bool IsOver18(int employeeID)
        {
            Employee employee = null; //TODO: find employee in database based on ID

            if (employee.birthday == null)
            {
                throw new ArgumentNullException("Employee birthday is not set");
            }    
            else 
            {
                return employee.birthday.Value.AddYears(18) <= DateOnly.FromDateTime(DateTime.Now);
			}
        }

        public Qualification CreateQualification(string name, string description, int id)
        {
            //TODO: Add qualification to database

            return new Qualification(name, description, id);
        }

        public Qualification RemoveQualification(int QualificationID)
        {

            //TODO: find Role in qualification based on role ID
            //TODO: remove qualification from database

            return null;
        }

        public Role CreateRole(string name, int id)
        {
            //TODO: add Role to database

            return new Role(name, id);
        }

        public Role RemoveRole(int roleID)
        {
            //TODO: find Role in database based on role ID
            //TODO: remove role from database
            //TODO: remove role from every employee that has it

            return null;
        }

        public void AddQualificationToEmployee(int employeeID, int qualificationID)
        {
            Employee employee = null; //TODO: koble til database for at finde employee baseret på id
            Qualification qualification = null; //TODO: koble til database for at finde qualification baseret på id
            if (employee == null || qualification == null)
            {
                throw new ArgumentNullException("Employee or Qualification not found");
            }
            employee.Qualifications.Add(qualification);
        }

        public Qualification RemoveQualificationFromEmployee(int employeeID, int qualificationID)
        {
            Employee employee = null; //TODO: koble til database for at finde employee baseret på id
            Qualification qualification = null; //TODO: koble til database for at finde qualification baseret på id
            if (employee == null || qualification == null)
            {
                throw new ArgumentNullException("Employee or Qualification not found");
            }
            if (!employee.Qualifications.Contains(qualification))
            {
                throw new InvalidOperationException("Qualification not found on Employee");
            }

            employee.Qualifications.Remove(qualification);

            return qualification;
        }

        public void AddRoleToEmployee(int employeeID, int RoleID)
        {
            Employee employee = null; //TODO: koble til database for at finde employee baseret på id
            Role role = null; //TODO: koble til database for at finde role baseret på id
            if (employee == null || role == null)
            {
                throw new ArgumentNullException("Employee or Role not found");
            }

            employee.Roles.Add(role);
        }

        public Role RemoveRoleFromEmployee(int employeeID, int RoleID)
        {
            Employee employee = null; //TODO koble til database for at finde employee baseret på id
            Role role = null; //TODO koble til database for at finde role baseret på id
            if (employee == null || role == null)
            {
                throw new ArgumentNullException("Employee or Role not found");
            }

            if (!employee.Roles.Contains(role))
            {
                throw new InvalidOperationException("Role not found");
            }

            employee.Roles.Remove(role);

            return role;
        }


		public static void AddShiftToEmployee(int employeeId, int shiftId)
		{
            Employee employee = null; //TODO: koble til database for at finde employee baseret på id
			Shift shift = null; //TODO: koble til database for at finde shift baseret på id
			if (employee == null || shift == null)
			{
				throw new ArgumentNullException("Employee or Shift not found");
			}
            else 
            {
			    employee.Shifts.Add(shift);

				//tilføjer hos modparten hvis nødvendigt
				if (shift.Employee != employee)
			    {
                    ShiftService.SetEmployee(shift.ShiftId, employeeId);
			    }
				//TODO opdater employee i database
			}
		}

		public void RemoveShiftFromEmployee(int employeeId, int shiftId)
		{
			Employee employee = null; //TODO: koble til database for at finde employee baseret på id
			Shift shift = null; //TODO: koble til database for at finde shift baseret på id
            if (employee == null || shift == null)
            {
                throw new ArgumentNullException("Employee or Shift not found");
            }
            else
            {

                if (!employee.Shifts.Contains(shift))
                {
                    throw new InvalidOperationException("Shift not found on Employee");
                }

                employee.Shifts.Remove(shift);

                //Fjerner hos modparten
                if (shift.Employee == employee)
                {
                    ShiftService.SetEmployee(shiftId, -1); //-1 indikerer at shift ikke længere har en employee
				}

				//TODO opdater employee i database
			}
		}

		public List<Shift> GetFutureShiftsForEmployee(int employeeId)
		{
			Employee employee = null; //TODO: koble til database for at finde employee baseret på id
            if (employee == null)
            {
                throw new ArgumentNullException("Employee not found");
            }
            else
            {
                var futureShifts = employee.Shifts.Where(shift => shift.StartTime > DateTime.Now).ToList();
                return futureShifts;
            }
		}

		public double GetTotalHoursForMonth(int employeeId, int month, int year)
		{
			Employee employee = null; //TODO: koble til database for at finde employee baseret på id
			if (employee == null)
			{
				throw new ArgumentNullException("Employee not found");
			}
            else 
            {
                var shiftsInMonth = employee.Shifts.Where(shift => shift.StartTime.Month == month && shift.StartTime.Year == year).ToList();
			    double totalHours = shiftsInMonth.Sum(shift => (shift.EndTime - shift.StartTime).TotalHours);
			    return totalHours;
            }
		}
	}
}
