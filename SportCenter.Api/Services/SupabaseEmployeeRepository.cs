using SportCenter.Api.Models;
using Supabase;

namespace SportCenter.Api.Services;

public class SupabaseEmployeeRepository : IEmployeeRepository
{
    private readonly Client _supabase;

    public SupabaseEmployeeRepository(Client supabase)
    {
        _supabase = supabase;
    }

    public Task SetSessionAsync(string accessToken)
    {
        return _supabase.Auth.SetSession(accessToken, "refresh-token-not-needed");
    }

    public async Task<List<Employee>> GetAllEmployeesAsync()
    {
        var result = await _supabase
            .From<Employee>()
            .Select("*")
            .Get();

        return result.Models;
    }

    public async Task<Employee?> GetEmployeeByIdAsync(int employeeId)
    {
        var response = await _supabase
            .From<Employee>()
            .Select("*")
            .Where(x => x.EmployeeId == employeeId)
            .Get();

        return response.Models.FirstOrDefault();
    }

    public async Task<Employee> InsertEmployeeAsync(Employee employee)
    {
        var result = await _supabase.From<Employee>().Insert(employee);
        return result.Models.First();
    }

    public Task UpdateEmployeeContactAsync(int employeeId, string? email, string? phone)
    {
        var updateQuery = _supabase
            .From<Employee>()
            .Where(x => x.EmployeeId == employeeId);

        if (email != null)
        {
            updateQuery = updateQuery.Set(x => x.Email, email);
        }

        if (phone != null)
        {
            updateQuery = updateQuery.Set(x => x.Phone, phone);
        }

        return updateQuery.Update();
    }

    public async Task<Role?> GetRoleByNameAsync(string roleName)
    {
        var response = await _supabase
            .From<Role>()
            .Where(x => x.Name == roleName)
            .Get();

        return response.Models.FirstOrDefault();
    }

    public async Task<Role?> GetRoleByIdAsync(int roleId)
    {
        var response = await _supabase
            .From<Role>()
            .Where(x => x.RoleId == roleId)
            .Get();

        return response.Models.FirstOrDefault();
    }

    public async Task<List<Role>> GetAllRolesAsync()
    {
        var result = await _supabase.From<Role>().Get();
        return result.Models;
    }

    public async Task<Role> InsertRoleAsync(Role role)
    {
        var result = await _supabase.From<Role>().Insert(role);
        return result.Models.First();
    }

    public Task DeleteRoleAsync(int roleId)
    {
        return _supabase
            .From<Role>()
            .Where(x => x.RoleId == roleId)
            .Delete();
    }

    public async Task<EmployeeRole?> GetEmployeeRoleByEmployeeIdAsync(int employeeId)
    {
        var response = await _supabase
            .From<EmployeeRole>()
            .Where(x => x.EmployeeId == employeeId)
            .Get();

        return response.Models.FirstOrDefault();
    }

    public async Task<EmployeeRole> InsertEmployeeRoleAsync(EmployeeRole employeeRole)
    {
        var result = await _supabase.From<EmployeeRole>().Insert(employeeRole);
        return result.Models.First();
    }

    public Task UpdateEmployeeRoleAsync(int employeeId, int roleId)
    {
        return _supabase
            .From<EmployeeRole>()
            .Where(x => x.EmployeeId == employeeId)
            .Set(x => x.RoleId, roleId)
            .Update();
    }

    public Task DeleteEmployeeRoleAsync(int employeeId, int roleId)
    {
        return _supabase
            .From<EmployeeRole>()
            .Where(x => x.EmployeeId == employeeId && x.RoleId == roleId)
            .Delete();
    }

    public Task DeleteEmployeeRolesByEmployeeIdAsync(int employeeId)
    {
        return _supabase
            .From<EmployeeRole>()
            .Where(x => x.EmployeeId == employeeId)
            .Delete();
    }

    public Task DeleteEmployeeRolesByRoleIdAsync(int roleId)
    {
        return _supabase
            .From<EmployeeRole>()
            .Where(x => x.RoleId == roleId)
            .Delete();
    }

    public async Task<List<Qualification>> GetAllQualificationsAsync()
    {
        var result = await _supabase.From<Qualification>().Get();
        return result.Models;
    }

    public async Task<Qualification?> GetQualificationByIdAsync(int qualificationId)
    {
        var response = await _supabase
            .From<Qualification>()
            .Where(x => x.QualificationID == qualificationId)
            .Get();

        return response.Models.FirstOrDefault();
    }

    public async Task<Qualification> InsertQualificationAsync(Qualification qualification)
    {
        var result = await _supabase.From<Qualification>().Insert(qualification);
        return result.Models.First();
    }

    public Task DeleteQualificationAsync(int qualificationId)
    {
        return _supabase
            .From<Qualification>()
            .Where(x => x.QualificationID == qualificationId)
            .Delete();
    }

    public async Task<EmployeeQualification> InsertEmployeeQualificationAsync(EmployeeQualification employeeQualification)
    {
        var result = await _supabase.From<EmployeeQualification>().Insert(employeeQualification);
        return result.Models.First();
    }

    public Task DeleteEmployeeQualificationAsync(int employeeId, int qualificationId)
    {
        return _supabase
            .From<EmployeeQualification>()
            .Where(x => x.EmployeeId == employeeId && x.QualificationId == qualificationId)
            .Delete();
    }

    public Task DeleteEmployeeQualificationsByEmployeeIdAsync(int employeeId)
    {
        return _supabase
            .From<EmployeeQualification>()
            .Where(x => x.EmployeeId == employeeId)
            .Delete();
    }

    public Task DeleteEmployeeQualificationsByQualificationIdAsync(int qualificationId)
    {
        return _supabase
            .From<EmployeeQualification>()
            .Where(x => x.QualificationId == qualificationId)
            .Delete();
    }

    public async Task<List<Shift>> GetShiftsForEmployeeAsync(int employeeId)
    {
        var result = await _supabase
            .From<Shift>()
            .Where(x => x.EmployeeId == employeeId)
            .Get();

        return result.Models;
    }

    public async Task<List<Shift>> GetFutureShiftsForEmployeeAsync(int employeeId, DateTime now)
    {
        var result = await _supabase
            .From<Shift>()
            .Where(x => x.EmployeeId == employeeId)
            .Where(x => x.StartTime > now)
            .Get();

        return result.Models;
    }

    public Task UnlinkShiftsFromEmployeeAsync(int employeeId)
    {
        long? employeeIdForShift = employeeId;

        return _supabase
            .From<Shift>()
            .Where(x => x.EmployeeId == employeeIdForShift)
            .Set(x => x.EmployeeId, (long?)null)
            .Update();
    }

    public Task DeleteEmployeeAsync(int employeeId)
    {
        return _supabase
            .From<Employee>()
            .Where(x => x.EmployeeId == employeeId)
            .Delete();
    }
}
