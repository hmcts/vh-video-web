using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Extensions;
using VideoWeb.Common.Models;
using VideoWeb.Common.SignalR;
using VideoWeb.EventHub.Exceptions;
using VideoWeb.EventHub.Mappers;
using VideoWeb.EventHub.Models;
using VideoWeb.Services.Video;

namespace VideoWeb.EventHub.Hub
{
    [Authorize(Policy = "EventHubUser")]
    public class EventHub : Hub<IEventHubClient>
    {
        public static string VhOfficersGroupName => "VhOfficers";
        public static string DefaultAdminName => "Admin";

        private readonly IUserProfileService _userProfileService;
        private readonly ILogger<EventHub> _logger;
        private readonly IVideoApiClient _videoApiClient;
        private readonly IConferenceCache _conferenceCache;
        private readonly IHeartbeatRequestMapper _heartbeatRequestMapper;

        public EventHub(IUserProfileService userProfileService, IVideoApiClient videoApiClient,
            ILogger<EventHub> logger, IConferenceCache conferenceCache, IHeartbeatRequestMapper heartbeatRequestMapper)
        {
            _userProfileService = userProfileService;
            _logger = logger;
            _conferenceCache = conferenceCache;
            _heartbeatRequestMapper = heartbeatRequestMapper;
            _videoApiClient = videoApiClient;
        }

        public override async Task OnConnectedAsync()
        {
            var userName = await GetObfuscatedUsernameAsync(Context.User.Identity.Name);
            _logger.LogTrace($"Connected to event hub server-side: {userName} ");
            var isAdmin = IsSenderAdmin();

            await AddUserToUserGroup(isAdmin);
            await AddUserToConferenceGroups(isAdmin);

            await base.OnConnectedAsync();
        }

        private async Task AddUserToConferenceGroups(bool isAdmin)
        {
            if (!isAdmin) return;
            var conferences = await GetConferencesForAdmin();
            var tasks = conferences.Select(c => Groups.AddToGroupAsync(Context.ConnectionId, c.Id.ToString()))
                .ToArray();

            await Task.WhenAll(tasks);
        }

