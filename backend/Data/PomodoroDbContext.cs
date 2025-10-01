using Microsoft.EntityFrameworkCore;
using PomodoroAPI.Models;

namespace PomodoroAPI.Data;

public class PomodoroDbContext : DbContext
{
    public PomodoroDbContext(DbContextOptions<PomodoroDbContext> options) : base(options)
    {
    }

    public DbSet<Session> Sessions { get; set; }
}

