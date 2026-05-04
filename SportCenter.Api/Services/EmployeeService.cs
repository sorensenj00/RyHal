using Supabase;
using SportCenter.Api.Models;
using SportCenter.Api.DTOs;

namespace SportCenter.Api.Services
{
    public class EmployeeService
    {
        private readonly Supabase.Client _supabase;
        private readonly SupabaseAuthProvisioningService _supabaseAuthProvisioningService;

        public EmployeeService(Supabase.Client supabase, SupabaseAuthProvisioningService supabaseAuthProvisioningService)
        {
            _supabase = supabase;
            _supabaseAuthProvisioningService = supabaseAuthProvisioningService;
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

            var normalizedEmail = NormalizeEmail(dto.Email);
            var existingEmployeeResponse = await _supabase.From<Employee>()
                .Where(x => x.Email == normalizedEmail)
                .Get();

            if (existingEmployeeResponse.Models.Any())
            {
                throw new InvalidOperationException($"Der findes allerede en medarbejder med emailen {normalizedEmail}.");
            }

            var normalizedAppAccess = NormalizeAppAccess(dto.AppAccess);
            var authProvisionedUser = await _supabaseAuthProvisioningService.ProvisionEmployeeAsync(
                normalizedEmail,
                dto.FirstName,
                dto.LastName,
                dto.Phone,
                normalizedAppAccess);

            var newEmployee = new Employee
            {
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                Email = normalizedEmail,
                Phone = dto.Phone,
                // Gemmes som dato uden tidspunkt, så det matcher databasekolonnen
                Birthday = dto.Birthday.Date,
                SupabaseUserId = authProvisionedUser.UserId,
                AppAccess = normalizedAppAccess
            };

            try
            {
                // Gemmer i Supabase
                var result = await _supabase.From<Employee>().Insert(newEmployee);

                return result.Models.First();
            }
            catch
            {
                try
                {
                    await _supabaseAuthProvisioningService.DeleteUserAsync(authProvisionedUser.UserId);
                }
                catch (Exception cleanupEx)
                {
                    throw new InvalidOperationException(
                        $"Medarbejderen kunne ikke gemmes, og oprydning af Supabase-login mislykkedes: {cleanupEx.Message}");
                }

                throw;
            }
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
                updateQuery = updateQuery.Set(x => (object)x.Email!, dto.Email);
                hasUpdates = true;
            }

            if (dto.FirstName != null)
            {
                updateQuery = updateQuery.Set(x => (object)x.FirstName, dto.FirstName.Trim());
                hasUpdates = true;
            }

            if (dto.LastName != null)
            {
                updateQuery = updateQuery.Set(x => (object)x.LastName, dto.LastName.Trim());
                hasUpdates = true;
            }

            if (dto.Phone != null)
            {
                updateQuery = updateQuery.Set(x => (object)x.Phone!, dto.Phone);
                hasUpdates = true;
            }

            if (dto.AppAccess != null)
            {
                var normalizedAppAccess = NormalizeAppAccess(dto.AppAccess);
                updateQuery = updateQuery.Set(x => (object)x.AppAccess!, normalizedAppAccess);
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
                        .Set(x => (object)x.EmployeeId!, (long?)null)
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

            return employee.Birthday.Value.Date.AddYears(18) <= DateTime.Now.Date;
        }

        private static string NormalizeAppAccess(string? appAccess)
        {
            var normalized = appAccess?.Trim().ToLowerInvariant();
            if (string.IsNullOrWhiteSpace(normalized))
            {
                return "employee";
            }

            if (normalized is not ("admin" or "employee"))
            {
                throw new InvalidOperationException($"Ukendt app-adgang: {appAccess}");
            }

            return normalized;
        }

        private static string NormalizeEmail(string email)
        {
            var normalized = email?.Trim().ToLowerInvariant();
            if (string.IsNullOrWhiteSpace(normalized))
            {
                throw new InvalidOperationException("Email mangler.");
            }

            return normalized;
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

            var monthStart = new DateTime(year, month, 1);
            var monthEnd = monthStart.AddMonths(1).AddDays(-1);

            return EmployeeHoursCalculator
                .CalculateTotalMinutesForEmployee(result.Models, monthStart, monthEnd) / 60.0;
        }
    }
}
