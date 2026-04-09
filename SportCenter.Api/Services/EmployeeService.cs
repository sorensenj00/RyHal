using Microsoft.EntityFrameworkCore.Metadata.Conventions;
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
        public Employee CreateEmployee(string firstname, string lastName)
        {
            //TODO: ADD DATABASE INTEGRATION

            return new Employee(firstname, lastName);
        }

        public Employee RemoveEmployee(Employee employee)
        {
            //TODO
            //NEEDS DATABASE

            return null;
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
    }
}
