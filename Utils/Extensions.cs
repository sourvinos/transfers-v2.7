using System;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using Transfers.Identity;
using Transfers.Models;

namespace Transfers.Utils {
    public static class Extensions {
        // Cors
        public static void AddCors(IServiceCollection services) {
            services.AddCors(options => {
                options.AddPolicy("EnableCORS", builder => {
                    builder.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod().AllowCredentials().Build();
                });
            });
        }

        // Identity
        public static void AddIdentity(IServiceCollection services) {
            services
                .AddIdentity<ApplicationUser, IdentityRole>(options => {
                    options.Password.RequireDigit = false;
                    options.Password.RequiredLength = 1;
                    options.Password.RequireNonAlphanumeric = false;
                    options.Password.RequireUppercase = false;
                    options.Password.RequireLowercase = false;
                    options.User.RequireUniqueEmail = true;
                    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
                    options.Lockout.MaxFailedAccessAttempts = 5;
                    options.Lockout.AllowedForNewUsers = true;
                })
                .AddEntityFrameworkStores<ApplicationDbContext>()
                .AddDefaultTokenProviders();
        }

        // Authentication
        public static void AddAuthentication(IConfiguration configuration, IServiceCollection services) {
            var appSettingsSection = configuration.GetSection("AppSettings");
            services.Configure<Identity.AppSettings>(appSettingsSection);
            var appSettings = appSettingsSection.Get<Identity.AppSettings>();
            var key = Encoding.ASCII.GetBytes(appSettings.Secret);

            services
                .AddAuthentication(options => {
                    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
                    options.DefaultSignInScheme = JwtBearerDefaults.AuthenticationScheme;
                })
                .AddJwtBearer(JwtBearerDefaults.AuthenticationScheme, options => {
                    options.TokenValidationParameters = new TokenValidationParameters {
                    ValidateIssuerSigningKey = true,
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidIssuer = appSettings.Site,
                    ValidAudience = appSettings.Audience,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ClockSkew = TimeSpan.Zero
                    };
                });
        }

        // Authorization
        public static void AddAuthorization(IServiceCollection services) {
            services.AddAuthorization(options => {
                options.AddPolicy("RequireLoggedIn", policy => policy.RequireRole("User").RequireAuthenticatedUser());
                options.AddPolicy("RequireAdministratorRole", policy => policy.RequireRole("Admin").RequireAuthenticatedUser());
            });

        }

        // Email settings
        public static void AddEmailProviders(IConfiguration configuration, IServiceCollection services) {
            var emailSettingsSection = configuration.GetSection("EmailSettings");
            services.Configure<Models.EmailSettings>(emailSettingsSection);
            var emailSettings = emailSettingsSection.Get<Models.EmailSettings>();
        }

        // Error pages
        public static void ErrorPages(IApplicationBuilder app, IHostingEnvironment env) {
            if (!env.IsDevelopment()) {
                app.UseDeveloperExceptionPage();
            } else {
                app.UseExceptionHandler("/Error");
            }
        }
    }
}