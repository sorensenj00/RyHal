using SportCenter.Api.Models;

namespace SportCenter.Api.Services;

public interface IEmployeeRepository
{
    Task SetSessionAsync(string accessToken);
    Task<List<Employee>> GetAllEmployeesAsync();
    Task<Employee?> GetEmployeeByIdAsync(int employeeId);
    Task<Employee?> GetEmployeeByEmailAsync(string email);
    Task<Employee> InsertEmployeeAsync(Employee employee);
    Task UpdateEmployeeContactAsync(int employeeId, string? email, string? phone);
    Task DeleteEmployeeAsync(int employeeId);

    Task<Role?> GetRoleByNameAsync(string roleName);
    Task<EmployeeRole?> GetEmployeeRoleByEmployeeIdAsync(int employeeId);
    Task InsertEmployeeRoleAsync(EmployeeRole employeeRole);
    Task UpdateEmployeeRoleAsync(int employeeId, int roleId);
    Task DeleteEmployeeRolesByEmployeeIdAsync(int employeeId);
    Task DeleteEmployeeQualificationsByEmployeeIdAsync(int employeeId);

    Task<List<Shift>> GetShiftsForEmployeeAsync(int employeeId);
    Task<List<Shift>> GetFutureShiftsForEmployeeAsync(int employeeId, DateTime now);
    Task UnlinkShiftsFromEmployeeAsync(int employeeId);
}
