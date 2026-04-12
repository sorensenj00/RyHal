using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
namespace SportCenter.Api.Controllers;
using SportCenter.Api.Models;
using SportCenter.Api.DTOs;
using SportCenter.Api.Services;


[ApiController]
[Route("api/[controller]")]
public class EventsController : ControllerBase
{
    private readonly EventService _service;

    public EventsController(EventService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _service.GetAllAsync());

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateEventDto dto)
    {
        var result = await _service.CreateAsync(dto);
        return Ok(result);
    }
}