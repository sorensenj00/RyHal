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

            // Midlertidigt hentes kun medarbejderfelter for at undgaa SQL-fejl i nested join.
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

        public async Task<bool> UpdateEmployeeContactAsync(int employeeId, UpdateEmployeeContactDto dto, string? accessToken = null)
        {
            if (!string.IsNullOrEmpty(accessToken))
            {
                await _supabase.Auth.SetSession(accessToken, "refresh-token-not-needed");
            }

            var existingEmployeeResponse = await _supabase.From<Employee>()
                .Where(x => x.EmployeeId == employeeId)
                .Get();

            var existingEmployee = existingEmployeeResponse.Models.FirstOrDefault();
            if (existingEmployee == null)
            {
                return false;
            }

            var updateQuery = _supabase.From<Employee>()
                .Where(x => x.EmployeeId == employeeId);

            var hasUpdates = false;

            if (dto.Email != null)
            {
                updateQuery = updateQuery.Set(x => x.Email, dto.Email);
                hasUpdates = true;
            }

            if (dto.Phone != null)
            {
                updateQuery = updateQuery.Set(x => x.Phone, dto.Phone);
                hasUpdates = true;
            }

            if (hasUpdates)
            {
                await updateQuery.Update();
            }

            return true;
        }

        public async Task<bool> UpdateEmployeeRoleAsync(int employeeId, UpdateEmployeeRoleDto dto, string? accessToken = null)
        {
            if (!string.IsNullOrEmpty(accessToken))
            {
                await _supabase.Auth.SetSession(accessToken, "refresh-token-not-needed");
            }

            var existingEmployeeResponse = await _supabase.From<Employee>()
                .Where(x => x.EmployeeId == employeeId)
                .Get();

            var existingEmployee = existingEmployeeResponse.Models.FirstOrDefault();
            if (existingEmployee == null)
            {
                return false;
            }

            var normalizedRoleName = dto.RoleName?.Trim() ?? string.Empty;

            if (string.IsNullOrWhiteSpace(normalizedRoleName))
            {
                await _supabase.From<EmployeeRole>()
                    .Where(x => x.EmployeeId == employeeId)
                    .Delete();

                return true;
            }

            var existingRoleResponse = await _supabase.From<Role>()
                .Where(x => x.Name == normalizedRoleName)
                .Get();

            var role = existingRoleResponse.Models.FirstOrDefault();

            if (role == null)
            {
                throw new InvalidOperationException($"Rollen '{normalizedRoleName}' findes ikke i databasen.");
            }

            var existingEmployeeRolesResponse = await _supabase.From<EmployeeRole>()
                .Where(x => x.EmployeeId == employeeId)
                .Get();

            var existingEmployeeRole = existingEmployeeRolesResponse.Models.FirstOrDefault();

            if (existingEmployeeRole != null)
            {
                if (existingEmployeeRole.RoleId == role.RoleId)
                {
                    return true;
                }

                await _supabase.From<EmployeeRole>()
                    .Where(x => x.EmployeeId == employeeId)
                    .Set(x => x.RoleId, role.RoleId)
                    .Update();

                return true;
            }

            await _supabase.From<EmployeeRole>()
                .Insert(new EmployeeRole
                {
                    EmployeeId = employeeId,
                    RoleId = role.RoleId
                });

            return true;
        }

        public async Task<bool> RemoveEmployeeAsync(int employeeId, string? accessToken = null)
        {
            if (!string.IsNullOrEmpty(accessToken))
            {
                await _supabase.Auth.SetSession(accessToken, "refresh-token-not-needed");
            }

            var existingEmployeeResponse = await _supabase.From<Employee>()
                .Where(x => x.EmployeeId == employeeId)
                .Get();

            var existingEmployee = existingEmployeeResponse.Models.FirstOrDefault();

            if (existingEmployee == null)
            {
                return false;
            }

            try
            {
                long? employeeIdForShift = employeeId;

                // Bevar eksisterende data: afkobl vagter fra medarbejderen i stedet for at slette vagter.
                try
                {
                    await _supabase.From<Shift>()
                        .Where(x => x.EmployeeId == employeeIdForShift)
                        .Set(x => x.EmployeeId, (long?)null)
                        .Update();
                }
                catch (Exception ex)
                {
                    throw new InvalidOperationException($"Could not unlink shifts for employee {employeeId}: {ex.Message}", ex);
                }

                // Fjern kun koblinger mellem medarbejder og roller.
                try
                {
                    await _supabase.From<EmployeeRole>()
                        .Where(x => x.EmployeeId == employeeId)
                        .Delete();
                }
                catch (Exception ex)
                {
                    throw new InvalidOperationException($"Could not unlink employee_roles for employee {employeeId}: {ex.Message}", ex);
                }

                // Fjern kun koblinger mellem medarbejder og kvalifikationer.
                try
                {
                    await _supabase.From<EmployeeQualification>()
                        .Where(x => x.EmployeeId == employeeId)
                        .Delete();
                }
                catch (Exception ex)
                {
                    throw new InvalidOperationException($"Could not unlink employee_qualifications for employee {employeeId}: {ex.Message}", ex);
                }

                try
                {
                    await _supabase.From<Employee>()
                        .Where(x => x.EmployeeId == employeeId)
                        .Delete();
                }
                catch (Exception ex)
                {
                    throw new InvalidOperationException($"Could not delete employee {employeeId}: {ex.Message}", ex);
                }

                return true;
            }
            catch (Exception ex)
            {
                if (ex is InvalidOperationException)
                {
                    throw;
                }

                throw new InvalidOperationException("Employee could not be deleted due to related data or permission rules.", ex);
            }
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
