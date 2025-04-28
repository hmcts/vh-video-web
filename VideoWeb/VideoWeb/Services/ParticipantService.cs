using System;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using VideoApi.Contract.Consts;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Requests;
using VideoApi.Contract.Responses;
using VideoWeb.Common;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Logging;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.EventHub.Exceptions;
using VideoWeb.Helpers.Interfaces;
using ParticipantResponse = VideoApi.Contract.Responses.ParticipantResponse;

namespace VideoWeb.Services;

public interface IParticipantService
{
    AddStaffMemberRequest InitialiseAddStaffMemberRequest(UserProfileResponse staffMemberProfile,
        string staffMemberEmail);
    
    bool CanStaffMemberJoinConference(ConferenceDetailsResponse originalConference);
    
    Task<Conference> AddParticipantToConferenceCache(Guid conferenceId, ParticipantResponse response);
}

public class ParticipantService(
    IConferenceService conferenceService,
    ILogger<ParticipantService> logger,
    IParticipantsUpdatedEventNotifier participantsUpdatedEventNotifier)
    : IParticipantService
{
    private const int StartingSoonMinutesThreshold = 30;
    private const int ClosedMinutesThreshold = 30;
    
    public AddStaffMemberRequest InitialiseAddStaffMemberRequest(UserProfileResponse staffMemberProfile,
        string staffMemberEmail)
    {
        return new AddStaffMemberRequest
        {
            Username = staffMemberProfile.Username,
            HearingRole = HearingRoleName.StaffMember,
            Name = staffMemberProfile.Name,
            DisplayName = staffMemberProfile.DisplayName,
            UserRole = UserRole.StaffMember,
            ContactEmail = staffMemberEmail
        };
    }
    
    public bool CanStaffMemberJoinConference(ConferenceDetailsResponse originalConference)
    {
        // Check if the conference is scheduled to start within the next threshold minutes or has already started
        var isConferenceStartingSoonOrStarted = originalConference.ScheduledDateTime <
                                                DateTime.UtcNow.AddMinutes(StartingSoonMinutesThreshold);
        
        // Check if the conference has closed within the last threshold minutes
        var hasConferenceRecentlyClosed = originalConference.ClosedDateTime != null &&
                                          originalConference.ClosedDateTime >
                                          DateTime.UtcNow.AddMinutes(-ClosedMinutesThreshold);
        
        // A staff member can join the conference if it is starting soon, has already started, or has recently closed
        return isConferenceStartingSoonOrStarted && originalConference.ClosedDateTime == null || hasConferenceRecentlyClosed;
    }
    
    public async Task<Conference> AddParticipantToConferenceCache(Guid conferenceId, ParticipantResponse response)
    {
        var conference = await conferenceService.GetConference(conferenceId);
        
        if (conference == null)
        {
            throw new ConferenceNotFoundException(conferenceId);
        }
        
        conference.AddParticipant(ParticipantCacheMapper.Map(response));
        
        logger.LogUpdatingConferenceInCache(JsonSerializer.Serialize(conference));
        
        await conferenceService.UpdateConferenceAsync(conference);
        await participantsUpdatedEventNotifier.PushParticipantsUpdatedEvent(conference, conference.Participants);
        return conference;
    }
}
