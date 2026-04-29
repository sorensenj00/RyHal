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

    public ShiftsController(ShiftService shiftService)
    {
        _shiftService = shiftService;
    }


    // GET: api/shifts
    [HttpGet]
    public async Task<IActionResult> GetShifts()
    {
        try
        {
            var authHeader = Request.Headers["Authorization"].ToString();
            string? token = authHeader.StartsWith("Bearer ") ? authHeader.Substring(7) : null;

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
            return StatusCode(500, ex.ToString());
        }
    }


    // PUT: api/shifts/UpdateShift/{id}
    [HttpPut("UpdateShift/{id}")]
    public async Task<IActionResult> UpdateShift(long id, [FromBody] ShiftDto shiftDto)
    {
        try
        {
            if (id != shiftDto.ShiftId)
            {
                return BadRequest("ID i URL matcher ikke ID i objektet");
            }

            var authHeader = Request.Headers["Authorization"].ToString();
            string? token = authHeader.StartsWith("Bearer ") ? authHeader.Substring(7) : null;

            // Kald din service for at gemme i databasen
            var success = await _shiftService.UpdateShiftAsync(shiftDto, token);

            if (!success)
                return NotFound($"Vagt med ID {id} blev ikke fundet");

            return Ok(shiftDto);
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }

    // GET: api/shifts/categories
    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories()
    {
        try
        {
            var authHeader = Request.Headers["Authorization"].ToString();
            string? token = authHeader.StartsWith("Bearer ") ? authHeader.Substring(7) : null;

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
            return StatusCode(500, ex.Message);
        }
    }

    // POST: api/shifts
    [HttpPost]
    public async Task<IActionResult> CreateShift([FromBody] ShiftCreateDto shiftDto)
    {
        try
        {
            var authHeader = Request.Headers["Authorization"].ToString();
            string? token = authHeader.StartsWith("Bearer ") ? authHeader.Substring(7) : null;

            var shifts = await _shiftService.CreateShiftAsync(shiftDto, token);

            if (shifts == null || !shifts.Any()) return StatusCode(500, "Kunne ikke oprette vagt");

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
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }


    // DELETE: api/shifts/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteShift(long id)
    {
        try
        {
            var authHeader = Request.Headers["Authorization"].ToString();
            string? token = authHeader.StartsWith("Bearer ") ? authHeader.Substring(7) : null;

            var success = await _shiftService.RemoveShiftAsync(id, token);

            if (!success) return NotFound();

            return NoContent();
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }






}
