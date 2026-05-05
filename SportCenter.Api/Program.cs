using Supabase;
using SportCenter.Api.Services;
using SportCenter.Api.Models.Converters;

var builder = WebApplication.CreateBuilder(args);

// 1. Konfigurér CORS så din React frontend (port 3000) må kalde din API
builder.Services.AddCors(options => {
    options.AddPolicy("AllowReact", policy => {
        policy.WithOrigins(
                "http://localhost:3000",
                "http://localhost:5173",
                "http://localhost:4173",
                "http://localhost:4174")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddHttpClient();

// 2. Registrér Supabase Klienten
// Sørg for at "Supabase:Url" og "Supabase:Key" findes i din appsettings.json
builder.Services.AddScoped<Supabase.Client>(_ => 
    new Supabase.Client(
        builder.Configuration["Supabase:Url"] ?? throw new InvalidOperationException("Supabase URL mangler"),
        builder.Configuration["Supabase:Key"] ?? throw new InvalidOperationException("Supabase Key mangler"),
        new SupabaseOptions { AutoConnectRealtime = true }
    )
);

// 3. Registrér dine business logic services (Dependency Injection)
builder.Services.AddScoped<IEmployeeRepository, SupabaseEmployeeRepository>();
builder.Services.AddScoped<IEmployeeAuthProvisioningService, SupabaseAuthProvisioningService>();
builder.Services.AddSingleton<AuthTransferService>();
builder.Services.AddScoped<EmployeeService>();
builder.Services.AddScoped<AuthContextService>();
builder.Services.AddScoped<ShiftService>(); // Vigtigt: Denne manglede for at fjerne build-fejl
builder.Services.AddScoped<LocationService>();
builder.Services.AddScoped<EventService>();
builder.Services.AddScoped<AssociationService>();
builder.Services.AddScoped<ContactService>();
builder.Services.AddScoped<EmployeeHoursService>();
builder.Services.AddScoped<SwapRequestService>();


// 4. Registrér controllers
builder.Services.AddControllers()
    .AddJsonOptions(opts =>
    {
        // Serialisér altid DateTime? uden tidszone-suffiks (ingen Z, ingen +02:00).
        // Forhindrer at browser-siden forskyder datoer ved UTC-fortolkning.
        opts.JsonSerializerOptions.Converters.Add(new SystemTextJsonDateTimeConverter());
    });

var app = builder.Build();

// 5. Middleware pipeline
app.UseCors("AllowReact");

// Sørg for at dine controllers bliver mappet til dine ruter (f.eks. /api/employees)
app.MapControllers();

app.Run();
