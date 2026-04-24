using SportCenter.Api.Models;

namespace SportCenter.Api.Services;

public interface IEmployeeRepository
{
    Task SetSessionAsync(string accessToken);
    Task<List<Employee>> GetAllEmployeesAsync();
    Task<Employee?> GetEmployeeByIdAsync(int employeeId);
    Task<Employee> InsertEmployeeAsync(Employee employee);
    Task UpdateEmployeeContactAsync(int employeeId, string? email, string? phone);

    Task<Role?> GetRoleByNameAsync(string roleName);
    Task<Role?> GetRoleByIdAsync(int roleId);
    Task<List<Role>> GetAllRolesAsync();
    Task<Role> InsertRoleAsync(Role role);
    Task DeleteRoleAsync(int roleId);

    Task<EmployeeRole?> GetEmployeeRoleByEmployeeIdAsync(int employeeId);
    Task<EmployeeRole> InsertEmployeeRoleAsync(EmployeeRole employeeRole);
    Task UpdateEmployeeRoleAsync(int employeeId, int roleId);
    Task DeleteEmployeeRoleAsync(int employeeId, int roleId);
    Task DeleteEmployeeRolesByEmployeeIdAsync(int employeeId);
    Task DeleteEmployeeRolesByRoleIdAsync(int roleId);

    Task<List<Qualification>> GetAllQualificationsAsync();
    Task<Qualification?> GetQualificationByIdAsync(int qualificationId);
    Task<Qualification> InsertQualificationAsync(Qualification qualification);
    Task DeleteQualificationAsync(int qualificationId);
    Task<EmployeeQualification> InsertEmployeeQualificationAsync(EmployeeQualification employeeQualification);
    Task DeleteEmployeeQualificationAsync(int employeeId, int qualificationId);
    Task DeleteEmployeeQualificationsByEmployeeIdAsync(int employeeId);
    Task DeleteEmployeeQualificationsByQualificationIdAsync(int qualificationId);

    Task<List<Shift>> GetShiftsForEmployeeAsync(int employeeId);
    Task<List<Shift>> GetFutureShiftsForEmployeeAsync(int employeeId, DateTime now);
    Task UnlinkShiftsFromEmployeeAsync(int employeeId);

    Task DeleteEmployeeAsync(int employeeId);
}
