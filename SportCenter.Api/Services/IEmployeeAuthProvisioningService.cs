namespace SportCenter.Api.Services;

public interface IEmployeeAuthProvisioningService
{
    Task<ProvisionedSupabaseUser> ProvisionEmployeeAsync(
        string email,
        string firstName,
        string lastName,
        string phone,
        string appAccess);

    Task DeleteUserAsync(string supabaseUserId);
}

public sealed record ProvisionedSupabaseUser(
    string UserId,
    string Email,
    bool InvitationSent,
    bool ProvisioningSkipped = false);
