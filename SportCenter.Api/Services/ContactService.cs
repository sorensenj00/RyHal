using Supabase;
using SportCenter.Api.DTOs;
using SportCenter.Api.Models;
using Postgrest.Exceptions;
using Postgrest.Attributes;
using Postgrest.Models;

namespace SportCenter.Api.Services;

public class ContactService
{
    [Table("contact")]
    private class ContactInsertWithId : BaseModel
    {
        [PrimaryKey("contact_id", false)]
        [Column("contact_id")]
        public int ContactId { get; set; }

        [Column("name")]
        public string Name { get; set; } = string.Empty;

        [Column("title")]
        public string? Title { get; set; }

        [Column("profile_image_url")]
        public string? ProfileImageUrl { get; set; }

        [Column("phone")]
        public string? Phone { get; set; }

        [Column("email")]
        public string? Email { get; set; }
    }

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

        var newContact = new Contact
        {
            Name = dto.Name.Trim(),
            Title = string.IsNullOrWhiteSpace(dto.Title) ? null : dto.Title.Trim(),
            ProfileImageUrl = string.IsNullOrWhiteSpace(dto.ProfileImageUrl) ? null : dto.ProfileImageUrl.Trim(),
            Phone = string.IsNullOrWhiteSpace(dto.Phone) ? null : dto.Phone.Trim(),
            Email = string.IsNullOrWhiteSpace(dto.Email) ? null : dto.Email.Trim()
        };

        var normalizedName = newContact.Name;
        var normalizedTitle = newContact.Title;
        var normalizedProfileImageUrl = newContact.ProfileImageUrl;
        var normalizedPhone = newContact.Phone;
        var normalizedEmail = newContact.Email;

        Contact created;

        try
        {
            Console.WriteLine($"Attempting to create contact: {newContact.Name}");
            created = (await _supabase.From<Contact>().Insert(newContact)).Models.First();
            Console.WriteLine($"Contact created with ID: {created.ContactId}");

            if (created.ContactId <= 0)
            {
                Console.WriteLine($"Invalid ContactId returned: {created.ContactId}, using fallback logic");
                // Defensive self-heal: if DB returns an invalid ID, remove it and recreate with an explicit valid ID.
                await _supabase.From<Contact>()
                    .Where(c => c.ContactId == created.ContactId)
                    .Delete();

                var recreated = await CreateContactWithExplicitPositiveIdAsync(
                    normalizedName, normalizedTitle, normalizedProfileImageUrl, normalizedPhone, normalizedEmail);

                return ToDto(recreated);
            }
        }
        catch (PostgrestException ex) when (IsContactPrimaryKeyConflict(ex))
        {
            Console.WriteLine($"Primary key conflict detected: {ex.Message}, using fallback logic");
            try
            {
                var fallbackCreated = await CreateContactWithExplicitPositiveIdAsync(
                    normalizedName, normalizedTitle, normalizedProfileImageUrl, normalizedPhone, normalizedEmail);

                return ToDto(fallbackCreated);
            }
            catch (PostgrestException fallbackEx) when (IsContactPrimaryKeyConflict(fallbackEx))
            {
                throw new InvalidOperationException(
                    "Kontakten kunne ikke oprettes pga. vedvarende ID-konflikt i databasen. Verificér at contact_id default bruger nextval(...) og at sekvensen er synkroniseret.",
                    fallbackEx);
            }
        }

        return ToDto(created);
    }

    private static bool IsContactPrimaryKeyConflict(PostgrestException exception)
        => exception.Message.Contains("contact_pkey") || exception.Message.Contains("\"code\":\"23505\"");

    private async Task<Contact> CreateContactWithExplicitPositiveIdAsync(
        string name, string? title, string? profileImageUrl, string? phone, string? email)
    {
        var existingContacts = (await _supabase
            .From<Contact>()
            .Select("contact_id")
            .Get()).Models;

        var currentMax = existingContacts.Count == 0
            ? 0
            : existingContacts.Max(c => c.ContactId);

        var nextContactId = Math.Max(1, currentMax + 1);

        Console.WriteLine($"Using explicit ContactId: {nextContactId} (current max: {currentMax})");

        var fallbackContact = new ContactInsertWithId
        {
            ContactId = nextContactId,
            Name = name,
            Title = title,
            ProfileImageUrl = profileImageUrl,
            Phone = phone,
            Email = email
        };

        var inserted = (await _supabase
            .From<ContactInsertWithId>()
            .Insert(fallbackContact)).Models.First();

        Console.WriteLine($"Fallback contact created with ID: {inserted.ContactId}");

        // Convert back to Contact for consistency
        return new Contact
        {
            ContactId = inserted.ContactId,
            Name = inserted.Name,
            Title = inserted.Title,
            ProfileImageUrl = inserted.ProfileImageUrl,
            Phone = inserted.Phone,
            Email = inserted.Email
        };
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

    public async Task<List<ContactEventDto>> GetEventsForContactAsync(int contactId, string? accessToken = null)
    {
        await ApplySessionAsync(accessToken);

        var links = (await _supabase.From<EventContact>()
                .Where(ec => ec.ContactId == contactId)
                .Get())
            .Models;

        if (links.Count == 0)
        {
            return new List<ContactEventDto>();
        }

        var linkedEventIds = links
            .Select(link => link.EventId)
            .Distinct()
            .ToHashSet();

        var events = (await _supabase.From<Event>().Get())
            .Models
            .Where(evt => linkedEventIds.Contains(evt.Id))
            .OrderBy(evt => evt.Date ?? evt.StartTime)
            .ThenBy(evt => evt.StartTime)
            .Select(ToContactEventDto)
            .ToList();

        return events;
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

    private static ContactEventDto ToContactEventDto(Event evt)
        => new(
            evt.Id,
            evt.Name,
            evt.Description ?? string.Empty,
            evt.StartTime,
            evt.EndTime,
            evt.Date,
            evt.Category.ToString(),
            evt.AssociationId,
            evt.IsCancelled ?? false,
            evt.IsDraft ?? false
        );
}
