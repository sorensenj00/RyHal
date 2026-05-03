using Microsoft.AspNetCore.Mvc;
using SportCenter.Api.Models;
using SportCenter.Api.Services;
using SportCenter.Api.DTOs;


namespace SportCenter.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ShiftsController : ControllerBase
{
    private readonly ShiftService _shiftService;
    private readonly AuthContextService _authContextService;

    public ShiftsController(ShiftService shiftService, AuthContextService authContextService)
    {
        _shiftService = shiftService;
        _authContextService = authContextService;
    }


    // GET: api/shifts
    [HttpGet]
    public async Task<IActionResult> GetShifts()
    {
        try
        {
            var token = GetToken();

            var shifts = await _shiftService.GetAllShiftsAsync(token);

            if (shifts == null)
                return StatusCode(500, "shifts er null");

            var shiftDto = new List<ShiftDto>();

            foreach (var s in shifts)
            {
                shiftDto.Add(new ShiftDto
                {
                    ShiftId = s.ShiftId,
                    StartTime = s.StartTime,
                    EndTime = s.EndTime,
                    EmployeeId = s.EmployeeId,
                    CategoryId = s.ShiftCategoryId,
                    CategoryName = s.Category?.Name ?? "Ukendt",
                    CategoryColor = s.Category?.Color ?? "#94a3b8"
                });
            }

            return Ok(shiftDto);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Kunne ikke hente vagter.", Details = ex.Message });
        }
    }


    // PUT: api/shifts/UpdateShift/{id}
    [HttpPut("UpdateShift/{id}")]
    public async Task<IActionResult> UpdateShift(long id, [FromBody] ShiftDto shiftDto)
    {
        try
        {
            if (shiftDto == null)
            {
                return BadRequest(new { Message = "Vagtdata mangler." });
            }

            if (id != shiftDto.ShiftId)
            {
                return BadRequest(new { Message = "ID i URL matcher ikke ID i objektet." });
            }

            var token = GetToken();
            await _authContextService.RequireAdminAsync(token);

            // Kald din service for at gemme i databasen
            var success = await _shiftService.UpdateShiftAsync(shiftDto, token);

            if (!success)
                return NotFound(new { Message = $"Vagt med ID {id} blev ikke fundet." });

            return Ok(shiftDto);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { Message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Kunne ikke opdatere vagten.", Details = ex.Message });
        }
    }

    // GET: api/shifts/categories
    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories()
    {
        try
        {
            var token = GetToken();

            var categories = await _shiftService.GetAllCategoriesAsync(token);

            var categoryDtos = categories.Select(c => new ShiftCategoryDto
            {
                ShiftCategoryId = c.ShiftCategoryId,
                Name = c.Name,
                Color = c.Color
            }).ToList();

            return Ok(categoryDtos);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Kunne ikke hente vagt-kategorier.", Details = ex.Message });
        }
    }

    // POST: api/shifts
    [HttpPost]
    public async Task<IActionResult> CreateShift([FromBody] ShiftCreateDto shiftDto)
    {
        try
        {
            if (shiftDto == null)
            {
                return BadRequest(new { Message = "Vagtdata mangler." });
            }

            var token = GetToken();
            await _authContextService.RequireAdminAsync(token);

            var shifts = await _shiftService.CreateShiftAsync(shiftDto, token);

            if (shifts == null || !shifts.Any())
            {
                return StatusCode(500, new { Message = "Kunne ikke oprette vagt." });
            }

            var resultDtos = shifts.Select(shift => new ShiftDto
            {
                ShiftId = shift.ShiftId,
                StartTime = shift.StartTime,
                EndTime = shift.EndTime,
                EmployeeId = shift.EmployeeId,
                CategoryId = shift.ShiftCategoryId,
            }).ToList();

            return Ok(resultDtos);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { Message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Kunne ikke oprette vagt.", Details = ex.Message });
        }
    }


    // DELETE: api/shifts/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteShift(long id)
    {
        try
        {
            var token = GetToken();
            await _authContextService.RequireAdminAsync(token);

            var success = await _shiftService.RemoveShiftAsync(id, token);

            if (!success) return NotFound();

            return NoContent();
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { Message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Kunne ikke slette vagten.", Details = ex.Message });
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
