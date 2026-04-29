namespace SportCenter.Api.DTOs;

public class AuthMeDto
{
    public string SupabaseUserId { get; set; } = string.Empty;
    public int EmployeeId { get; set; }
    public string AppAccess { get; set; } = string.Empty;
    public string RedirectTarget { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Email { get; set; }
}
