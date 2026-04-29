using Supabase;
using SportCenter.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// 2. Registrér Supabase Klienten
// Sørg for at "Supabase:Url" og "Supabase:Key" findes i din appsettings.json
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact", policy =>
    {
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// 2. Registrér Supabase Klienten
// Sørg for at "Supabase:Url" og "Supabase:Key" findes i din appsettings.json
builder.Services.AddScoped<Supabase.Client>(_ => 
    new Supabase.Client(
        builder.Configuration["Supabase:Url"] ?? throw new InvalidOperationException("Supabase URL mangler"),
        builder.Configuration["Supabase:Key"] ?? throw new InvalidOperationException("Supabase Key mangler"),
        new SupabaseOptions { AutoConnectRealtime = true }
    )
);

builder.Services.AddScoped<IEmployeeRepository, SupabaseEmployeeRepository>();
builder.Services.AddScoped<EmployeeService>();
builder.Services.AddScoped<ShiftService>(); // Vigtigt: Denne manglede for at fjerne build-fejl
builder.Services.AddScoped<LocationService>();
builder.Services.AddScoped<EventService>();
builder.Services.AddScoped<AssociationService>();
builder.Services.AddScoped<ContactService>();
builder.Services.AddScoped<EmployeeHoursService>();


// 4. Registrér controllers
builder.Services.AddControllers();

var app = builder.Build();

app.UseCors("AllowReact");

// Sørg for at dine controllers bliver mappet til dine ruter (f.eks. /api/employees)
app.MapControllers();

app.Run();
