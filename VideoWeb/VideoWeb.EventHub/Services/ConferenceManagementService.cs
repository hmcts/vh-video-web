using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using VideoApi.Client;
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

public class ConferenceManagementService : IConferenceManagementService
{
    private readonly IConferenceCache _conferenceCache;
    private readonly IVideoApiClient _videoApiClient;
    private readonly IHubContext<VideoWeb.EventHub.Hub.EventHub, IEventHubClient> _hubContext;
    private readonly ILogger<ConferenceManagementService> _logger;

    public ConferenceManagementService(IConferenceCache conferenceCache, IVideoApiClient videoApiClient, IHubContext<Hub.EventHub, IEventHubClient> hubContext, ILogger<ConferenceManagementService> logger)
    {
        _conferenceCache = conferenceCache;
        _videoApiClient = videoApiClient;
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task UpdateParticipantHandStatusInConference(Guid conferenceId, Guid participantId, bool isRaised)
    {
        var conference = await GetConference(conferenceId);
        var participant = conference.Participants.Find(x => x.Id == participantId);
        if (participant == null) throw new ParticipantNotFoundException(conferenceId, participantId);
        var linkedParticipants = GetLinkedParticipants(conference, participant);

        var groupNames = new List<string> { participant.Username.ToLowerInvariant() };
        groupNames.AddRange(conference.Participants.Where(x => x.IsHost()).Select(h => h.Username.ToLowerInvariant()));

        foreach (var groupName in groupNames)
        {
            
            await _hubContext.Clients.Group(groupName)
                .ParticipantHandRaiseMessage(participantId, conferenceId, isRaised);
        }
               
        _logger.LogTrace(
            "Participant hand status updated: Participant Id: {ParticipantId} | Conference Id: {ConferenceId} to {IsHandRaised}",
            participantId, conferenceId, isRaised);
        foreach (var linkedParticipant in linkedParticipants)
        {
            await _hubContext.Clients
                .Group(linkedParticipant.Username.ToLowerInvariant())
                .ParticipantHandRaiseMessage(linkedParticipant.Id, conferenceId, isRaised);
            _logger.LogTrace(
                "Participant hand status updated: Participant Id: {ParticipantId} | Conference Id: {ConferenceId} to {IsHandRaised}",
                linkedParticipant.Id, conferenceId, isRaised);
        }
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
