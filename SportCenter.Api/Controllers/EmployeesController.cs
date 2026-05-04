using Microsoft.AspNetCore.Mvc;
using SportCenter.Api.Models;
using SportCenter.Api.Services;
using SportCenter.Api.DTOs;

namespace SportCenter.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EmployeesController : ControllerBase
{
    private readonly EmployeeService _employeeService;
    private readonly AuthContextService _authContextService;

    public EmployeesController(EmployeeService employeeService, AuthContextService authContextService)
    {
        _employeeService = employeeService;
        _authContextService = authContextService;
    }

    [HttpGet]
    public async Task<IActionResult> GetEmployees()
    {
        try
        {
            var token = GetToken();
            await _authContextService.RequireAdminAsync(token);

            var employees = await _employeeService.GetAllEmployeesAsync(token);

            if (employees == null)
                return StatusCode(500, "employees er null");

            var employeeDtos = new List<EmployeeDto>();

            foreach (var e in employees)
            {
                employeeDtos.Add(new EmployeeDto
                {
                    EmployeeId = e.EmployeeId,
                    FirstName = e.FirstName,
                    LastName = e.LastName,
                    Email = e.Email,
                    Phone = e.Phone,
                    Birthday = e.Birthday.HasValue ? DateOnly.FromDateTime(e.Birthday.Value) : null,
                    AppAccess = e.AppAccess,
                    Roles = e.EmployeeRoles?
                        .Where(er => er.Role != null)
                        .Select(er => new RoleDto
                        {
                            Name = er.Role!.Name,
                            Color = string.IsNullOrWhiteSpace(er.Role.Color) ? "--color-andet" : er.Role.Color
                        })
                        .ToList() ?? new List<RoleDto>()
                });
            }

            return Ok(employeeDtos);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { Message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.ToString());
        }
    }

    [HttpPost]
    public async Task<IActionResult> CreateEmployee([FromBody] CreateEmployeeDto employeeDto)
    {
        try
        {
            if (employeeDto == null) return BadRequest("Medarbejder data mangler.");

            var token = GetToken();
            await _authContextService.RequireAdminAsync(token);

            var createdEmployee = await _employeeService.CreateEmployeeAsync(employeeDto, token);

            return Ok(new { 
                Message = "Medarbejder oprettet korrekt", 
                EmployeeId = createdEmployee.EmployeeId,
                SupabaseUserId = createdEmployee.SupabaseUserId,
                AppAccess = createdEmployee.AppAccess,
                FirstName = createdEmployee.FirstName,
                LastName = createdEmployee.LastName
            });
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("allerede", StringComparison.OrdinalIgnoreCase))
            {
                return Conflict(new { Message = ex.Message });
            }

            return BadRequest(new { Message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { Message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Intern serverfejl: {ex.Message}");
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateEmployeeContact(int id, [FromBody] UpdateEmployeeContactDto dto)
    {
        try
        {
            if (dto == null) return BadRequest("Opdateringsdata mangler.");

            var token = GetToken();
            await _authContextService.RequireAdminAsync(token);

            var success = await _employeeService.UpdateEmployeeContactAsync(id, dto, token);
            if (!success) return NotFound();

            return Ok(new
            {
                Message = "Medarbejder opdateret korrekt",
                EmployeeId = id,
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                Email = dto.Email,
                Phone = dto.Phone,
                AppAccess = dto.AppAccess
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { Message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Intern serverfejl: {ex.Message}");
        }
    }

    [HttpPut("{id}/role")]
    public async Task<IActionResult> UpdateEmployeeRole(int id, [FromBody] UpdateEmployeeRoleDto dto)
    {
        try
        {
            if (dto == null) return BadRequest("Rolledata mangler.");

            var token = GetToken();
            await _authContextService.RequireAdminAsync(token);

            var success = await _employeeService.UpdateEmployeeRoleAsync(id, dto, token);
            if (!success) return NotFound();

            return Ok(new
            {
                Message = "Medarbejderrolle opdateret korrekt",
                EmployeeId = id,
                RoleName = dto.RoleName
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { Message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Intern serverfejl: {ex.Message}");
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteEmployee(int id)
    {
        var token = GetToken();

        try
        {
            await _authContextService.RequireAdminAsync(token);
            var success = await _employeeService.RemoveEmployeeAsync(id, token);

            if (!success) return NotFound();

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new
            {
                Message = ex.Message,
                Details = ex.InnerException?.Message
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { Message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Intern serverfejl: {ex.Message}");
        }
    }

    private string? GetToken()
    {
        var authHeader = Request.Headers["Authorization"].ToString();
        return authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
            ? authHeader[7..]
            : null;
    }
}
