using Microsoft.AspNetCore.Mvc;
using SportCenter.Api.Services;

namespace SportCenter.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LocationsController : ControllerBase
{
	private readonly LocationService _locationService;

	public LocationsController(LocationService locationService)
	{
		_locationService = locationService;
	}

	[HttpGet]
	public async Task<IActionResult> GetLocations()
	{
		try
		{
			var authHeader = Request.Headers["Authorization"].ToString();
			string? token = authHeader.StartsWith("Bearer ") ? authHeader.Substring(7) : null;

			var locations = await _locationService.GetAllLocationsAsync(token);
			return Ok(locations);
		}
		catch (Exception ex)
		{
			return StatusCode(500, ex.Message);
		}
	}

	[HttpPost]
	public async Task<IActionResult> CreateLocation([FromBody] CreateLocationRequest request)
	{
		if (string.IsNullOrWhiteSpace(request?.Name))
			return BadRequest(new { message = "Lokationsnavn må ikke være tomt." });

		try
		{
			var authHeader = Request.Headers["Authorization"].ToString();
			string? token = authHeader.StartsWith("Bearer ") ? authHeader.Substring(7) : null;

			var created = await _locationService.CreateLocationAsync(request.Name.Trim(), token);
			return Ok(created);
		}
		catch (Exception ex)
		{
			return StatusCode(500, ex.Message);
		}
	}

	[HttpPut("{id}/name")]
	public async Task<IActionResult> UpdateLocationName(int id, [FromBody] UpdateLocationNameRequest request)
	{
		if (string.IsNullOrWhiteSpace(request?.Name))
			return BadRequest(new { message = "Lokationsnavn må ikke være tomt." });

		try
		{
			var authHeader = Request.Headers["Authorization"].ToString();
			string? token = authHeader.StartsWith("Bearer ") ? authHeader.Substring(7) : null;

			await _locationService.UpdateLocationNameAsync(id, request.Name.Trim(), token);
			return NoContent();
		}
		catch (Exception ex)
		{
			return StatusCode(500, ex.Message);
		}
	}

	[HttpDelete("{id}")]
	public async Task<IActionResult> DeleteLocation(int id)
	{
		try
		{
			var authHeader = Request.Headers["Authorization"].ToString();
			string? token = authHeader.StartsWith("Bearer ") ? authHeader.Substring(7) : null;

			await _locationService.DeleteLocationAsync(id, token);
			return NoContent();
		}
		catch (Exception ex)
		{
			return StatusCode(500, ex.Message);
		}
	}
}

public record CreateLocationRequest(string Name);
public record UpdateLocationNameRequest(string Name);