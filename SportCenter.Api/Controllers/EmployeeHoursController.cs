using Microsoft.AspNetCore.Mvc;
using SportCenter.Api.DTOs;
using SportCenter.Api.Services;

namespace SportCenter.Api.Controllers;

[ApiController]
[Route("api/employee-hours")]
public class EmployeeHoursController : ControllerBase
{
    private readonly EmployeeHoursService _employeeHoursService;

    public EmployeeHoursController(EmployeeHoursService employeeHoursService)
    {
        _employeeHoursService = employeeHoursService;
    }

    [HttpGet]
    public async Task<IActionResult> GetEmployeeHours([FromQuery] EmployeeHoursQueryDto? query)
    {
        try
        {
            query ??= new EmployeeHoursQueryDto();
            var authHeader = Request.Headers["Authorization"].ToString();
            string? token = authHeader.StartsWith("Bearer ") ? authHeader[7..] : null;

            var overview = await _employeeHoursService.GetEmployeeHoursOverviewAsync(query, token);
            return Ok(overview);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = ex.Message });
        }
    }
}
