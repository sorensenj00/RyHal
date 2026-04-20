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

    public EmployeesController(EmployeeService employeeService)
    {
        _employeeService = employeeService;
    }

    [HttpGet]
    public async Task<IActionResult> GetEmployees()
    {
        try
        {
            var authHeader = Request.Headers["Authorization"].ToString();
            string? token = authHeader.StartsWith("Bearer ") ? authHeader.Substring(7) : null;

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
                    Birthday = e.Birthday,
                    Roles = e.EmployeeRoles?
                        .Where(er => er.Role != null)
                        .Select(er => new RoleDto { Name = er.Role!.Name })
                        .ToList() ?? new List<RoleDto>()
                });
            }

            return Ok(employeeDtos);
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

            var authHeader = Request.Headers["Authorization"].ToString();
            string? token = authHeader.StartsWith("Bearer ") ? authHeader.Substring(7) : null;

            var createdEmployee = await _employeeService.CreateEmployeeAsync(employeeDto, token);

            return Ok(new { 
                Message = "Medarbejder oprettet korrekt", 
                EmployeeId = createdEmployee.EmployeeId,
                FirstName = createdEmployee.FirstName,
                LastName = createdEmployee.LastName
            });
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

            var authHeader = Request.Headers["Authorization"].ToString();
            string? token = authHeader.StartsWith("Bearer ") ? authHeader.Substring(7) : null;

            var success = await _employeeService.UpdateEmployeeContactAsync(id, dto, token);
            if (!success) return NotFound();

            return Ok(new
            {
                Message = "Medarbejder opdateret korrekt",
                EmployeeId = id,
                Email = dto.Email,
                Phone = dto.Phone
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Intern serverfejl: {ex.Message}");
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteEmployee(int id)
    {
        var authHeader = Request.Headers["Authorization"].ToString();
        string? token = authHeader.StartsWith("Bearer ") ? authHeader.Substring(7) : null;

        try
        {
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
        catch (Exception ex)
        {
            return StatusCode(500, $"Intern serverfejl: {ex.Message}");
        }
    }
}