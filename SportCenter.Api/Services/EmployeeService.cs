using SportCenter.Api.DTOs;
using SportCenter.Api.Models;

namespace SportCenter.Api.Services
{
    public class EmployeeService
    {
        private readonly IEmployeeRepository _employeeRepository;

        public EmployeeService(IEmployeeRepository employeeRepository)
        {
            _employeeRepository = employeeRepository;
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

            var newEmployee = new Employee
            {
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                Email = dto.Email,
                Phone = dto.Phone,
                Birthday = DateOnly.FromDateTime(dto.Birthday)
            };

            return await _employeeRepository.InsertEmployeeAsync(newEmployee);
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
                try
                {
                    await _employeeRepository.UnlinkShiftsFromEmployeeAsync(employeeId);
                }
                catch (Exception ex)
                {
                    throw new InvalidOperationException($"Could not unlink shifts for employee {employeeId}: {ex.Message}", ex);
                }

                try
                {
                    await _employeeRepository.DeleteEmployeeRolesByEmployeeIdAsync(employeeId);
                }
                catch (Exception ex)
                {
                    throw new InvalidOperationException($"Could not unlink employee_roles for employee {employeeId}: {ex.Message}", ex);
                }

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
            catch (Exception ex) when (ex is not InvalidOperationException)
            {
                throw new InvalidOperationException("Employee could not be deleted due to related data or permission rules.", ex);
            }
        }

        public async Task<Employee> GetEmployeeAsync(int employeeId, string? accessToken = null)
        {
            if (!string.IsNullOrEmpty(accessToken))
            {
                await _employeeRepository.SetSessionAsync(accessToken);
            }

            var result = await _employeeRepository.GetEmployeeByIdAsync(employeeId);
            if (result == null)
            {
                throw new InvalidOperationException("Employee not found");
            }

            return result;
        }

        public async Task<bool> IsOver18Async(int employeeId)
        {
            var employee = await _employeeRepository.GetEmployeeByIdAsync(employeeId);
            if (employee?.Birthday == null)
            {
                throw new ArgumentNullException("Employee birthday is not set");
            }

            return employee.Birthday.Value.AddYears(18) <= DateOnly.FromDateTime(DateTime.Now);
        }

        public async Task<List<Qualification>> GetAllQualificationsAsync(string? accessToken = null)
        {
            if (!string.IsNullOrEmpty(accessToken))
            {
                await _employeeRepository.SetSessionAsync(accessToken);
            }

            return await _employeeRepository.GetAllQualificationsAsync();
        }

        public async Task<Qualification> CreateQualificationAsync(CreateQualificationDto dto, string? accessToken = null)
        {
            if (!string.IsNullOrEmpty(accessToken))
            {
                await _employeeRepository.SetSessionAsync(accessToken);
            }

            var newQualification = new Qualification
            {
                Name = dto.Name,
                Description = dto.Description
            };

            return await _employeeRepository.InsertQualificationAsync(newQualification);
        }

        public async Task<bool> RemoveQualificationAsync(int qualificationId, string? accessToken = null)
        {
            if (!string.IsNullOrEmpty(accessToken))
            {
                await _employeeRepository.SetSessionAsync(accessToken);
            }

            var existingQualification = await _employeeRepository.GetQualificationByIdAsync(qualificationId);
            if (existingQualification == null)
            {
                return false;
            }

            try
            {
                try
                {
                    await _employeeRepository.DeleteEmployeeQualificationsByQualificationIdAsync(qualificationId);
                }
                catch (Exception ex)
                {
                    throw new InvalidOperationException($"Could not unlink employee_qualification for qualification {qualificationId}: {ex.Message}", ex);
                }

                try
                {
                    await _employeeRepository.DeleteQualificationAsync(qualificationId);
                }
                catch (Exception ex)
                {
                    throw new InvalidOperationException($"Could not delete Qualification {qualificationId}: {ex.Message}", ex);
                }

                return true;
            }
            catch (Exception ex) when (ex is not InvalidOperationException)
            {
                throw new InvalidOperationException("Qualification could not be deleted due to related data or permission rules.", ex);
            }
        }

        public async Task<Qualification> GetQualificationAsync(int qualificationId, string? accessToken = null)
        {
            if (!string.IsNullOrEmpty(accessToken))
            {
                await _employeeRepository.SetSessionAsync(accessToken);
            }

            var result = await _employeeRepository.GetQualificationByIdAsync(qualificationId);
            if (result == null)
            {
                throw new InvalidOperationException("Qualification not found");
            }

            return result;
        }

        public async Task<EmployeeQualification> AddQualificationToEmployeeAsync(int employeeId, int qualificationId, string? accessToken = null)
        {
            if (!string.IsNullOrEmpty(accessToken))
            {
                await _employeeRepository.SetSessionAsync(accessToken);
            }

            var newEmployeeQualification = new EmployeeQualification
            {
                QualificationId = qualificationId,
                EmployeeId = employeeId
            };

            return await _employeeRepository.InsertEmployeeQualificationAsync(newEmployeeQualification);
        }

