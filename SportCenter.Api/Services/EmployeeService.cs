using SportCenter.Api.Models;
using SportCenter.Api.DTOs;

namespace SportCenter.Api.Services
{
    public class EmployeeService
    {
        private readonly IEmployeeRepository _employeeRepository;
        private readonly IEmployeeAuthProvisioningService _authProvisioningService;

        public EmployeeService(
            IEmployeeRepository employeeRepository,
            IEmployeeAuthProvisioningService authProvisioningService)
        {
            _employeeRepository = employeeRepository;
            _authProvisioningService = authProvisioningService;
        }

        public async Task<List<Employee>> GetAllEmployeesAsync(string? accessToken = null)
        {
            if (!string.IsNullOrEmpty(accessToken))
            {
                await _employeeRepository.SetSessionAsync(accessToken);
            }

            return await _employeeRepository.GetAllEmployeesAsync();
        }


        public async Task<Employee> CreateEmployeeAsync(CreateEmployeeDto dto, string? accessToken = null)
        {
            if (!string.IsNullOrEmpty(accessToken))
            {
                await _employeeRepository.SetSessionAsync(accessToken);
            }

            var normalizedEmail = NormalizeEmail(dto.Email);
            var existingEmployee = await _employeeRepository.GetEmployeeByEmailAsync(normalizedEmail);
            if (existingEmployee != null)
            {
                throw new InvalidOperationException($"Der findes allerede en medarbejder med emailen {normalizedEmail}.");
            }

            var normalizedAppAccess = NormalizeAppAccess(dto.AppAccess);
            var authProvisionedUser = await _authProvisioningService.ProvisionEmployeeAsync(
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
                Birthday = dto.Birthday.Date,
                SupabaseUserId = authProvisionedUser.ProvisioningSkipped ? null : authProvisionedUser.UserId,
                AppAccess = normalizedAppAccess
            };

            try
            {
                return await _employeeRepository.InsertEmployeeAsync(newEmployee);
            }
            catch
            {
                try
                {
                    await _authProvisioningService.DeleteUserAsync(authProvisionedUser.UserId);
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
                await _employeeRepository.SetSessionAsync(accessToken);
            }

            var existingEmployee = await _employeeRepository.GetEmployeeByIdAsync(employeeId);
            if (existingEmployee == null)
            {
                return false;
            }

            var hasUpdates = dto.Email != null || dto.Phone != null;
            if (hasUpdates)
            {
                await _employeeRepository.UpdateEmployeeContactAsync(employeeId, dto.Email, dto.Phone);
            }

            return true;
        }

        public async Task<bool> UpdateEmployeeRoleAsync(int employeeId, UpdateEmployeeRoleDto dto, string? accessToken = null)
        {
            if (!string.IsNullOrEmpty(accessToken))
            {
                await _employeeRepository.SetSessionAsync(accessToken);
            }

            var existingEmployee = await _employeeRepository.GetEmployeeByIdAsync(employeeId);
            if (existingEmployee == null)
            {
                return false;
            }

            var normalizedRoleName = dto.RoleName?.Trim() ?? string.Empty;

            if (string.IsNullOrWhiteSpace(normalizedRoleName))
            {
                await _employeeRepository.DeleteEmployeeRolesByEmployeeIdAsync(employeeId);
                return true;
            }

            var role = await _employeeRepository.GetRoleByNameAsync(normalizedRoleName);
            if (role == null)
            {
                throw new InvalidOperationException($"Rollen '{normalizedRoleName}' findes ikke i databasen.");
            }

            var existingEmployeeRole = await _employeeRepository.GetEmployeeRoleByEmployeeIdAsync(employeeId);
            if (existingEmployeeRole != null)
            {
                if (existingEmployeeRole.RoleId == role.RoleId)
                {
                    return true;
                }

                await _employeeRepository.UpdateEmployeeRoleAsync(employeeId, role.RoleId);
                return true;
            }

            await _employeeRepository.InsertEmployeeRoleAsync(new EmployeeRole
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
                await _employeeRepository.SetSessionAsync(accessToken);
            }

            var existingEmployee = await _employeeRepository.GetEmployeeByIdAsync(employeeId);
            if (existingEmployee == null)
            {
                return false;
            }

            try
            {
                // Bevar eksisterende data: afkobl vagter fra medarbejderen i stedet for at slette vagter.
                try
                {
                    await _employeeRepository.UnlinkShiftsFromEmployeeAsync(employeeId);
                }
                catch (Exception ex)
                {
                    throw new InvalidOperationException($"Could not unlink shifts for employee {employeeId}: {ex.Message}", ex);
                }

                // Fjern kun koblinger mellem medarbejder og roller.
                try
                {
                    await _employeeRepository.DeleteEmployeeRolesByEmployeeIdAsync(employeeId);
                }
                catch (Exception ex)
                {
                    throw new InvalidOperationException($"Could not unlink employee_roles for employee {employeeId}: {ex.Message}", ex);
                }

                // Fjern kun koblinger mellem medarbejder og kvalifikationer.
                try
                {
                    await _employeeRepository.DeleteEmployeeQualificationsByEmployeeIdAsync(employeeId);
                }
                catch (Exception ex)
                {
                    throw new InvalidOperationException($"Could not unlink employee_qualifications for employee {employeeId}: {ex.Message}", ex);
                }

                try
                {
                    await _employeeRepository.DeleteEmployeeAsync(employeeId);
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
            var employee = await _employeeRepository.GetEmployeeByIdAsync(employeeId);

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
            return await _employeeRepository.GetFutureShiftsForEmployeeAsync(employeeId, DateTime.Now);
        }

        public async Task<double> GetTotalHoursForMonthAsync(int employeeId, int month, int year)
        {
            var shifts = await _employeeRepository.GetShiftsForEmployeeAsync(employeeId);

            var monthStart = new DateTime(year, month, 1);
            var monthEnd = monthStart.AddMonths(1).AddDays(-1);

            return EmployeeHoursCalculator
                .CalculateTotalMinutesForEmployee(shifts, monthStart, monthEnd) / 60.0;
        }
    }
}
