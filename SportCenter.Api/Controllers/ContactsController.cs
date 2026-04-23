using Microsoft.AspNetCore.Mvc;
using SportCenter.Api.DTOs;
using SportCenter.Api.Services;

namespace SportCenter.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ContactsController : ControllerBase
{
    private readonly ContactService _contactService;

    public ContactsController(ContactService contactService)
    {
        _contactService = contactService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var token = ReadBearerToken();
        var contacts = await _contactService.GetAllAsync(token);
        return Ok(contacts);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var token = ReadBearerToken();
        var contact = await _contactService.GetByIdAsync(id, token);
        return contact == null ? NotFound() : Ok(contact);
    }

    [HttpGet("events/{eventId:int}")]
    public async Task<IActionResult> GetForEvent(int eventId)
    {
        var token = ReadBearerToken();
        var contacts = await _contactService.GetForEventAsync(eventId, token);
        return Ok(contacts);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateContactDto dto)
    {
        try
        {
            var token = ReadBearerToken();
            var created = await _contactService.CreateAsync(dto, token);
            return Ok(created);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateContactDto dto)
    {
        try
        {
            var token = ReadBearerToken();
            var updated = await _contactService.UpdateAsync(id, dto, token);
            return updated == null ? NotFound() : Ok(updated);
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
        var deleted = await _contactService.DeleteAsync(id, token);
        return deleted ? NoContent() : NotFound();
    }

    [HttpPost("{contactId:int}/events/{eventId:int}")]
    public async Task<IActionResult> LinkToEvent(int contactId, int eventId)
    {
        try
        {
            var token = ReadBearerToken();
            await _contactService.LinkToEventAsync(contactId, eventId, token);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { Message = ex.Message });
        }
    }

    [HttpDelete("{contactId:int}/events/{eventId:int}")]
    public async Task<IActionResult> UnlinkFromEvent(int contactId, int eventId)
    {
        var token = ReadBearerToken();
        await _contactService.UnlinkFromEventAsync(contactId, eventId, token);
        return NoContent();
    }

    private string? ReadBearerToken()
    {
        var authHeader = Request.Headers["Authorization"].ToString();
        return authHeader.StartsWith("Bearer ") ? authHeader[7..] : null;
    }
}
