using System;
using System.Linq;
using System.Security.Claims;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using VideoApi.Client;
using VideoApi.Contract.Consts;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Requests;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Controllers;
using VideoWeb.EventHub.Exceptions;
using VideoWeb.EventHub.InternalHandlers.Core;
using VideoWeb.EventHub.InternalHandlers.Models;
using VideoWeb.Mappings;

namespace VideoWeb.Services
{
    public class ParticipantService : IParticipantService
    {
        private readonly IVideoApiClient _videoApiClient;
        private readonly IConferenceCache _conferenceCache;
        private readonly ILogger<ParticipantsController> _logger;
        private readonly IMapperFactory _mapperFactory;
        private readonly IInternalEventHandlerFactory _internalEventHandlerFactory;
        private readonly int startingSoonMinutesThreshold = 30;
        private readonly int closedMinutesThreshold = 30;

        public ParticipantService(IVideoApiClient videoApiClient, IConferenceCache conferenceCache,
            ILogger<ParticipantsController> logger,
            IMapperFactory mapperFactory, IInternalEventHandlerFactory internalEventHandlerFactory)
        {
            _videoApiClient = videoApiClient;
            _conferenceCache = conferenceCache;
            _logger = logger;
            _mapperFactory = mapperFactory;
            _internalEventHandlerFactory = internalEventHandlerFactory;
        }

        public AddStaffMemberRequest InitialiseAddStaffMemberRequest(UserProfileResponse staffMemberProfile,
            string staffMemberEmail, ClaimsPrincipal user)
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
            var conference = await _conferenceCache.GetOrAddConferenceAsync(response.ConferenceId,
                () => _videoApiClient.GetConferenceDetailsByIdAsync(response.ConferenceId));

            if (conference == null)
            {
                throw new ConferenceNotFoundException(response.ConferenceId);
            }

            var requestToParticipantMapper = _mapperFactory.Get<ParticipantDetailsResponse, Participant>();
            var participant = requestToParticipantMapper.Map(response.ParticipantDetails);
            conference.AddParticipant(participant);

            _logger.LogDebug("Updating conference in cache: {ConferenceObject}", JsonSerializer.Serialize(conference));
            await _conferenceCache.UpdateConferenceAsync(conference);

            var participantsToResponseMapper = _mapperFactory.Get<Participant, Conference, ParticipantResponse>();
            var eventDto = new ParticipantsUpdatedEventDto
            {
                ConferenceId = conference.Id,
                Participants = conference.Participants
                    .Select(participant => participantsToResponseMapper.Map(participant, conference)).ToList()
            };
            var handler = _internalEventHandlerFactory.Get(eventDto);
            await handler.HandleAsync(eventDto);
        }
    }
}
