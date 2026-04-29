using System.Text.Json.Serialization;

namespace SportCenter.Api.DTOs
{
    public class CreateEmployeeDto
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;

        [JsonPropertyName("birthDate")]
        public DateTime Birthday { get; set; }

        public string? SupabaseUserId { get; set; }
        public string? AppAccess { get; set; }
    }
}
