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
        var result = await _service.CreateAsync(dto);
        return Ok(result);
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