        public async Task<bool> RemoveQualificationFromEmployeeAsync(int employeeId, int qualificationId, string? accessToken = null)
        {
            if (!string.IsNullOrEmpty(accessToken))
            {
                await _employeeRepository.SetSessionAsync(accessToken);
            }

            var existingQualification = await _employeeRepository.GetQualificationByIdAsync(qualificationId);
            if (existingQualification == null)
            {
                return false;
            }

            try
            {
                await _employeeRepository.DeleteEmployeeQualificationAsync(employeeId, qualificationId);
                return true;
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException($"Could not unlink employee_qualification for qualification {qualificationId}: {ex.Message}", ex);
            }
        }

        public async Task<List<Role>> GetAllRolesAsync(string? accessToken = null)
        {
            if (!string.IsNullOrEmpty(accessToken))
            {
                await _employeeRepository.SetSessionAsync(accessToken);
            }

            return await _employeeRepository.GetAllRolesAsync();
        }

        public async Task<Role> CreateRoleAsync(CreateRoleDto dto, string? accessToken = null)
        {
            if (!string.IsNullOrEmpty(accessToken))
            {
                await _employeeRepository.SetSessionAsync(accessToken);
            }

            var newRole = new Role
            {
                Name = dto.Name
            };

            return await _employeeRepository.InsertRoleAsync(newRole);
        }

        public async Task<bool> RemoveRoleAsync(int roleId, string? accessToken = null)
        {
            if (!string.IsNullOrEmpty(accessToken))
            {
                await _employeeRepository.SetSessionAsync(accessToken);
            }

            var existingRole = await _employeeRepository.GetRoleByIdAsync(roleId);
            if (existingRole == null)
            {
                return false;
            }

            try
            {
                try
                {
                    await _employeeRepository.DeleteEmployeeRolesByRoleIdAsync(roleId);
                }
                catch (Exception ex)
                {
                    throw new InvalidOperationException($"Could not unlink employee_role for Role {roleId}: {ex.Message}", ex);
                }

                try
                {
                    await _employeeRepository.DeleteRoleAsync(roleId);
                }
                catch (Exception ex)
                {
                    throw new InvalidOperationException($"Could not delete Role {roleId}: {ex.Message}", ex);
                }

                return true;
            }
            catch (Exception ex) when (ex is not InvalidOperationException)
            {
                throw new InvalidOperationException("Role could not be deleted due to related data or permission rules.", ex);
            }
        }

        public async Task<Role> GetRoleAsync(int roleId, string? accessToken = null)
        {
            if (!string.IsNullOrEmpty(accessToken))
            {
                await _employeeRepository.SetSessionAsync(accessToken);
            }

            var result = await _employeeRepository.GetRoleByIdAsync(roleId);
            if (result == null)
            {
                throw new InvalidOperationException("Role not found");
            }

            return result;
        }

        public async Task<EmployeeRole> AddRoleToEmployeeAsync(int employeeId, int roleId, string? accessToken = null)
        {
            if (!string.IsNullOrEmpty(accessToken))
            {
                await _employeeRepository.SetSessionAsync(accessToken);
            }

            var newEmployeeRole = new EmployeeRole
            {
                RoleId = roleId,
                EmployeeId = employeeId
            };

            return await _employeeRepository.InsertEmployeeRoleAsync(newEmployeeRole);
        }

        public async Task<bool> RemoveRoleFromEmployeeAsync(int employeeId, int roleId, string? accessToken = null)
        {
            if (!string.IsNullOrEmpty(accessToken))
            {
                await _employeeRepository.SetSessionAsync(accessToken);
            }

            var existingRole = await _employeeRepository.GetRoleByIdAsync(roleId);
            if (existingRole == null)
            {
                return false;
            }

            try
            {
                await _employeeRepository.DeleteEmployeeRoleAsync(employeeId, roleId);
                return true;
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException($"Could not unlink employee_role for Role {roleId}: {ex.Message}", ex);
            }
        }

        public async Task<List<Shift>> GetFutureShiftsForEmployeeAsync(int employeeId)
        {
            return await _employeeRepository.GetFutureShiftsForEmployeeAsync(employeeId, DateTime.Now);
        }

        public async Task<double> GetTotalHoursForMonthAsync(int employeeId, int month, int year)
        {
            var shifts = await _employeeRepository.GetShiftsForEmployeeAsync(employeeId);

            var shiftsInMonth = shifts
                .Where(s => s.StartTime.Month == month && s.StartTime.Year == year)
                .ToList();

            return shiftsInMonth.Sum(s => (s.EndTime - s.StartTime).TotalHours);
        }
    }
}
