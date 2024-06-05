using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using BookingsApi.Client;
using BookingsApi.Contract.V2.Responses;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using VideoApi.Client;
using VideoApi.Contract.Responses;
using VideoWeb.Common;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Exceptions;
using VideoWeb.EventHub.Hub;

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
    

    
    private List<ParticipantDto> GetLinkedParticipants(ConferenceDto conferenceDto, ParticipantDto participantDto)
    {
        if (participantDto.IsJudicialOfficeHolder())
        {
            return conferenceDto.Participants
                .Where(x => x.IsJudicialOfficeHolder() && x.Id != participantDto.Id).ToList();
        }

        return conferenceDto.Participants
            .Where(p => participantDto.LinkedParticipants.Select(x => x.LinkedId)
                .Contains(p.Id)
            ).ToList();
    }
}
