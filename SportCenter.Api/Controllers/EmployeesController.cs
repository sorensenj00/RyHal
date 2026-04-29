using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json.Linq;
using SportCenter.Api.DTOs;
using SportCenter.Api.Models;
using SportCenter.Api.Services;

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
                        .ToList() ?? new List<RoleDto>(),
                    Qualifications = e.EmployeeQualifications?
                        .Where(eq => eq.Qualification != null)
                        .Select(eq => new QualificationDto { Name = eq.Qualification!.Name, Description = eq.Qualification!.Description })
                        .ToList() ?? new List<QualificationDto>()
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

    [HttpPut("{id}/role")]
    public async Task<IActionResult> UpdateEmployeeRole(int id, [FromBody] UpdateEmployeeRoleDto dto)
    {
        try
        {
            if (dto == null) return BadRequest("Rolledata mangler.");

            var authHeader = Request.Headers["Authorization"].ToString();
            string? token = authHeader.StartsWith("Bearer ") ? authHeader.Substring(7) : null;

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
        catch (Exception ex)
        {
            return StatusCode(500, $"Intern serverfejl: {ex.Message}");
        }
    }

    [HttpDelete("employee/{id}/delete")]
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

    [HttpGet("getemployee/{id}")]
    public async Task<IActionResult> GetEmployee(int id)
    {
        try
        {
            var authHeader = Request.Headers["Authorization"].ToString();
            string? token = authHeader.StartsWith("Bearer ") ? authHeader.Substring(7) : null;

            var employee = await _employeeService.GetEmployeeAsync(id, token);

            if (employee == null)
                return StatusCode(500, "employee er null");

            var toReturn = new EmployeeDto
            {
                EmployeeId = employee.EmployeeId,
                FirstName = employee.FirstName,
                LastName = employee.LastName,
                Email = employee.Email,
                Phone = employee.Phone,
                Birthday = employee.Birthday,
                Roles = employee.EmployeeRoles?
                        .Where(er => er.Role != null)
                        .Select(er => new RoleDto { Name = er.Role!.Name })
                        .ToList() ?? new List<RoleDto>(),
                Qualifications = employee.EmployeeQualifications?
                        .Where(eq => eq.Qualification != null)
                        .Select(eq => new QualificationDto { Name = eq.Qualification!.Name, Description = eq.Qualification!.Description})
                        .ToList() ?? new List<QualificationDto>()

            };
            

            return Ok(toReturn);
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
            return StatusCode(500, ex.ToString());
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetQualifications()
    {
        try
        {
            var authHeader = Request.Headers["Authorization"].ToString();
            string? token = authHeader.StartsWith("Bearer ") ? authHeader.Substring(7) : null;

            var qualifications = await _employeeService.GetAllQualificationsAsync(token);

            if (qualifications == null)
                return StatusCode(500, "qualifications er null");

            var qualificationDtos = new List<QualificationDto>();

            foreach (var q in qualifications)
            {
                qualificationDtos.Add(new QualificationDto
                {
                    QualificationId = q.QualificationID,
                    Name = q.Name,
                    Description = q.Description
                });
            }

            return Ok(qualificationDtos);
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.ToString());
        }
    }

    [HttpPost]
    public async Task<IActionResult> CreateQualification([FromBody] CreateQualificationDto qualificationDto)
    {
        try
        {
            if (qualificationDto == null) return BadRequest("Qualification data mangler.");

            var authHeader = Request.Headers["Authorization"].ToString();
            string? token = authHeader.StartsWith("Bearer ") ? authHeader.Substring(7) : null;

            var createdQualification = await _employeeService.CreateQualificationAsync(qualificationDto, token);

            return Ok(new
            {
                Message = "Qualification oprettet korrekt",
                Name = createdQualification.Name,
                Description = createdQualification.Description
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Intern serverfejl: {ex.Message}");
        }
    }

    [HttpDelete("deleteQualification/{id}")]
    public async Task<IActionResult> DeleteQualification(int id)
    {
        try
        {
            var success = await _employeeService.RemoveQualificationAsync(id);

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

    [HttpGet("getQualification/{id}")]
    public async Task<IActionResult> GetQualification(int id)
    {
        try
        {
            var authHeader = Request.Headers["Authorization"].ToString();
            string? token = authHeader.StartsWith("Bearer ") ? authHeader.Substring(7) : null;

            var qualification = await _employeeService.GetQualificationAsync(id, token);

            if (qualification == null)
                return StatusCode(500, "qualification er null");

            var toReturn = new QualificationDto
            {
                QualificationId = qualification.QualificationID,
                Name = qualification.Name,
                Description = qualification.Description
            };


            return Ok(toReturn);
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
            return StatusCode(500, ex.ToString());
        }
    }

    [HttpPut("addQualificationEmployee/{employeeId}/{qualificationId}")]
    public async Task<IActionResult> AddQualificationToEmployee(int employeeId, int qualificaitonId)
    {
        //TODO
        return null;
    }

    [HttpDelete("deleteQualificationEmployee{employeeId}/{qualificationId}")]
    public async Task<IActionResult> DeleteQualificationFromEmployee(int employeeId, int qualificationId)
    {
        //TODO
        return null;

    }
}