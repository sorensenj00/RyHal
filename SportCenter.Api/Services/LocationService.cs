using Supabase;
using SportCenter.Api.Models;

namespace SportCenter.Api.Services;

public class LocationService
{
    private readonly Client _supabase;

    public LocationService(Client supabase)
    {
        _supabase = supabase;
    }

    public async Task<List<object>> GetAllLocationsAsync(string? accessToken = null)
    {
        if (!string.IsNullOrEmpty(accessToken))
        {
            await _supabase.Auth.SetSession(accessToken, "refresh-token-not-needed");
        }

        var result = await _supabase.From<Location>().Get();

        return result.Models
            .Select(l => (object)new { id = l.Id, name = l.Name })
            .ToList();
    }
}
