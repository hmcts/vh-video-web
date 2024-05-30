using System;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using VideoApi.Client;
using VideoApi.Contract.Consts;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Requests;
using VideoApi.Contract.Responses;
using VideoWeb.Common;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Controllers;
using VideoWeb.EventHub.Exceptions;
using VideoWeb.Helpers.Interfaces;
using VideoWeb.Mappings;

namespace VideoWeb.Services
{
    public class ParticipantService : IParticipantService
    {
        private readonly IConferenceService _conferenceService;
        private readonly ILogger<ParticipantService> _logger;
        private readonly IMapperFactory _mapperFactory;
        private readonly IParticipantsUpdatedEventNotifier _participantsUpdatedEventNotifier;
        private readonly int startingSoonMinutesThreshold = 30;
        private readonly int closedMinutesThreshold = 30;

        public ParticipantService(IConferenceService conferenceService ,ILogger<ParticipantService> logger,
            IMapperFactory mapperFactory, IParticipantsUpdatedEventNotifier participantsUpdatedEventNotifier)
        {
            _conferenceService = conferenceService;
            _logger = logger;
            _mapperFactory = mapperFactory;
            _participantsUpdatedEventNotifier = participantsUpdatedEventNotifier;
        }

        public ParticipantService()
        {
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
            return originalConference.ScheduledDateTime < DateTime.UtcNow.AddMinutes(startingSoonMinutesThreshold) ||
                   (originalConference.ClosedDateTime != null && originalConference.ClosedDateTime >
                       DateTime.UtcNow.AddMinutes(-closedMinutesThreshold));
        }

        public async Task AddStaffMemberToConferenceCache(AddStaffMemberResponse response)
        {
            var conference = await _conferenceService.GetConference(response.ConferenceId);

            if (conference == null)
            {
                throw new ConferenceNotFoundException(response.ConferenceId);
            }

            var requestToParticipantMapper = _mapperFactory.Get<ParticipantDetailsResponse, Participant>();
            conference.AddParticipant(requestToParticipantMapper.Map(response.ParticipantDetails));

            _logger.LogTrace("Updating conference in cache: {Conference}", JsonSerializer.Serialize(conference));
            await _conferenceService.ConferenceCache.UpdateConferenceAsync(conference);
            await _participantsUpdatedEventNotifier.PushParticipantsUpdatedEvent(conference, conference.Participants);
        }
    }
}
