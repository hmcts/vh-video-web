using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using VideoApi.Client;
using VideoApi.Contract.Requests;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Exceptions;

namespace VideoWeb.EventHub.Services;

public interface IConferenceManagementService
{
    /// <summary>
    /// Update the hand raised status of a participant in a conference
    /// </summary>
    /// <param name="conferenceId"></param>
    /// <param name="participantId"></param>
    /// <param name="isRaised"></param>
    /// <returns></returns>
    Task UpdateParticipantHandStatusInConference(Guid conferenceId, Guid participantId, bool isRaised, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// A non-host participant leaves the conference. Not to be confused with a host leaving or a host dismissing a participant.
    /// </summary>
    /// <param name="conferenceId"></param>
    /// <param name="username"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    Task ParticipantLeaveConferenceAsync(Guid conferenceId, string username, CancellationToken cancellationToken = default);
}

public class ConferenceManagementService(
    IConferenceService conferenceService,
    IHubContext<Hub.EventHub, IEventHubClient> hubContext,
    IVideoApiClient videoApiClient,
    ILogger<ConferenceManagementService> logger)
    : IConferenceManagementService
{
    public async Task UpdateParticipantHandStatusInConference(Guid conferenceId, Guid participantId, bool isRaised, CancellationToken cancellationToken = default)
    {
        var conference = await conferenceService.GetConference(conferenceId, cancellationToken);
        var participant = conference.Participants.Find(x => x.Id == participantId);
        if (participant == null) throw new ParticipantNotFoundException(conferenceId, participantId);
        var linkedParticipants = GetLinkedParticipants(conference, participant);

        var groupNames = new List<string> { participant.Username.ToLowerInvariant() };
        groupNames.AddRange(conference.Participants.Where(x => x.IsHost()).Select(h => h.Username.ToLowerInvariant()));

        foreach (var groupName in groupNames)
        {
            await hubContext.Clients.Group(groupName)
                .ParticipantHandRaiseMessage(participantId, conferenceId, isRaised);
        }
               
        logger.LogTrace(
            "Participant hand status updated: Participant Id: {ParticipantId} | Conference Id: {ConferenceId} to {IsHandRaised}",
            participantId, conferenceId, isRaised);
        foreach (var linkedParticipant in linkedParticipants)
        {
            await hubContext.Clients
                .Group(linkedParticipant.Username.ToLowerInvariant())
                .ParticipantHandRaiseMessage(linkedParticipant.Id, conferenceId, isRaised);
            logger.LogTrace(
                "Participant hand status updated: Participant Id: {ParticipantId} | Conference Id: {ConferenceId} to {IsHandRaised}",
                linkedParticipant.Id, conferenceId, isRaised);
        }
    }

    public async Task ParticipantLeaveConferenceAsync(Guid conferenceId, string username, CancellationToken cancellationToken = default)
    {
        var conference = await conferenceService.GetConference(conferenceId, cancellationToken);
        var participant = conference.Participants.Find(x => x.Username.Equals(username, StringComparison.CurrentCultureIgnoreCase));
        if (participant == null) throw new ParticipantNotFoundException(conferenceId, username);
        
        await videoApiClient.TransferParticipantAsync(conferenceId, new TransferParticipantRequest
        {
            ParticipantId = participant.Id,
            TransferType = TransferType.Dismiss
        }, cancellationToken);

        logger.LogTrace("Participant left conference: Participant Id: {ParticipantId} | Conference Id: {ConferenceId}", participant.Id, conferenceId);
        foreach (var conferenceParticipant in conference.Participants.Where(x=> !x.IsStaffMember()))
        {
            await hubContext.Clients.Group(conferenceParticipant.Username.ToLowerInvariant())
                .NonHostTransfer(conferenceId, participant.Id, TransferDirection.Out);
        }
        await hubContext.Clients.Group(conferenceId.ToString())
            .NonHostTransfer(conferenceId, participant.Id, TransferDirection.Out);
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
