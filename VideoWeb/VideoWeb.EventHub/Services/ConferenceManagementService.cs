using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using VideoWeb.Common.Models;
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
    Task UpdateParticipantHandStatusInConference(Guid conferenceId, Guid participantId, bool isRaised);
}

public class ConferenceManagementService(
    IConferenceService conferenceService,
    IHubContext<Hub.EventHub, IEventHubClient> hubContext,
    ILogger<ConferenceManagementService> logger)
    : IConferenceManagementService
{
    public async Task UpdateParticipantHandStatusInConference(Guid conferenceId, Guid participantId, bool isRaised)
    {
        var conference = await conferenceService.GetConference(conferenceId);
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
