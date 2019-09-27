using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;

namespace VideoWeb.EventHub.Hub
{
    public class NameUserIdProvider : IUserIdProvider
    {
        public string GetUserId(HubConnectionContext connection)
        {
            return connection.User?.FindFirst(ClaimTypes.Name)?.Value.ToLowerInvariant();
        }
    }
}