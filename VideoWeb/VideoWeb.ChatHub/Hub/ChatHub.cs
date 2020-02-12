using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using VideoWeb.Common.SignalR;
using VideoWeb.Services.Video;

namespace VideoWeb.ChatHub.Hub
{
    public interface IChatHubClient
    {
        Task ReceiveMessage(Guid conferenceId, string from, string message, DateTime timestamp);
    }

    [Authorize(Policy = "EventHubUser")]
    public class ChatHub : Hub<IChatHubClient>
    {
        private readonly IUserProfileService _userProfileService;
        private readonly IVideoApiClient _videoApiClient;

        private readonly ILogger<ChatHub> _logger;

        public ChatHub(IUserProfileService userProfileService, IVideoApiClient videoApiClient, ILogger<ChatHub> logger)
        {
            _userProfileService = userProfileService;
            _videoApiClient = videoApiClient;
            _logger = logger;
        }
        public override async Task OnConnectedAsync()
        {
            var userName = await GetObfuscatedUsernameAsync(Context.User.Identity.Name);
            _logger.LogTrace($"Connected to chat hub server-side: { userName } ");
            var conferences = await GetConferencesForUser(Context.User.Identity.Name);
            AddToConferences(conferences);

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            var userName = await GetObfuscatedUsernameAsync(Context.User.Identity.Name);
            _logger.LogCritical(exception, $"Disconnected from chat hub server-side: { userName } ");
            var conferences = await GetConferencesForUser(Context.User.Identity.Name);
            RemoveFromConferences(conferences);

            await base.OnDisconnectedAsync(exception);
        }

        private async Task<List<ConferenceSummaryResponse>> GetConferencesForUser(string userName)
        {
            var conferences = await _videoApiClient.GetConferencesTodayAsync();

            var isAdmin = await IsVhOfficerAsync(Context.User.Identity.Name);
            if (isAdmin)
            {
                return conferences;
            }

            return conferences.Where(c =>
                    c.Participants.Any(
                        p => p.User_role == UserRole.Judge
                            && p.Username.Equals(userName, StringComparison.InvariantCultureIgnoreCase)))
                .ToList();
        }

        private void AddToConferences(List<ConferenceSummaryResponse> conferences)
        {
            var tasks = conferences.Select(c => Groups.AddToGroupAsync(Context.ConnectionId, c.Id.ToString())).ToArray();
            Task.WaitAll(tasks);
        }

        private void RemoveFromConferences(List<ConferenceSummaryResponse> conferences)
        {
            var tasks = conferences.Select(c => Groups.RemoveFromGroupAsync(Context.ConnectionId, c.Id.ToString())).ToArray();
            Task.WaitAll(tasks);
        }

        public async Task SendMessage(Guid conferenceId, string from, string message)
        {
            var timestamp = DateTime.UtcNow;
            await Clients.Group(conferenceId.ToString()).ReceiveMessage(conferenceId, from, message, timestamp);
            // TODO: call video api and save message
        }

        private async Task<bool> IsVhOfficerAsync(string username)
        {
            return await _userProfileService.IsAdmin(username);
        }

        private async Task<string> GetObfuscatedUsernameAsync(string username)
        {
            return await _userProfileService.GetObfuscatedUsername(username);
        }
    }
}
