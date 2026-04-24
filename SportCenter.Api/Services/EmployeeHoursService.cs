using SportCenter.Api.DTOs;
using SportCenter.Api.Models;
using Supabase;

namespace SportCenter.Api.Services;

public class EmployeeHoursService
{
    private readonly Client _supabase;

    public EmployeeHoursService(Client supabase)
    {
        _supabase = supabase;
    }

    public async Task<EmployeeHoursOverviewDto> GetEmployeeHoursOverviewAsync(EmployeeHoursQueryDto? query = null, string? accessToken = null)
    {
        if (!string.IsNullOrEmpty(accessToken))
        {
            await _supabase.Auth.SetSession(accessToken, "refresh-token-not-needed");
        }

        var employeesResponse = await _supabase.From<Employee>().Select("*").Get();
        var shiftsResponse = await _supabase.From<Shift>().Select("*").Get();

        return EmployeeHoursCalculator.BuildOverview(
            employeesResponse.Models ?? new List<Employee>(),
            shiftsResponse.Models ?? new List<Shift>(),
            query
        );
    }
}
