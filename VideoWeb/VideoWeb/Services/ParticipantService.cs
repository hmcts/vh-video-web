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
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.EventHub.Exceptions;
using VideoWeb.Helpers.Interfaces;
using ParticipantResponse = VideoApi.Contract.Responses.ParticipantResponse;

namespace VideoWeb.Services
{
    public class ParticipantService : IParticipantService
    {
        private readonly IConferenceService _conferenceService;
        private readonly ILogger<ParticipantService> _logger;
        private readonly IParticipantsUpdatedEventNotifier _participantsUpdatedEventNotifier;
        private const int StartingSoonMinutesThreshold = 30;
        private const int ClosedMinutesThreshold = 30;

        public ParticipantService(IConferenceService conferenceService, ILogger<ParticipantService> logger,
            IParticipantsUpdatedEventNotifier participantsUpdatedEventNotifier)
        {
            _conferenceService = conferenceService;
            _logger = logger;
            _participantsUpdatedEventNotifier = participantsUpdatedEventNotifier;
        }

        public AddStaffMemberRequest InitialiseAddStaffMemberRequest(UserProfileResponse staffMemberProfile,
            string staffMemberEmail)
        {
            return new AddStaffMemberRequest()
            {
                FirstName = staffMemberProfile.FirstName,
                LastName = staffMemberProfile.LastName,
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
            return originalConference.ScheduledDateTime < DateTime.UtcNow.AddMinutes(StartingSoonMinutesThreshold) ||
                   (originalConference.ClosedDateTime != null && originalConference.ClosedDateTime >
                       DateTime.UtcNow.AddMinutes(-ClosedMinutesThreshold));
        }
        
        public async Task<Conference> AddParticipantToConferenceCache(Guid conferenceId, ParticipantResponse response)
        {
            var conference = await _conferenceService.GetConference(conferenceId);

            if (conference == null)
            {
                throw new ConferenceNotFoundException(conferenceId);
            }

            conference.AddParticipant(ParticipantCacheMapper.Map(response));

            _logger.LogTrace("Updating conference in cache: {Conference}", JsonSerializer.Serialize(conference));
            
            await _conferenceService.UpdateConferenceAsync(conference);
            await _participantsUpdatedEventNotifier.PushParticipantsUpdatedEvent(conference, conference.Participants);
            return conference;
        }
    }
}
