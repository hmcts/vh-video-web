using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Exceptions;
using VideoWeb.EventHub.Mappers;
using VideoWeb.EventHub.Models;
using VideoApi.Client;
using VideoApi.Contract.Requests;
using VideoWeb.EventHub.Services;
using VideoWeb.Common;

namespace VideoWeb.EventHub.Hub
{
    public class EventHub : Hub<IEventHubClient>
    {
        public static string VhOfficersGroupName => "VhOfficers";
        public static string DefaultAdminName => "Admin";

        private readonly IUserProfileService _userProfileService;
        private readonly IAppRoleService _appRoleService;
        private readonly ILogger<EventHub> _logger;
        private readonly IVideoApiClient _videoApiClient;
        private readonly IConferenceCache _conferenceCache;
        private readonly IHeartbeatRequestMapper _heartbeatRequestMapper;
        private readonly IConferenceVideoControlStatusService _conferenceVideoControlStatusService;
        private readonly IConferenceManagementService _conferenceManagementService;

        public EventHub(IUserProfileService userProfileService,
            IAppRoleService appRoleService,
            IVideoApiClient videoApiClient,
            ILogger<EventHub> logger,
            IConferenceCache conferenceCache,
            IHeartbeatRequestMapper heartbeatRequestMapper,
            IConferenceVideoControlStatusService conferenceVideoControlStatusService,
            IConferenceManagementService conferenceManagementService)
        {
            _userProfileService = userProfileService;
            _appRoleService = appRoleService;
            _logger = logger;
            _conferenceCache = conferenceCache;
            _heartbeatRequestMapper = heartbeatRequestMapper;
            _conferenceVideoControlStatusService = conferenceVideoControlStatusService;
            _conferenceManagementService = conferenceManagementService;
            _videoApiClient = videoApiClient;
        }

        public override async Task OnConnectedAsync()
        {
            if (!Context.User.Identity.IsAuthenticated) return;
            var userName = GetObfuscatedUsernameAsync(Context.User.Identity.Name);
            _logger.LogTrace("Connected to event hub server-side: {Username}", userName);
            var isAdmin = IsSenderAdmin();

            await AddUserToUserGroup(isAdmin);
            await AddUserToConferenceGroups(isAdmin);

            await base.OnConnectedAsync();

            // Cache user profile in the redis cache
            await _userProfileService.CacheUserProfileAsync(Context.User);
        }

        private async Task AddUserToConferenceGroups(bool isAdmin)
        {
            var conferenceIds = await GetConferenceIds(isAdmin);
            var tasks = conferenceIds.Select(c => Groups.AddToGroupAsync(Context.ConnectionId, c.ToString())).ToArray();

            await Task.WhenAll(tasks);
        }

