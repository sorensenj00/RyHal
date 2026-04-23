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
}