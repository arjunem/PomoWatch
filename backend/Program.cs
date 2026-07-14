using Microsoft.EntityFrameworkCore;
using PomodoroAPI.Data;
using PomodoroAPI.Repositories;
using PomodoroAPI.Services;

var builder = WebApplication.CreateBuilder(args);

// Render (and other PaaS hosts) inject the listen port via PORT; bind to it when present
var hostPort = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrEmpty(hostPort))
{
    builder.WebHost.UseUrls($"http://0.0.0.0:{hostPort}");
}

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Configure JSON serialization for consistent date handling
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.WriteIndented = true;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure CORS: allow local dev, any Cloudflare Pages deployment (prod + preview
// subdomains), and an optional extra origin (e.g. a custom domain) via CORS_EXTRA_ORIGIN
var extraOrigin = Environment.GetEnvironmentVariable("CORS_EXTRA_ORIGIN");
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.SetIsOriginAllowed(origin =>
              {
                  if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri)) return false;
                  if (uri.Host == "localhost") return true;
                  if (uri.Host.EndsWith(".pages.dev", StringComparison.OrdinalIgnoreCase)) return true;
                  if (!string.IsNullOrEmpty(extraOrigin) && origin.Equals(extraOrigin, StringComparison.OrdinalIgnoreCase)) return true;
                  return false;
              })
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Configure SQLite Database
builder.Services.AddDbContext<PomodoroDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// Register Repository and Service layers
builder.Services.AddScoped<ISessionRepository, SessionRepository>();
builder.Services.AddScoped<ISessionService, SessionService>();
builder.Services.AddScoped<ISettingsRepository, SettingsRepository>();
builder.Services.AddScoped<ISettingsService, SettingsService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Enable CORS (must be before other middleware)
app.UseCors("AllowFrontend");

// Only use HTTPS redirection in production (Docker will handle HTTP)
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

// Ensure database is created
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<PomodoroDbContext>();
    context.Database.EnsureCreated();
}

app.MapControllers();

app.Run();
