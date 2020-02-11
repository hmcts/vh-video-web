using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;
using VideoWeb.Common.SignalR;
using VideoWeb.EventHub.Enums;

namespace VideoWeb.EventHub.Hub
{
    public interface IEventHubClient
    {
        Task ParticipantStatusMessage(Guid participantId, ParticipantState participantState);
        Task ConferenceStatusMessage(Guid conferenceId, ConferenceState conferenceState);
        Task ConsultationMessage(Guid conferenceId, string requestedBy, string requestedFor, string result);

        Task AdminConsultationMessage(Guid conferenceId, RoomType room, string requestedFor,
            ConsultationAnswer? answer = null);
        Task HelpMessage(Guid conferenceId, string participantName);
    }

    [Authorize(Policy = "EventHubUser")]
    public class EventHub : Hub<IEventHubClient>
    {
        private readonly IUserProfileService _userProfileService;
        public static string VhOfficersGroupName => "VhOfficers";

        private readonly ILogger<EventHub> _logger;

        public EventHub(IUserProfileService userProfileService, ILogger<EventHub> logger)
        {        
            _userProfileService = userProfileService;
            _logger = logger;
        }
        public override async Task OnConnectedAsync()
        {
            var userName = await GetUsername(Context.User.Identity.Name);
            _logger.LogTrace($"Connected to event hub server-side: { userName } ");
            var isAdmin = await IsVhOfficerAsync(Context.User.Identity.Name);
            if (isAdmin)
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, VhOfficersGroupName);
            }
            else
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, Context.UserIdentifier);
            }

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            var userName = await GetUsername(Context.User.Identity.Name);
            _logger.LogTrace($"Disconnected from event hub server-side: { userName } ");
            _logger.LogTrace($"Disconnected from event hub server-side: { exception?.Message } ");
            var isAdmin = await IsVhOfficerAsync(Context.User.Identity.Name);
            if (isAdmin)
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, VhOfficersGroupName);
            }
            else
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, Context.UserIdentifier);
            }

            await base.OnDisconnectedAsync(exception);
        }

        private async Task<bool> IsVhOfficerAsync(string username)
        {
            return await _userProfileService.IsAdmin(username);
        }

        private async Task<string> GetUsername(string username)
        {
            return await _userProfileService.GetObfuscatedUsername(username);
        }
    }
}