        private async Task AddUserToUserGroup(bool isAdmin)
        {
            if (isAdmin)
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, VhOfficersGroupName);
            }
            else
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, Context.User.Identity.Name.ToLowerInvariant());
            }
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            var userName = await GetObfuscatedUsernameAsync(Context.User.Identity.Name.ToLowerInvariant());
            if (exception == null)
            {
                _logger.LogInformation($"Disconnected from chat hub server-side: {userName} ");
            }
            else
            {
                _logger.LogWarning(exception, $"There was an error when disconnecting from chat hub server-side: {userName}");
            }

            var isAdmin = IsSenderAdmin();
            await RemoveUserFromUserGroup(isAdmin);
            await RemoveUserFromConferenceGroups(isAdmin);

            await base.OnDisconnectedAsync(exception);
        }

        private async Task RemoveUserFromUserGroup(bool isAdmin)
        {
            if (isAdmin)
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, VhOfficersGroupName);
            }
            else
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, Context.User.Identity.Name.ToLowerInvariant());
            }
        }

        private async Task RemoveUserFromConferenceGroups(bool isAdmin)
        { 
            if (!isAdmin) return;
            var conferences = await GetConferencesForAdmin();
            var tasks = conferences.Select(c => Groups.RemoveFromGroupAsync(Context.ConnectionId, c.Id.ToString())).ToArray();

            await Task.WhenAll(tasks);
        }

        private async Task<IEnumerable<ConferenceForAdminResponse>> GetConferencesForAdmin()
        {
            var conferences = await _videoApiClient.GetConferencesTodayForAdminAsync(null);
            return conferences;
        }

        private bool IsSenderAdmin()
        {
            return Context.User.IsInRole(Role.VideoHearingsOfficer.DescriptionAttr());
        }

        private async Task<string> GetObfuscatedUsernameAsync(string username)
        {
            return await _userProfileService.GetObfuscatedUsernameAsync(username);
        }

        public async Task SendMessage(Guid conferenceId, string message, string to)
        {
            // this determines if the message is from admin
            var isSenderAdmin = IsSenderAdmin();
            var isRecipientAdmin = await IsRecipientAdmin(to);
            // only admins and participants in the conference can send or receive a message within a conference channel
            var from = Context.User.Identity.Name.ToLowerInvariant();
            var participantUsername = isSenderAdmin ? to : from;
            var isAllowed = await IsAllowedToSendMessageAsync(conferenceId, isSenderAdmin, isRecipientAdmin, participantUsername);
            if (!isAllowed) return;

            
            var timestamp = DateTime.UtcNow;

            // send to admin channel

            await SendToAdmin(conferenceId, message, to, @from, timestamp);

            // determine participant username
            var conference = await GetConference(conferenceId);

            await SendToParticipant(conferenceId, message, to, conference, participantUsername, @from, timestamp);
            await _videoApiClient.AddInstantMessageToConferenceAsync(conferenceId, new AddInstantMessageRequest
            {
                From = from,
                To = to,
                Message_text = message
            });

            if (isSenderAdmin)
            {
                await Clients.Group(VhOfficersGroupName).AdminAnsweredChat(conferenceId);
            }
        }

        private async Task<bool> IsRecipientAdmin(string recipientUsername)
        {
            if (recipientUsername.Equals(DefaultAdminName, StringComparison.InvariantCultureIgnoreCase))
            {
                return true;
            }
            var user =  await _userProfileService.GetUserAsync(recipientUsername);
            return user!=null &&  user.User_role.Equals("VHOfficer", StringComparison.InvariantCultureIgnoreCase);
        }

        private async Task SendToParticipant(Guid conferenceId, string message, string to, Conference conference,
            string participantUsername, string @from, DateTime timestamp)
        {
            var participant = conference.Participants.Single(x =>
                x.Username.Equals(participantUsername, StringComparison.InvariantCultureIgnoreCase));

            await Clients.Group(participant.Username.ToLowerInvariant())
                .ReceiveMessage(conferenceId, @from, to, message, timestamp, Guid.NewGuid());
        }

        private async Task SendToAdmin(Guid conferenceId, string message, string to, string @from, DateTime timestamp)
        {
            await Clients.Group(conferenceId.ToString())
                .ReceiveMessage(conferenceId, @from, to, message, timestamp, Guid.NewGuid());
        }

        private bool IsConversationBetweenAdminAndParticipant(bool isSenderAdmin, bool isRecipientAdmin)
        {
            try
            {
                if (isSenderAdmin && isRecipientAdmin)
                {
                    throw new InvalidInstantMessageException("Admins are not allowed to IM each other");
                }

                if (!isSenderAdmin && !isRecipientAdmin)
                {
                    throw new InvalidInstantMessageException("Participants are not allowed to IM each other");
                }
            }
            catch (InvalidInstantMessageException e)
            {
                _logger.LogError(e, "IM rules violated. Communication attempted between participants");
                return false;
            }

            return true;
        }

        private async Task<bool> IsAllowedToSendMessageAsync(Guid conferenceId, bool isSenderAdmin,
            bool isRecipientAdmin, string participantUsername)
        {
            if (!IsConversationBetweenAdminAndParticipant(isSenderAdmin, isRecipientAdmin))
            {
                return false;
            }
            // participant check first belongs to conference
            Participant participant;
            try
            {
                var conference = await GetConference(conferenceId);

                participant = conference.Participants.SingleOrDefault(x =>
                    x.Username.Equals(participantUsername, StringComparison.InvariantCultureIgnoreCase));

                if (participant == null)
                {
                    throw new ParticipantNotFoundException(conferenceId, Context.User.Identity.Name);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occured when validating send message");
                return false;
            }

            // only judge and participants can send messages at present
            return isSenderAdmin || participant.IsJudge();
        }

        private async Task<Conference> GetConference(Guid conferenceId)
        {
            var conference = await _conferenceCache.GetOrAddConferenceAsync
            (
                conferenceId,
                () => _videoApiClient.GetConferenceDetailsByIdAsync(conferenceId)
            );
            return conference;
        }

        public async Task SendHeartbeat(Guid conferenceId, Guid participantId, Heartbeat heartbeat)
        {
            try
            {
                await Clients.Group(VhOfficersGroupName).ReceiveHeartbeat
                (
                    conferenceId, participantId, _heartbeatRequestMapper.MapToHealth(heartbeat),
                    heartbeat.BrowserName, heartbeat.BrowserVersion
                );

                var addHeartbeatRequest = _heartbeatRequestMapper.MapToRequest(heartbeat);
                await _videoApiClient.SaveHeartbeatDataForParticipantAsync(conferenceId, participantId, addHeartbeatRequest);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occured when sending heartbeat");
            }
        }
    }
}
