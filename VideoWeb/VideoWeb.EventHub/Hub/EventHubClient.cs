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

        public async Task SendMessage(Guid conferenceId, string message, string to, Guid messageUuid)
        {
            var userName = await GetObfuscatedUsernameAsync(Context.User.Identity.Name);
            _logger.LogTrace($"{userName} is attempting to SendMessages");
            // this determines if the message is from admin
            var isSenderAdmin = IsSenderAdmin();
            _logger.LogDebug($"{userName} is sender admin: {isSenderAdmin}");
            var isRecipientAdmin = await IsRecipientAdmin(to);
            _logger.LogDebug($"{userName} is recipient admin: {isSenderAdmin}");
            // only admins and participants in the conference can send or receive a message within a conference channel
            var from = Context.User.Identity.Name.ToLowerInvariant();
            var participantUsername = isSenderAdmin ? to : from;
            var isAllowed =
                await IsAllowedToSendMessageAsync(conferenceId, isSenderAdmin, isRecipientAdmin, participantUsername);
            if (!isAllowed) { return; }

            var dto = new SendMessageDto
            {
                Conference = new Conference { Id = conferenceId },
                From = from,
                To = to,
                Message = message,
                ParticipantUsername = participantUsername,
                Timestamp = DateTime.UtcNow,
                MessageUuid = messageUuid
            };
            _logger.LogDebug($"Message validation passed for message {dto.MessageUuid}");
            // send to admin channel
            await SendToAdmin(dto);

            // determine participant username
            dto.Conference = await GetConference(conferenceId);
            await SendToParticipant(dto);
            _logger.LogDebug($"Pushing message to Video API history {dto.MessageUuid}");
            await _videoApiClient.AddInstantMessageToConferenceAsync(conferenceId, new AddInstantMessageRequest
            {
                From = from,
                To = to,
                Message_text = message
            });

            if (isSenderAdmin)
            {
                _logger.LogDebug($"Admin has responded, notifying admin channel");
                await Clients.Group(VhOfficersGroupName).AdminAnsweredChat(conferenceId, to.ToLower());
            }
        }

        private async Task<bool> IsRecipientAdmin(string recipientUsername)
        {
            if (recipientUsername.Equals(DefaultAdminName, StringComparison.InvariantCultureIgnoreCase))
            {
                return true;
            }
            var user = await _userProfileService.GetUserAsync(recipientUsername);
            return user != null && user.User_role.Equals("VHOfficer", StringComparison.InvariantCultureIgnoreCase);
        }

        private async Task SendToParticipant(SendMessageDto dto)
        {
            var participant = dto.Conference.Participants.Single(x =>
                x.Username.Equals(dto.ParticipantUsername, StringComparison.InvariantCultureIgnoreCase));

            var username = await _userProfileService.GetObfuscatedUsernameAsync(participant.Username);
            _logger.LogDebug($"Sending message {dto.MessageUuid} to group {username}");
            await Clients.Group(participant.Username.ToLowerInvariant())
                .ReceiveMessage(dto.Conference.Id, dto.From, dto.To, dto.Message, dto.Timestamp, dto.MessageUuid);
        }

        private async Task SendToAdmin(SendMessageDto dto)
        {
            var groupName = dto.Conference.Id.ToString();
            _logger.LogDebug($"Sending message {dto.MessageUuid} to group {groupName}");
            await Clients.Group(groupName)
                .ReceiveMessage(dto.Conference.Id, dto.From, dto.To, dto.Message, dto.Timestamp, dto.MessageUuid);
        }

        private bool IsConversationBetweenAdminAndParticipant(bool isSenderAdmin, bool isRecipientAdmin)
        {
            try
            {
                if (isSenderAdmin && isRecipientAdmin)
                {

                    _logger.LogDebug($"Sender and recipient are admins");
                    throw new InvalidInstantMessageException("Admins are not allowed to IM each other");
                }

                if (!isSenderAdmin && !isRecipientAdmin)
                {
                    _logger.LogDebug($"Sender and recipient are participants");
                    throw new InvalidInstantMessageException("Participants are not allowed to IM each other");
                }
            }
            catch (InvalidInstantMessageException e)
            {
                _logger.LogError(e, "IM rules violated. Communication attempted between participants");
                return false;
            }

            _logger.LogDebug($"Sender and recipient are allowed to converse");
            return true;
        }

        private async Task<bool> IsAllowedToSendMessageAsync(Guid conferenceId, bool isSenderAdmin,
            bool isRecipientAdmin, string participantUsername)
        {
            var username = await _userProfileService.GetObfuscatedUsernameAsync(participantUsername);
            if (!IsConversationBetweenAdminAndParticipant(isSenderAdmin, isRecipientAdmin))
            {
                return false;
            }
            // participant check first belongs to conference
            try
            {
                var conference = await GetConference(conferenceId);
                var participant = conference.Participants.SingleOrDefault(x =>
                    x.Username.Equals(participantUsername, StringComparison.InvariantCultureIgnoreCase));

                if (participant == null)
                {

                    _logger.LogDebug($"Participant {username} does not exist in conversation");
                    throw new ParticipantNotFoundException(conferenceId, Context.User.Identity.Name);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occured when validating send message");
                return false;
            }
            _logger.LogDebug($"Participant {username} exists in conversation");
            return true;
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
                var dto = _heartbeatRequestMapper.MapToHealth(heartbeat);
                await Clients.Group(VhOfficersGroupName).ReceiveHeartbeat
                (
                    conferenceId, participantId, dto, heartbeat.BrowserName, heartbeat.BrowserVersion
                );
                var conference = await GetConference(conferenceId);
                var participant = conference.Participants.Single(x => x.Id == participantId);
                await Clients.Group(participant.Username.ToLowerInvariant()).ReceiveHeartbeat
               (
                   conferenceId, participantId, dto, heartbeat.BrowserName, heartbeat.BrowserVersion
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
