using Microsoft.AspNetCore.Mvc;
using SportCenter.Api.DTOs;
using SportCenter.Api.Services;

namespace SportCenter.Api.Controllers;

[ApiController]
[Route("api/employee-hours")]
public class EmployeeHoursController : ControllerBase
{
    private readonly EmployeeHoursService _employeeHoursService;
    private readonly AuthContextService _authContextService;

    public EmployeeHoursController(EmployeeHoursService employeeHoursService, AuthContextService authContextService)
    {
        _employeeHoursService = employeeHoursService;
        _authContextService = authContextService;
    }

    [HttpGet]
    public async Task<IActionResult> GetEmployeeHours([FromQuery] EmployeeHoursQueryDto? query)
    {
        try
        {
            query ??= new EmployeeHoursQueryDto();
            var authHeader = Request.Headers["Authorization"].ToString();
            string? token = authHeader.StartsWith("Bearer ") ? authHeader[7..] : null;
            var authMe = await _authContextService.GetAuthMeAsync(token);

            if (!string.Equals(authMe.AppAccess, "admin", StringComparison.OrdinalIgnoreCase))
            {
                query.EmployeeId = authMe.EmployeeId;
            }

            var overview = await _employeeHoursService.GetEmployeeHoursOverviewAsync(query, token);
            return Ok(overview);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { Message = ex.Message });
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
