using Microsoft.EntityFrameworkCore.Metadata.Conventions;
using SportCenter.Api.Controllers;
using SportCenter.Api.Models;
namespace SportCenter.Api.Services
{
    public class EmployeeService
    {
        /// <summary>
        /// Creates a new Employee object with a first and last name
        /// </summary>
        /// <param name="firstname"></param>
        /// <param name="lastName"></param>
        /// <returns>
        /// Created Employee object
        /// </returns>
        public Employee CreateEmployee(string firstname, string lastName, int id)
        {
            //TODO: ADD DATABASE INTEGRATION

            return new Employee(firstname, lastName, id);
        }

        public Employee RemoveEmployee(Employee employee)
        {
            //TODO
            //NEEDS DATABASE
            foreach (var shift in employee.Shifts)
            {
                ShiftService.setEmployee(shift.ShiftId, -1); //Fjerner employee reference fra alle shifts
			}
			return null;
        }

        public bool IsOver18(Employee employee)
        {
            if (employee.birthday == null)
            {
                throw new ArgumentNullException("Employee birthday is not set");
            }    
            else 
            {
                return employee.birthday.Value.AddYears(18) <= DateOnly.FromDateTime(DateTime.Now);
			}
        }

        /// <summary>
        /// Creates a new Qualification that can be added to any Employee
        /// </summary>
        /// <param name="name"></param>
        /// <param name="description"></param>
        /// <returns>
        /// Created Qualification object
        /// </returns>
        public Qualification CreateQualification(string name, string description)
        {

            return new Qualification(name, description);
        }

        public Qualification RemoveQualification(Qualification Qualification)
        {
            //TODO
            //NEEDS DATABASE
            return null;
        }

        /// <summary>
        /// Creates a new Role object that can be added to any Employee
        /// </summary>
        /// <param name="name"></param>
        /// <param name="description"></param>
        /// <returns>
        /// Created Role object
        /// </returns>
        public Role CreateRole(string name, string description)
        {

            return new Role(name, description);
        }

        public Role RemoveRole(Role role)
        {
            //TODO
            //NEEDS DATABASE
            return null;
        }

        /// <summary>
        /// Adds existing Qualification to Employee
        /// </summary>
        /// <param name="employee"></param>
        /// <param name="qualification"></param>
        public void AddQualificationToEmployee(Employee employee, Qualification qualification)
        {
            employee.Qualifications.Add(qualification);
        }

        /// <summary>
        /// Removes Qualification from Employee
        /// </summary>
        /// <param name="employee"></param>
        /// <param name="qualification"></param>
        /// <returns>
        /// Removed Qualification
        /// </returns>
        public Qualification RemoveQualificationFromEmployee(Employee employee, Qualification qualification)
        {
            employee.Qualifications.Remove(qualification);

            return qualification;
        }

        public void AddRoleToEmployee(Employee employee, Role role)
        {
            employee.Roles.Add(role);
        }

        public Role RemoveRoleFromEmployee(Employee employee, Role role)
        {
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
                    ShiftService.setEmployee(shift.ShiftId, employeeId);
			    }
				//TODO opdater employee i database
			}
		}

		public void removeShiftFromEmployee(int employeeId, int shiftId)
		{
			Employee employee = null; //TODO: koble til database for at finde employee baseret på id
			Shift shift = null; //TODO: koble til database for at finde shift baseret på id
            if (employee == null || shift == null)
            {
                throw new ArgumentNullException("Employee or Shift not found");
            }
            else
            {
                employee.Shifts.Remove(shift);

                //Fjerner hos modparten
                if (shift.Employee == employee)
                {
                    ShiftService.setEmployee(shiftId, -1); //-1 indikerer at shift ikke længere har en employee
				}

				//TODO opdater employee i database
			}
		}

		public List<Shift> getFutureShiftsForEmployee(int employeeId)
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

		public double getTotalHoursForMonth(int employeeId, int month, int year)
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
