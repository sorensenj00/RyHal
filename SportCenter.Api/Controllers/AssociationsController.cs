using Microsoft.AspNetCore.Mvc;
using SportCenter.Api.DTOs;
using SportCenter.Api.Services;

namespace SportCenter.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AssociationsController : ControllerBase
{
    private readonly AssociationService _associationService;

    public AssociationsController(AssociationService associationService)
    {
        _associationService = associationService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var token = ReadBearerToken();
        var associations = await _associationService.GetAllAsync(token);
        return Ok(associations);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var token = ReadBearerToken();
        var association = await _associationService.GetByIdAsync(id, token);

        if (association == null)
        {
            return NotFound();
        }

        return Ok(association);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAssociationDto dto)
    {
        try
        {
            var token = ReadBearerToken();
            var created = await _associationService.CreateAsync(dto, token);
            return Ok(created);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { Message = ex.Message, Details = ex.InnerException?.Message });
        }
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateAssociationDto dto)
    {
        try
        {
            var token = ReadBearerToken();
            var updated = await _associationService.UpdateAsync(id, dto, token);

            if (updated == null)
            {
                return NotFound();
            }

            return Ok(updated);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var token = ReadBearerToken();
        var deleted = await _associationService.DeleteAsync(id, token);
        return deleted ? NoContent() : NotFound();
    }

    [HttpPost("{associationId:int}/contacts/{contactId:int}")]
    public async Task<IActionResult> LinkContact(int associationId, int contactId)
    {
        try
        {
            var token = ReadBearerToken();
            await _associationService.LinkContactAsync(associationId, contactId, token);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { Message = ex.Message });
        }
    }

    [HttpDelete("{associationId:int}/contacts/{contactId:int}")]
    public async Task<IActionResult> UnlinkContact(int associationId, int contactId)
    {
        var token = ReadBearerToken();
        await _associationService.UnlinkContactAsync(associationId, contactId, token);
        return NoContent();
    }

    [HttpPost("{associationId:int}/events/{eventId:int}")]
    public async Task<IActionResult> AssignToEvent(int associationId, int eventId)
    {
        try
        {
            var token = ReadBearerToken();
            await _associationService.AssignToEventAsync(associationId, eventId, token);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { Message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { Message = ex.Message });
        }
    }

    [HttpDelete("events/{eventId:int}")]
    public async Task<IActionResult> UnassignFromEvent(int eventId)
    {
        var token = ReadBearerToken();
        await _associationService.UnassignFromEventAsync(eventId, token);
        return NoContent();
    }

    [HttpPost("{associationId:int}/series/{seriesId:int}")]
    public async Task<IActionResult> AssignToSeries(int associationId, int seriesId)
    {
        try
        {
            var token = ReadBearerToken();
            await _associationService.AssignToSeriesAsync(associationId, seriesId, token);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { Message = ex.Message });
        }
    }

    [HttpDelete("series/{seriesId:int}")]
    public async Task<IActionResult> UnassignFromSeries(int seriesId)
    {
        var token = ReadBearerToken();
        await _associationService.UnassignFromSeriesAsync(seriesId, token);
        return NoContent();
    }

    private string? ReadBearerToken()
    {
        var authHeader = Request.Headers["Authorization"].ToString();
        return authHeader.StartsWith("Bearer ") ? authHeader[7..] : null;
    }
}
