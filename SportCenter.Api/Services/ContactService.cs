using Supabase;
using SportCenter.Api.DTOs;
using SportCenter.Api.Models;

namespace SportCenter.Api.Services;

public class ContactService
{
    private readonly Client _supabase;

    public ContactService(Client supabase)
    {
        _supabase = supabase;
    }

    private async Task ApplySessionAsync(string? accessToken)
    {
        if (!string.IsNullOrWhiteSpace(accessToken))
        {
            await _supabase.Auth.SetSession(accessToken, "refresh-token-not-needed");
        }
    }

    public async Task<List<ContactDto>> GetAllAsync(string? accessToken = null)
    {
        await ApplySessionAsync(accessToken);

        var contacts = (await _supabase.From<Contact>().Get()).Models;
        return contacts.Select(ToDto).ToList();
    }

    public async Task<ContactDto?> GetByIdAsync(int contactId, string? accessToken = null)
    {
        await ApplySessionAsync(accessToken);

        var contact = (await _supabase.From<Contact>()
                .Where(c => c.ContactId == contactId)
                .Get())
            .Models
            .FirstOrDefault();

        return contact == null ? null : ToDto(contact);
    }

    public async Task<ContactDto> CreateAsync(CreateContactDto dto, string? accessToken = null)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            throw new ArgumentException("Navn er påkrævet.");
        }

        await ApplySessionAsync(accessToken);

        var contact = new Contact
        {
            Name = dto.Name.Trim(),
            Title = string.IsNullOrWhiteSpace(dto.Title) ? null : dto.Title.Trim(),
            ProfileImageUrl = string.IsNullOrWhiteSpace(dto.ProfileImageUrl) ? null : dto.ProfileImageUrl.Trim(),
            Phone = string.IsNullOrWhiteSpace(dto.Phone) ? null : dto.Phone.Trim(),
            Email = string.IsNullOrWhiteSpace(dto.Email) ? null : dto.Email.Trim()
        };

        var created = (await _supabase.From<Contact>().Insert(contact)).Models.First();
        return ToDto(created);
    }

    public async Task<ContactDto?> UpdateAsync(int contactId, UpdateContactDto dto, string? accessToken = null)
    {
        await ApplySessionAsync(accessToken);

        var existing = (await _supabase.From<Contact>()
                .Where(c => c.ContactId == contactId)
                .Get())
            .Models
            .FirstOrDefault();

        if (existing == null)
        {
            return null;
        }

        var query = _supabase.From<Contact>().Where(c => c.ContactId == contactId);
        var hasChanges = false;

        if (dto.Name != null)
        {
            var trimmed = dto.Name.Trim();
            if (string.IsNullOrWhiteSpace(trimmed))
            {
                throw new ArgumentException("Navn må ikke være tomt.");
            }

            query = query.Set(c => c.Name, trimmed);
            hasChanges = true;
        }

        if (dto.Title != null)
        {
            query = query.Set(c => c.Title, string.IsNullOrWhiteSpace(dto.Title) ? null : dto.Title.Trim());
            hasChanges = true;
        }

        if (dto.ProfileImageUrl != null)
        {
            query = query.Set(c => c.ProfileImageUrl, string.IsNullOrWhiteSpace(dto.ProfileImageUrl) ? null : dto.ProfileImageUrl.Trim());
            hasChanges = true;
        }

        if (dto.Phone != null)
        {
            query = query.Set(c => c.Phone, string.IsNullOrWhiteSpace(dto.Phone) ? null : dto.Phone.Trim());
            hasChanges = true;
        }

        if (dto.Email != null)
        {
            query = query.Set(c => c.Email, string.IsNullOrWhiteSpace(dto.Email) ? null : dto.Email.Trim());
            hasChanges = true;
        }

        if (hasChanges)
        {
            await query.Update();
        }

        return await GetByIdAsync(contactId, accessToken);
    }

    public async Task<bool> DeleteAsync(int contactId, string? accessToken = null)
    {
        await ApplySessionAsync(accessToken);

        var existing = (await _supabase.From<Contact>()
                .Where(c => c.ContactId == contactId)
                .Get())
            .Models
            .FirstOrDefault();

        if (existing == null)
        {
            return false;
        }

        await _supabase.From<AssociationContact>()
            .Where(ac => ac.ContactId == contactId)
            .Delete();

        await _supabase.From<EventContact>()
            .Where(ec => ec.ContactId == contactId)
            .Delete();

        await _supabase.From<Contact>()
            .Where(c => c.ContactId == contactId)
            .Delete();

        return true;
    }

    public async Task LinkToEventAsync(int contactId, int eventId, string? accessToken = null)
    {
        await ApplySessionAsync(accessToken);

        var contactExists = (await _supabase.From<Contact>()
                .Where(c => c.ContactId == contactId)
                .Get())
            .Models
            .Any();

        if (!contactExists)
        {
            throw new KeyNotFoundException($"Kontakt med id {contactId} blev ikke fundet.");
        }

        var eventExists = (await _supabase.From<Event>()
                .Where(e => e.Id == eventId)
                .Get())
            .Models
            .Any();

        if (!eventExists)
        {
            throw new KeyNotFoundException($"Event med id {eventId} blev ikke fundet.");
        }

        var existingLink = (await _supabase.From<EventContact>()
                .Where(ec => ec.ContactId == contactId)
                .Where(ec => ec.EventId == eventId)
                .Get())
            .Models
            .FirstOrDefault();

        if (existingLink != null)
        {
            return;
        }

        await _supabase.From<EventContact>().Insert(new EventContact
        {
            ContactId = contactId,
            EventId = eventId
        });
    }

    public async Task UnlinkFromEventAsync(int contactId, int eventId, string? accessToken = null)
    {
        await ApplySessionAsync(accessToken);

        await _supabase.From<EventContact>()
            .Where(ec => ec.ContactId == contactId)
            .Where(ec => ec.EventId == eventId)
            .Delete();
    }

    public async Task<List<ContactDto>> GetForEventAsync(int eventId, string? accessToken = null)
    {
        await ApplySessionAsync(accessToken);

        var links = (await _supabase.From<EventContact>()
                .Where(ec => ec.EventId == eventId)
                .Get())
            .Models;

        if (links.Count == 0)
        {
            return new List<ContactDto>();
        }

        var contacts = (await _supabase.From<Contact>().Get()).Models;
        var contactsById = contacts.ToDictionary(c => c.ContactId);

        return links
            .Select(link => contactsById.TryGetValue(link.ContactId, out var contact) ? ToDto(contact) : null)
            .Where(c => c != null)
            .Cast<ContactDto>()
            .ToList();
    }

    private static ContactDto ToDto(Contact contact)
        => new(
            contact.ContactId,
            contact.Name,
            contact.Title,
            contact.ProfileImageUrl,
            contact.Phone,
            contact.Email
        );
}
