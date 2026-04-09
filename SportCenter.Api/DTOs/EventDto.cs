using SportCenter.Api.Models;
namespace SportCenter.Api.DTOs;

public record EventResponseDto(
    int Id, 
    string Name, 
    string Description, 
    DateTime StartTime, 
    DateTime EndTime, 
    string Category,
    bool IsRecurring,
    int LocationId,
    int? TemplateId
);

public record CreateEventDto(
    string Name, 
    string Description, 
    DateTime StartTime, 
    DateTime EndTime, 
    EventCategory Category, 
    int LocationId,
    bool IsRecurring,
    int? TemplateId
);