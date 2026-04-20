using Supabase;
using SportCenter.Api.Models;
using SportCenter.Api.DTOs;

namespace SportCenter.Api.Services
{
    public class EmployeeService
    {
        private readonly Supabase.Client _supabase;

        public EmployeeService(Supabase.Client supabase)
        {
            _supabase = supabase;
        }

        public async Task<List<Employee>> GetAllEmployeesAsync(string? accessToken = null)
{
            if (!string.IsNullOrEmpty(accessToken))
            {
                await _supabase.Auth.SetSession(accessToken, "refresh-token-not-needed");
            }

            // Vi bruger .Select() til at tvinge en join på tværs af dine mellemtabeller
            // Dette virker selvom [Reference] er fjernet fra modellen
            var result = await _supabase
                .From<Employee>()
                .Select("*") 
                .Get();

            return result.Models;
        }


        public async Task<Employee> CreateEmployeeAsync(CreateEmployeeDto dto, string? accessToken = null)
        {
            if (!string.IsNullOrEmpty(accessToken))
            {
                await _supabase.Auth.SetSession(accessToken, "refresh-token-not-needed");
            }

            var newEmployee = new Employee
            {
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                Email = dto.Email,
                Phone = dto.Phone,
                // Konverterer DateTime fra React til DateOnly som din model kræver
                Birthday = DateOnly.FromDateTime(dto.Birthday)
            };

            // Gemmer i Supabase
            var result = await _supabase.From<Employee>().Insert(newEmployee);
            
            return result.Models.First();
        }




        public async Task<bool> IsOver18Async(int employeeId)
        {
            var response = await _supabase.From<Employee>().Where(x => x.EmployeeId == employeeId).Get();
            var employee = response.Models.FirstOrDefault();

            if (employee?.Birthday == null) 
            {
                throw new ArgumentNullException("Employee birthday is not set");
            }

            return employee.Birthday.Value.AddYears(18) <= DateOnly.FromDateTime(DateTime.Now);
        }

        public async Task<List<Shift>> GetFutureShiftsForEmployeeAsync(int employeeId)
        {
            var result = await _supabase.From<Shift>()
                .Where(x => x.EmployeeId == employeeId)
                .Where(x => x.StartTime > DateTime.Now)
                .Get();

            return result.Models;
        }

        public async Task<double> GetTotalHoursForMonthAsync(int employeeId, int month, int year)
        {
            var result = await _supabase.From<Shift>()
                .Where(x => x.EmployeeId == employeeId)
                .Get();

            var shiftsInMonth = result.Models
                .Where(s => s.StartTime.Month == month && s.StartTime.Year == year)
                .ToList();

            return shiftsInMonth.Sum(s => (s.EndTime - s.StartTime).TotalHours);
        }
    }
}
