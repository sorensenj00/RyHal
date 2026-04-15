using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using SportCenter.Api.Models;
using SportCenter.Api.DTOs;
using SportCenter.Api.Services;

namespace SportCenter.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EventsController : ControllerBase
{
    private readonly EventService _service;

    public EventsController(EventService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _service.GetAllAsync());

    [HttpGet("drafts")]
    public async Task<IActionResult> GetDrafts() => Ok(await _service.GetDraftEventsAsync());

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateEventDto dto)
    {
        try
        {
            Console.WriteLine($"[API] Creating event: Name={dto.Name}, Category={dto.Category}, IsDraft={dto.IsDraft}, LocationsCount={dto.Locations?.Count}");
            var result = await _service.CreateAsync(dto);
            Console.WriteLine($"[API] Created event ID={result.Id}");
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            Console.WriteLine($"[API ERROR] NotFound: {ex.Message}");
            return NotFound(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            Console.WriteLine($"[API ERROR] InvalidOperation: {ex.Message}");
            return BadRequest(ex.Message);
        }
        catch (ArgumentException ex)
        {
            Console.WriteLine($"[API ERROR] Argument: {ex.Message}");
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[API ERROR] {ex.GetType().Name}: {ex.Message}");
            Console.WriteLine($"[API ERROR] Stack: {ex.StackTrace}");
            if (ex.InnerException != null)
            {
                Console.WriteLine($"[API INNER] {ex.InnerException.GetType().Name}: {ex.InnerException.Message}");
            }
            return StatusCode(500, new { message = "An unexpected error occurred.", detail = ex.Message, inner = ex.InnerException?.Message });
        }
    }

    [HttpPost("{id}/publish")]
    public async Task<IActionResult> PublishDraft(int id, [FromBody] CreateEventDto updateDto)
    {
        try
        {
            var result = await _service.PublishDraftAsync(id, updateDto);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
