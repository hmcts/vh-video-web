using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;
using VideoApi.Client;
using VideoApi.Contract.Requests;
using VideoWeb.Common.Logging;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Exceptions;
using VideoWeb.EventHub.Mappers;
using VideoWeb.EventHub.Services;

namespace VideoWeb.EventHub.Hub;

public class EventHub(
    IUserProfileService userProfileService,
    IAppRoleService appRoleService,
    IVideoApiClient videoApiClient,
    ILogger<EventHub> logger,
    IHeartbeatRequestMapper heartbeatRequestMapper,
    IConferenceVideoControlStatusService conferenceVideoControlStatusService,
    IConferenceManagementService conferenceManagementService,
    IConferenceService conferenceService)
    : Hub<IEventHubClient>
{
    public static string VhOfficersGroupName => "VhOfficers";
    public static string DefaultAdminName => "Admin";
    public static string StaffMembersGroupName => "StaffMembers";

    public override async Task OnConnectedAsync()
    {
        var isAdmin = IsSenderAdmin();
        var isStaffMember = IsSenderStaffMember();

        await AddUserToUserGroup(isAdmin, isStaffMember);
        await AddUserToConferenceGroups(isAdmin || isStaffMember);

        await base.OnConnectedAsync();

        // Cache user profile in the redis cache
        await userProfileService.CacheUserProfileAsync(Context.User);
        var userName = GetObfuscatedUsernameAsync(Context.User.Identity!.Name);
        logger.LogConnectedToEventHub(userName);
    }

    public override async Task OnDisconnectedAsync(Exception exception)
    {
        var username = Context.User.Identity?.Name?.ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(username)) return;
        var obfuscatedUsername = GetObfuscatedUsernameAsync(username);

        if (exception == null)
        {
            logger.LogDisconnectedFromEventHub(obfuscatedUsername);
        }
        else
        {
            logger.LogErrorDisconnectingFromChatHub(exception, obfuscatedUsername);
        }

        var isAdmin = IsSenderAdmin();
        var isStaffMember = IsSenderStaffMember();
        await RemoveUserFromUserGroup(isAdmin, isStaffMember);
        await RemoveUserFromConferenceGroups(isAdmin || isStaffMember);
        await userProfileService.ClearUserCache(username);
        await appRoleService.ClearUserCache(username);

        await base.OnDisconnectedAsync(exception);
    }

    public async Task AddToGroup(string conferenceId)
    {
        if (IsSenderAdmin())
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, conferenceId);
        }
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
            logger.LogAttemptingToSendMessage(conferenceId);
            var conference = await conferenceService.GetConference(conferenceId);
            var imRules = new InstantMessageRules(userProfileService);
            var from = Context.User.Identity!.Name!.ToLower();
            var isTargetAdmin = to.Equals(DefaultAdminName, StringComparison.InvariantCultureIgnoreCase);
            var canExchangeMessage = await imRules.CanExchangeMessage(conference, to, from);
            if (!canExchangeMessage) return;

            SendMessageDto sendMessageDto;
            if (isTargetAdmin)
            {
                sendMessageDto = InstantMessageRules.BuildSendMessageDtoFromParticipant(conference, messageUuid, message, from);
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
                logger.LogAdminResponded();
                await Clients.Group(VhOfficersGroupName).AdminAnsweredChat(conferenceId, to);
            }

            logger.LogPushingMessageToHistory(sendMessageDto.MessageUuid);
            await videoApiClient.AddInstantMessageToConferenceAsync(conferenceId, new AddInstantMessageRequest
            {
                From = from,
                To = isTargetAdmin ? DefaultAdminName : sendMessageDto.ParticipantUsername,
                MessageText = message
            });
        }
        catch (Exception ex)
        {
            logger.LogErrorSendingMessage(ex,to, conferenceId);
        }
    }

    public async Task SendHeartbeat(Guid conferenceId, Guid participantId, Heartbeat heartbeat)
    {
        try
        {
            var dto = heartbeatRequestMapper.MapToHealth(heartbeat);
            await Clients.Group(VhOfficersGroupName).ReceiveHeartbeat
            (
                conferenceId, participantId, dto, heartbeat.BrowserName, heartbeat.BrowserVersion,
                heartbeat.OperatingSystem, heartbeat.OperatingSystemVersion
            );
            var conference = await conferenceService.GetConference(conferenceId);
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

            var addHeartbeatRequest = heartbeatRequestMapper.MapToRequest(heartbeat);
            await videoApiClient.SaveHeartbeatDataForParticipantAsync(conferenceId, participantId,
                addHeartbeatRequest);
        }
        catch (Exception ex)
        {
            logger.LogErrorSendingHeartbeat(ex);
        }
    }

    public async Task SendTransferRequest(Guid conferenceId, Guid participantId, TransferDirection transferDirection)
    {
        try
        {
            var conference = await conferenceService.GetConference(conferenceId);

            var transferringParticipant = conference.Participants.SingleOrDefault(x => x.Id == participantId);
            var transferringEndpoint = conference.Endpoints.SingleOrDefault(x => x.Id == participantId);
            if (transferringParticipant == null && transferringEndpoint == null)
            {
                logger.LogParticipantOrEndpointNotFound(participantId, conferenceId);
                throw new ParticipantNotFoundException(conferenceId, participantId);
            }

            await Clients.Group(VhOfficersGroupName)
                .HearingTransfer(conferenceId, participantId, transferDirection);
            logger.LogParticipantTransfer(participantId, conferenceId, transferDirection.ToString());

            foreach (var participant in conference.Participants)
            {
                await Clients.Group(participant.Username.ToLowerInvariant())
                    .HearingTransfer(conferenceId, participantId, transferDirection);
            }
        }
        catch (Exception ex)
        {
            logger.LogErrorTransferringParticipant(ex);
        }
    }

    public async Task SendMediaDeviceStatus(Guid conferenceId, Guid participantId, ParticipantMediaStatus mediaStatus)
    {
        try
        {
            var conference = await conferenceService.GetConference(conferenceId);

            var participant = conference.Participants.SingleOrDefault(x => x.Id == participantId);
            if (participant == null)
            {
                logger.LogParticipantDoesNotExistInConference(participantId, conferenceId);
                throw new ParticipantNotFoundException(conferenceId, Context.User.Identity.Name);
            }

            await conferenceVideoControlStatusService.UpdateMediaStatusForParticipantInConference(conferenceId,
                participant.Id.ToString(), mediaStatus);

            var groupNames = new List<string> { VhOfficersGroupName };
            groupNames.AddRange(conference.Participants.Where(x => x.IsHost())
                .Select(h => h.Username.ToLowerInvariant()));
            foreach (var groupName in groupNames)
            {
                await Clients.Group(groupName)
                    .ParticipantMediaStatusMessage(participantId, conferenceId, mediaStatus);
            }

            logger.LogParticipantDeviceStatusUpdated(participantId, conferenceId);

        }
        catch (Exception ex)
        {
            logger.LogErrorUpdatingDeviceStatus(ex);
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
            var conference = await conferenceService.GetConference(conferenceId);
            var participant = conference.Participants.Single(x => x.Id == participantId);
            var linkedParticipants = GetLinkedParticipants(conference, participant);

            await Clients.Group(participant.Username.ToLowerInvariant())
                .ParticipantRemoteMuteMessage(participantId, conferenceId, isRemoteMuted);
            logger.LogTrace(
                "Participant remote mute status updated: Participant Id: {ParticipantId} | Conference Id: {ConferenceId} to {IsRemoteMuted}",
                participantId, conferenceId, isRemoteMuted);
            Task.WaitAll(
                linkedParticipants.Select(linkedParticipant => Clients
                    .Group(linkedParticipant.Username.ToLowerInvariant())
                    .ParticipantRemoteMuteMessage(linkedParticipant.Id, conferenceId, isRemoteMuted)).ToArray());

        }
        catch (Exception ex)
        {
            logger.LogErrorUpdatingParticipantRemoteMuteStatus(ex, participantId, conferenceId, isRemoteMuted);
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
            await conferenceManagementService.UpdateParticipantHandStatusInConference(conferenceId, participantId,
                isRaised);
        }
        catch (Exception ex)
        {
            logger.LogErrorUpdatingParticipantHandStatus(ex, participantId, conferenceId, isRaised);
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
            var conference = await conferenceService.GetConference(conferenceId);
            var participant = conference.Participants.SingleOrDefault(x => x.Id == participantId);
            if (participant == null)
            {

                logger.LogParticipantDoesNotExistInConference(participantId, conferenceId);
                throw new ParticipantNotFoundException(conferenceId, participantId);
            }

            await Clients.Group(participant.Username.ToLowerInvariant())
                .UpdateParticipantLocalMuteMessage(conferenceId, participantId, muted);

        }
        catch (Exception ex)
        {
            logger.LogErrorUpdatingParticipantLocalMuteStatus(ex, participantId, conferenceId, muted);
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
            var conference = await conferenceService.GetConference(conferenceId);
            var participants = conference.Participants.Where(x => !x.IsHost());

            foreach (var participant in participants)
            {
                await Clients.Group(participant.Username.ToLowerInvariant())
                    .UpdateParticipantLocalMuteMessage(conferenceId, participant.Id, muted);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex,
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
    public async Task SendAudioRestartAction(Guid conferenceId, Guid participantId)
    {
        try
        {
            var conference = await conferenceService.GetConference(conferenceId);
            var otherHosts = conference.Participants
                .Where(x => x.IsHost() && x.Id != participantId)
                .ToArray();

            if (otherHosts.Length != 0)
                foreach (var host in otherHosts)
                    await Clients.Group(host.Username.ToLowerInvariant()).AudioRestartActioned(conferenceId);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error occured when updating other hosts in conference {ConferenceId}", conferenceId);
        }
    }
    
    
    /// <summary>
    /// Send a message to all other hosts in the conference, that the audio recording has been manually paused.
    /// </summary>
    /// <param name="conferenceId">The UUID for a conference</param>
    /// <param name="state">True if recording is Paused, False if recording in progress</param>
    [Authorize("Host")]
    public async Task SendAudioRecordingPaused(Guid conferenceId, bool state)
    {
        try
        {
            var conference = await conferenceService.GetConference(conferenceId);
            var hosts = conference.Participants
                .Where(x => x.IsHost())
                .ToArray();
            
            if (hosts.Length != 0)
                foreach (var host in hosts)
                    await Clients.Group(host.Username.ToLowerInvariant()).AudioRecordingPaused(conferenceId, state);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error occured when updating hosts in conference {ConferenceId}", conferenceId);
        }
    }

    private async Task AddUserToConferenceGroups(bool isAdmin)
    {
        var conferenceIds = await GetConferenceIds(isAdmin);
        var tasks = conferenceIds.Select(c => Groups.AddToGroupAsync(Context.ConnectionId, c.ToString())).ToArray();

        await Task.WhenAll(tasks);
    }

    private async Task AddUserToUserGroup(bool isAdmin, bool isStaffMember)
    {
        if (isAdmin)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, VhOfficersGroupName);
        }

        if (isStaffMember)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, StaffMembersGroupName);
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, Context.User.Identity!.Name!.ToLowerInvariant());
    }

    private async Task RemoveUserFromUserGroup(bool isAdmin, bool isStaffMember)
    {
        if (isAdmin)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, VhOfficersGroupName);
        }

        if (isStaffMember)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, StaffMembersGroupName);
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
        if (!isAdmin) return Array.Empty<Guid>();
        var conferences = await videoApiClient.GetConferencesTodayAsync(Array.Empty<string>());
        return conferences.Select(x => x.Id);
        
    }

    private bool IsSenderAdmin()
    {
        return Context.User.IsInRole(AppRoles.VhOfficerRole);
    }

    private bool IsSenderStaffMember()
    {
        return Context.User.IsInRole(AppRoles.StaffMember);
    }

    private string GetObfuscatedUsernameAsync(string username)
    {
        return userProfileService.GetObfuscatedUsername(username);
    }

    private async Task SendToParticipant(SendMessageDto dto)
    {
        var participant = dto.Conference.Participants.Single(x =>
            x.Username.Equals(dto.ParticipantUsername, StringComparison.InvariantCultureIgnoreCase));

        var username = userProfileService.GetObfuscatedUsername(participant.Username);
        logger.LogSendingMessageToGroup(dto.MessageUuid, username);

        var from = participant.Id.ToString() == dto.To ? dto.From : participant.Id.ToString();

        await Clients.Group(participant.Username.ToLowerInvariant())
            .ReceiveMessage(dto.Conference.Id, from, dto.FromDisplayName, dto.To, dto.Message, dto.Timestamp,
                dto.MessageUuid);
    }

    private async Task SendToAdmin(SendMessageDto dto, string fromId)
    {
        var groupName = dto.Conference.Id.ToString();
        logger.LogSendingMessageToGroup(dto.MessageUuid, groupName);
        var from = string.IsNullOrEmpty(fromId) ? dto.From : fromId;
        await Clients.Group(groupName)
            .ReceiveMessage(dto.Conference.Id, from, dto.FromDisplayName, dto.To, dto.Message, dto.Timestamp,
                dto.MessageUuid);
    }

    private static List<Participant> GetLinkedParticipants(Conference conference, Participant participant)
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
