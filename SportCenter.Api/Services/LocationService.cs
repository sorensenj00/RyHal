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

    public async Task<object> CreateLocationAsync(string name, string? accessToken = null)
    {
        if (!string.IsNullOrEmpty(accessToken))
        {
            await _supabase.Auth.SetSession(accessToken, "refresh-token-not-needed");
        }

        var location = new Location { Name = name };
        var result = await _supabase.From<Location>().Insert(location);
        var created = result.Models.First();
        return new { id = created.Id, name = created.Name };
    }

    public async Task UpdateLocationNameAsync(int id, string name, string? accessToken = null)
    {
        if (!string.IsNullOrEmpty(accessToken))
        {
            await _supabase.Auth.SetSession(accessToken, "refresh-token-not-needed");
        }

        await _supabase.From<Location>()
            .Where(l => l.Id == id)
            .Set(l => l.Name, name)
            .Update();
    }

    public async Task DeleteLocationAsync(int id, string? accessToken = null)
    {
        if (!string.IsNullOrEmpty(accessToken))
        {
            await _supabase.Auth.SetSession(accessToken, "refresh-token-not-needed");
        }

        await _supabase.From<Location>()
            .Where(l => l.Id == id)
            .Delete();
    }
}
