using SportCenter.Api.Models;

namespace SportCenter.Api.Services;

public class SupabaseEmployeeRepository : IEmployeeRepository
{
    private readonly Supabase.Client _supabase;

    public SupabaseEmployeeRepository(Supabase.Client supabase)
    {
        _supabase = supabase;
    }

    public async Task SetSessionAsync(string accessToken)
    {
        await _supabase.Auth.SetSession(accessToken, "refresh-token-not-needed");
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
        var result = await _supabase.From<Employee>()
            .Where(x => x.EmployeeId == employeeId)
            .Get();

        return result.Models.FirstOrDefault();
    }

    public async Task<Employee?> GetEmployeeByEmailAsync(string email)
    {
        var result = await _supabase.From<Employee>()
            .Where(x => x.Email == email)
            .Get();

        return result.Models.FirstOrDefault();
    }

    public async Task<Employee> InsertEmployeeAsync(Employee employee)
    {
        var result = await _supabase.From<Employee>().Insert(employee);
        return result.Models.First();
    }

    public async Task UpdateEmployeeContactAsync(int employeeId, string? email, string? phone)
    {
        var updateQuery = _supabase.From<Employee>()
            .Where(x => x.EmployeeId == employeeId);

        if (email != null)
        {
            updateQuery = updateQuery.Set(x => (object)x.Email!, email);
        }

        if (phone != null)
        {
            updateQuery = updateQuery.Set(x => (object)x.Phone!, phone);
        }

        await updateQuery.Update();
    }

    public async Task DeleteEmployeeAsync(int employeeId)
    {
        await _supabase.From<Employee>()
            .Where(x => x.EmployeeId == employeeId)
            .Delete();
    }

    public async Task<Role?> GetRoleByNameAsync(string roleName)
    {
        var result = await _supabase.From<Role>()
            .Where(x => x.Name == roleName)
            .Get();

        return result.Models.FirstOrDefault();
    }

    public async Task<EmployeeRole?> GetEmployeeRoleByEmployeeIdAsync(int employeeId)
    {
        var result = await _supabase.From<EmployeeRole>()
            .Where(x => x.EmployeeId == employeeId)
            .Get();

        return result.Models.FirstOrDefault();
    }

    public async Task InsertEmployeeRoleAsync(EmployeeRole employeeRole)
    {
        await _supabase.From<EmployeeRole>().Insert(employeeRole);
    }

    public async Task UpdateEmployeeRoleAsync(int employeeId, int roleId)
    {
        await _supabase.From<EmployeeRole>()
            .Where(x => x.EmployeeId == employeeId)
            .Set(x => x.RoleId, roleId)
            .Update();
    }

    public async Task DeleteEmployeeRolesByEmployeeIdAsync(int employeeId)
    {
        await _supabase.From<EmployeeRole>()
            .Where(x => x.EmployeeId == employeeId)
            .Delete();
    }

    public async Task DeleteEmployeeQualificationsByEmployeeIdAsync(int employeeId)
    {
        await _supabase.From<EmployeeQualification>()
            .Where(x => x.EmployeeId == employeeId)
            .Delete();
    }

    public async Task<List<Shift>> GetShiftsForEmployeeAsync(int employeeId)
    {
        var result = await _supabase.From<Shift>()
            .Where(x => x.EmployeeId == employeeId)
            .Get();

        return result.Models;
    }

    public async Task<List<Shift>> GetFutureShiftsForEmployeeAsync(int employeeId, DateTime now)
    {
        var result = await _supabase.From<Shift>()
            .Where(x => x.EmployeeId == employeeId)
            .Where(x => x.StartTime > now)
            .Get();

        return result.Models;
    }

    public async Task UnlinkShiftsFromEmployeeAsync(int employeeId)
    {
        long? employeeIdForShift = employeeId;

        await _supabase.From<Shift>()
            .Where(x => x.EmployeeId == employeeIdForShift)
            .Set(x => (object)x.EmployeeId!, (long?)null)
            .Update();
    }
}
