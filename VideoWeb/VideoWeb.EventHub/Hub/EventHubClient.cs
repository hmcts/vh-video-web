using Microsoft.AspNetCore.SignalR;
using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using VideoWeb.EventHub.Enums;

namespace VideoWeb.EventHub.Hub
{
    public interface IEventHubClient
    {
        Task ParticipantStatusMessage(string email, ParticipantState participantState);
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

        public EventHub(IUserProfileService userProfileService)
        {
            _userProfileService = userProfileService;
        }
        public override async Task OnConnectedAsync()
        {
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
    }
}