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

    private static EventResponseDto ToResponseDto(Event evt)
    {
        var locations = (evt.EventLocations ?? new List<EventLocation>())
            .Select(loc => new LocationBookingDto(loc.LocationId, loc.StartTime, loc.EndTime, loc.Date, loc.Location?.Name))
            .ToList();

        return new EventResponseDto(
            evt.Id,
            evt.Name,
            evt.Description ?? string.Empty,
            evt.StartTime,
            evt.EndTime,
            evt.Date,
            evt.Category.ToString(),
            evt.SeriesId,
            evt.IsModifiedFromSeries ?? false,
            evt.IsCancelled ?? false,
            evt.IsDraft ?? false,
            locations,
            evt.TemplateId,
            evt.AssociationId
        );
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var authHeader = Request.Headers["Authorization"].ToString();
        string? token = authHeader.StartsWith("Bearer ") ? authHeader.Substring(7) : null;

        var events = await _service.GetAllAsync(token);
        return Ok(events.Select(ToResponseDto).ToList());
    }

    [HttpGet("drafts")]
    public async Task<IActionResult> GetDrafts()
    {
        var authHeader = Request.Headers["Authorization"].ToString();
        string? token = authHeader.StartsWith("Bearer ") ? authHeader.Substring(7) : null;

        var events = await _service.GetDraftEventsAsync(token);
        return Ok(events.Select(ToResponseDto).ToList());
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var authHeader = Request.Headers["Authorization"].ToString();
        string? token = authHeader.StartsWith("Bearer ") ? authHeader.Substring(7) : null;

        var evt = await _service.GetByIdAsync(id, token);
        if (evt == null) return NotFound($"Event med id {id} blev ikke fundet.");
        return Ok(ToResponseDto(evt));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateEventDto dto)
    {
        var authHeader = Request.Headers["Authorization"].ToString();
        string? token = authHeader.StartsWith("Bearer ") ? authHeader.Substring(7) : null;

        var result = await _service.CreateAsync(dto, token);
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

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] CreateEventDto dto)
    {
        try
        {
            var authHeader = Request.Headers["Authorization"].ToString();
            string? token = authHeader.StartsWith("Bearer ") ? authHeader.Substring(7) : null;

            var result = await _service.UpdateAsync(id, dto, token);
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

    [HttpPut("series/{seriesId}")]
    public async Task<IActionResult> UpdateSeries(int seriesId, [FromBody] CreateEventDto dto)
    {
        try
        {
            var authHeader = Request.Headers["Authorization"].ToString();
            string? token = authHeader.StartsWith("Bearer ") ? authHeader.Substring(7) : null;

            var results = await _service.UpdateSeriesAsync(seriesId, dto, token);
            return Ok(results);
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