        public async Task AddToGroup(string conferenceId)
        {
            if (IsSenderAdmin())
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, conferenceId);
            }
        }

        private async Task AddUserToUserGroup(bool isAdmin)
        {
            if (isAdmin)
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, VhOfficersGroupName);
            }

            await Groups.AddToGroupAsync(Context.ConnectionId, Context.User.Identity.Name.ToLowerInvariant());
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            var userName = GetObfuscatedUsernameAsync(Context.User.Identity.Name.ToLowerInvariant());
            if (exception == null)
            {
                _logger.LogInformation("Disconnected from chat hub server-side: {Username}", userName);
            }
            else
            {
                _logger.LogError(exception,
                    "There was an error when disconnecting from chat hub server-side: {Username}", userName);
            }

            var isAdmin = IsSenderAdmin();
            await RemoveUserFromUserGroup(isAdmin);
            await RemoveUserFromConferenceGroups(isAdmin);
            await _userProfileService.ClearUserCache(userName);
            await _appRoleService.ClearUserCache(userName);

            await base.OnDisconnectedAsync(exception);
        }

        private async Task RemoveUserFromUserGroup(bool isAdmin)
        {
            if (isAdmin)
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, VhOfficersGroupName);
            }

            await Groups.RemoveFromGroupAsync(Context.ConnectionId, Context.User.Identity.Name.ToLowerInvariant());
        }

        private async Task RemoveUserFromConferenceGroups(bool isAdmin)
        {
            var conferenceIds = await GetConferenceIds(isAdmin);
            var tasks = conferenceIds.Select(c => Groups.RemoveFromGroupAsync(Context.ConnectionId, c.ToString()))
                .ToArray();

            await Task.WhenAll(tasks);
        }

        private async Task<IEnumerable<Guid>> GetConferenceIds(bool isAdmin)
        {
            if (isAdmin)
            {
                var conferences = await _videoApiClient.GetConferencesTodayForAdminByHearingVenueNameAsync(null);
                return conferences.Select(x => x.Id);
            }

            return new Guid[0];
        }

        private bool IsSenderAdmin()
        {
            return Context.User.IsInRole(AppRoles.VhOfficerRole);
        }
        
        private string GetObfuscatedUsernameAsync(string username)
        {
            return _userProfileService.GetObfuscatedUsername(username);
        }

        /// <summary>
        /// Send message
        /// </summary>
        /// <param name="conferenceId">The conference Id</param>
        /// <param name="message">The body message</param>
        /// <param name="to">The participant Id or admin username</param>
        /// <param name="messageUuid">The message Id</param>
        /// <returns></returns>
        public async Task SendMessage(Guid conferenceId, string message, string to, Guid messageUuid)
        {
            try
            {
                _logger.LogDebug("Attempting to SendMessages in {Conference}", conferenceId);
                var conference = await GetConference(conferenceId);
                var imRules = new InstantMessageRules(_userProfileService);
                var from = Context.User.Identity!.Name!.ToLower();
                var isTargetAdmin = to.Equals(DefaultAdminName, StringComparison.InvariantCultureIgnoreCase);
                var canExchangeMessage = await imRules.CanExchangeMessage(conference, to, from);
                if (!canExchangeMessage) return;

                SendMessageDto sendMessageDto;
                if (isTargetAdmin)
                {
                    sendMessageDto = imRules.BuildSendMessageDtoFromParticipant(conference, messageUuid, message, from);
                }
                else
                {
                    sendMessageDto =
                        await imRules.BuildSendMessageDtoFromAdmin(conference, messageUuid, message, from,
                            Guid.Parse(to));
                }

                await SendToAdmin(sendMessageDto, conference.GetParticipant(from)?.Id.ToString());
                await SendToParticipant(sendMessageDto);
                if (!isTargetAdmin)
                {
                    _logger.LogDebug("Admin has responded, notifying admin channel");
                    await Clients.Group(VhOfficersGroupName).AdminAnsweredChat(conferenceId, to);
                }

                _logger.LogDebug("Pushing message to Video API history {MessageUuid}", sendMessageDto.MessageUuid);
                await _videoApiClient.AddInstantMessageToConferenceAsync(conferenceId, new AddInstantMessageRequest
                {
                    From = from,
                    To = isTargetAdmin ? DefaultAdminName : sendMessageDto.ParticipantUsername,
                    MessageText = message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occured when sending message to {To}, in conference {ConferenceId}", to, conferenceId);
            }
        }

        private async Task SendToParticipant(SendMessageDto dto)
        {
            //var participant = dto.Conference.Participants.Single(x =>
            //    x.Username.Equals(dto.ParticipantUsername, StringComparison.InvariantCultureIgnoreCase));

            var username = _userProfileService.GetObfuscatedUsername(dto.ParticipantUsername);
            _logger.LogDebug("Sending message {MessageUuid} to group {Username}", dto.MessageUuid, username);

            //var from = participant.Id.ToString() == dto.To ? dto.From : participant.Id.ToString();

            await Clients.Group(dto.ParticipantUsername.ToLowerInvariant())
                .ReceiveMessage(dto.Conference.Id, dto.From, dto.FromDisplayName, dto.To, dto.Message, dto.Timestamp,
                    dto.MessageUuid);
        }

        private async Task SendToAdmin(SendMessageDto dto, string fromId)
        {
            var groupName = dto.Conference.Id.ToString();
            _logger.LogDebug("Sending message {MessageUuid} to group {GroupName}", dto.MessageUuid, groupName);
            var from = string.IsNullOrEmpty(fromId) ? dto.From : fromId;
            await Clients.Group(groupName)
                .ReceiveMessage(dto.Conference.Id, from, dto.FromDisplayName, dto.To, dto.Message, dto.Timestamp,
                    dto.MessageUuid);
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
                    conferenceId, participantId, dto, heartbeat.BrowserName, heartbeat.BrowserVersion,
                    heartbeat.OperatingSystem, heartbeat.OperatingSystemVersion
                );
                var conference = await GetConference(conferenceId);
                var participant = conference.Participants.Single(x => x.Id == participantId);
                await Clients.Group(participant.Username.ToLowerInvariant()).ReceiveHeartbeat
                (
                    conferenceId, participantId, dto, heartbeat.BrowserName, heartbeat.BrowserVersion,
                    heartbeat.OperatingSystem, heartbeat.OperatingSystemVersion
                );

                if (!participant.IsJudge())
                {
                    var judge = conference.GetJudge();
                    await Clients.Group(judge.Username.ToLowerInvariant()).ReceiveHeartbeat
                    (
                        conferenceId, participantId, dto, heartbeat.BrowserName, heartbeat.BrowserVersion,
                        heartbeat.OperatingSystem, heartbeat.OperatingSystemVersion
                    );
                }

                var addHeartbeatRequest = _heartbeatRequestMapper.MapToRequest(heartbeat);
                await _videoApiClient.SaveHeartbeatDataForParticipantAsync(conferenceId, participantId,
                    addHeartbeatRequest);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occured when sending heartbeat");
            }
        }

        public async Task SendTransferRequest(Guid conferenceId, Guid participantId,
            TransferDirection transferDirection)
        {
            try
            {
                var conference = await GetConference(conferenceId);

                var transferringParticipant = conference.Participants.SingleOrDefault(x => x.Id == participantId);
                if (transferringParticipant == null)
                {
                    _logger.LogDebug("Participant {ParticipantId} does not exist in {ConferenceId}", participantId,
                        conferenceId);
                    throw new ParticipantNotFoundException(conferenceId, Context.User.Identity.Name);
                }

                await Clients.Group(VhOfficersGroupName)
                    .HearingTransfer(conferenceId, participantId, transferDirection);
                _logger.LogTrace(
                    "Participant Transfer: Participant Id: {ParticipantId} | Conference Id: {ConferenceId} | Direction: {Direction}",
                    participantId, conferenceId, transferDirection);

                foreach (var participant in conference.Participants)
                {
                    await Clients.Group(participant.Username.ToLowerInvariant())
                        .HearingTransfer(conferenceId, participantId, transferDirection);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occured when transferring participant");
            }
        }

        public async Task SendMediaDeviceStatus(Guid conferenceId, Guid participantId,
            ParticipantMediaStatus mediaStatus)
        {
            try
            {
                var conference = await GetConference(conferenceId);

                var participant = conference.Participants.SingleOrDefault(x => x.Id == participantId);
                if (participant == null)
                {
                    _logger.LogDebug("Participant {ParticipantId} does not exist in {ConferenceId}", participantId,
                        conferenceId);
                    throw new ParticipantNotFoundException(conferenceId, Context.User.Identity.Name);
                }

                await _conferenceVideoControlStatusService.UpdateMediaStatusForParticipantInConference(conferenceId,
                    participant.Id.ToString(), mediaStatus);

                var groupNames = new List<string> {VhOfficersGroupName};
                groupNames.AddRange(conference.Participants.Where(x => x.IsHost())
                    .Select(h => h.Username.ToLowerInvariant()));
                foreach (var groupName in groupNames)
                {
                    await Clients.Group(groupName)
                        .ParticipantMediaStatusMessage(participantId, conferenceId, mediaStatus);
                }

                _logger.LogTrace(
                    "Participant device status updated: Participant Id: {ParticipantId} | Conference Id: {ConferenceId}",
                    participantId, conferenceId);

            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occured when updating participant device status");
            }
        }

        /// <summary>
        /// Inform a participant/room when they have been remote muted
        /// </summary>
        /// <returns></returns>
        public async Task UpdateParticipantRemoteMuteStatus(Guid conferenceId, Guid participantId, bool isRemoteMuted)
        {
            try
            {
                var conference = await GetConference(conferenceId);
                var participant = conference.Participants.Single(x => x.Id == participantId);
                var linkedParticipants = GetLinkedParticipants(conference, participant);

                await Clients.Group(participant.Username.ToLowerInvariant())
                    .ParticipantRemoteMuteMessage(participantId, conferenceId, isRemoteMuted);
                _logger.LogTrace(
                    "Participant remote mute status updated: Participant Id: {ParticipantId} | Conference Id: {ConferenceId} to {IsRemoteMuted}",
                    participantId, conferenceId, isRemoteMuted);
                Task.WaitAll(
                    linkedParticipants.Select(linkedParticipant => Clients
                        .Group(linkedParticipant.Username.ToLowerInvariant())
                        .ParticipantRemoteMuteMessage(linkedParticipant.Id, conferenceId, isRemoteMuted)).ToArray());

            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Error occured when updating participant {ParticipantId} in conference {ConferenceId} remote mute status to {IsRemoteMuted}",
                    participantId, conferenceId, isRemoteMuted);
            }
        }

        /// <summary>
        /// Publish a participant's hand status (i.e. raised or lowered)
        /// </summary>
        /// <returns></returns>
        public async Task UpdateParticipantHandStatus(Guid conferenceId, Guid participantId, bool isRaised)
        {
            try
            {
                await _conferenceManagementService.UpdateParticipantHandStatusInConference(conferenceId, participantId,
                    isRaised);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Error occured when updating participant {ParticipantId} in conference {ConferenceId} hand status to {IsHandRaised}",
                    participantId, conferenceId, isRaised);
            }
        }

        /// <summary>
        /// A host can force a participant's local mute to be toggled. To be used for participants who do not have peripherals attached.
        /// This is not to be confused with remote mute, which lock's a participant's ability to toggle their own mute status.
        /// </summary>
        /// <param name="conferenceId">The UUID for a conference</param>
        /// <param name="participantId">The UUID for the participant</param>
        /// <param name="muted">true to mute or false to unmute a participant.</param>
        [Authorize("Host")]
        public async Task ToggleParticipantLocalMute(Guid conferenceId, Guid participantId, bool muted)
        {
            try
            {
                var conference = await GetConference(conferenceId);
                var participant = conference.Participants.SingleOrDefault(x => x.Id == participantId);
                if (participant == null)
                {

                    _logger.LogDebug("Participant {ParticipantId} does not exist in conference {ConferenceId}",
                        participantId, conferenceId);
                    throw new ParticipantNotFoundException(conferenceId, participantId);
                }

                await Clients.Group(participant.Username.ToLowerInvariant())
                    .UpdateParticipantLocalMuteMessage(conferenceId, participantId, muted);

            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Error occured when updating participant {ParticipantId} in conference {ConferenceId} local mute status to {Muted}",
                    participantId, conferenceId, muted);
            }
        }

        /// <summary>
        /// A host can force all participants' local mute to be toggled. To be used for participants who do not have peripherals attached.
        /// This is not to be confused with remote mute, which lock's a participant's ability to toggle their own mute status.
        /// </summary>
        /// <param name="conferenceId">The UUID for a conference</param>
        /// <param name="muted">true to mute or false to unmute participants.</param>
        [Authorize("Host")]
        public async Task ToggleAllParticipantLocalMute(Guid conferenceId, bool muted)
        {
            try
            {
                var conference = await GetConference(conferenceId);
                var participants = conference.Participants.Where(x => !x.IsHost());

                foreach (var participant in participants)
                {
                    await Clients.Group(participant.Username.ToLowerInvariant())
                        .UpdateParticipantLocalMuteMessage(conferenceId, participant.Id, muted);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Error occured when updating all participants in conference {ConferenceId} local mute status to {Muted}",
                    conferenceId, muted);
            }
        }

        /// <summary>
        /// Send a message to all other hosts in the conference, that the audio restart has been actioned.
        /// </summary>
        /// <param name="conferenceId">The UUID for a conference</param>
        /// <param name="participantId">The Participant ID for the host that actioned the audio restart</param>
        [Authorize("Host")]
        public async Task PushAudioRestartAction(Guid conferenceId, Guid participantId)
        {
            try
            {
                var conference = await GetConference(conferenceId);
                var otherHosts = conference.Participants
                    .Where(x => x.IsHost() && x.Id != participantId)
                    .ToArray();

                if (otherHosts.Any())
                    foreach (var host in otherHosts)
                        await Clients.Group(host.Username.ToLowerInvariant()).AudioRestartActioned(conferenceId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occured when updating other hosts in conference {ConferenceId}",
                    conferenceId);
            }
        }

        private List<Participant> GetLinkedParticipants(Conference conference, Participant participant)
        {
            if (participant.IsJudicialOfficeHolder())
            {
                return conference.Participants
                    .Where(x => x.IsJudicialOfficeHolder() && x.Id != participant.Id).ToList();
            }

            return conference.Participants
                .Where(p => participant.LinkedParticipants.Select(x => x.LinkedId)
                    .Contains(p.Id)
                ).ToList();
        }
        
    }
}
