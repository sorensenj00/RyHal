using Microsoft.AspNetCore.Mvc;
using SportCenter.Api.Services;

namespace SportCenter.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LocationsController : ControllerBase
{
	private readonly LocationService _locationService;
	private readonly AuthContextService _authContextService;

	public LocationsController(LocationService locationService, AuthContextService authContextService)
	{
		_locationService = locationService;
		_authContextService = authContextService;
	}

	[HttpGet]
	public async Task<IActionResult> GetLocations()
	{
		try
		{
			var token = GetToken();

			var locations = await _locationService.GetAllLocationsAsync(token);
			return Ok(locations);
		}
		catch (Exception ex)
		{
			return StatusCode(500, new { Message = "Kunne ikke hente lokationer.", Details = ex.Message });
		}
	}

	[HttpPost]
	public async Task<IActionResult> CreateLocation([FromBody] CreateLocationRequest request)
	{
		if (string.IsNullOrWhiteSpace(request?.Name))
			return BadRequest(new { message = "Lokationsnavn må ikke være tomt." });

		try
		{
			var token = GetToken();
			await _authContextService.RequireAdminAsync(token);

			var created = await _locationService.CreateLocationAsync(request.Name.Trim(), token);
			return Ok(created);
		}
		catch (UnauthorizedAccessException ex)
		{
			return Unauthorized(new { Message = ex.Message });
		}
		catch (Exception ex)
		{
			return StatusCode(500, new { Message = "Kunne ikke oprette lokation.", Details = ex.Message });
		}
	}

	[HttpPut("{id}/name")]
	public async Task<IActionResult> UpdateLocationName(int id, [FromBody] UpdateLocationNameRequest request)
	{
		if (string.IsNullOrWhiteSpace(request?.Name))
			return BadRequest(new { message = "Lokationsnavn må ikke være tomt." });

		try
		{
			var token = GetToken();
			await _authContextService.RequireAdminAsync(token);

			await _locationService.UpdateLocationNameAsync(id, request.Name.Trim(), token);
			return NoContent();
		}
		catch (UnauthorizedAccessException ex)
		{
			return Unauthorized(new { Message = ex.Message });
		}
		catch (Exception ex)
		{
			return StatusCode(500, new { Message = "Kunne ikke opdatere lokation.", Details = ex.Message });
		}
	}

	[HttpDelete("{id}")]
	public async Task<IActionResult> DeleteLocation(int id)
	{
		try
		{
			var token = GetToken();
			await _authContextService.RequireAdminAsync(token);

			await _locationService.DeleteLocationAsync(id, token);
			return NoContent();
		}
		catch (UnauthorizedAccessException ex)
		{
			return Unauthorized(new { Message = ex.Message });
		}
		catch (Exception ex)
		{
			return StatusCode(500, new { Message = "Kunne ikke slette lokation.", Details = ex.Message });
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

public record CreateLocationRequest(string Name);
public record UpdateLocationNameRequest(string Name);
