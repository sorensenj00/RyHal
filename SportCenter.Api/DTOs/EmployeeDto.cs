namespace SportCenter.Api.DTOs;

public class EmployeeDto
{
    public int EmployeeId { get; set; }
    public string FirstName { get; set; } = "";
    public string LastName { get; set; } = "";
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public DateOnly? Birthday { get; set; }
    public List<RoleDto> Roles { get; set; } = new();
    public List<QualificationDto> Qualifications { get; set; } = new();
}
