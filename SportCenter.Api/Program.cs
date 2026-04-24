using Supabase;
using SportCenter.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact", policy =>
    {
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddScoped<Client>(_ =>
    new Client(
        builder.Configuration["Supabase:Url"] ?? throw new InvalidOperationException("Supabase URL mangler"),
        builder.Configuration["Supabase:Key"] ?? throw new InvalidOperationException("Supabase Key mangler"),
        new SupabaseOptions { AutoConnectRealtime = true }
    )
);

builder.Services.AddScoped<IEmployeeRepository, SupabaseEmployeeRepository>();
builder.Services.AddScoped<EmployeeService>();
builder.Services.AddScoped<ShiftService>();

builder.Services.AddControllers();

var app = builder.Build();

app.UseCors("AllowReact");
app.MapControllers();
app.Run();
