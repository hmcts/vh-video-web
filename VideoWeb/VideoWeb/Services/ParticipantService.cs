using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text.Json;
using System.Threading.Tasks;
using BookingsApi.Client;
using Microsoft.Extensions.Logging;
using VideoApi.Client;
using VideoApi.Contract.Consts;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Requests;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.EventHub.Exceptions;
using VideoWeb.Helpers.Interfaces;
using VideoWeb.Mappings;

namespace VideoWeb.Services
{
    public class ParticipantService : IParticipantService
    {
        private readonly IVideoApiClient _videoApiClient;
        private readonly IBookingsApiClient _bookingApiClient;
        private readonly IConferenceCache _conferenceCache;
        private readonly ILogger<ParticipantService> _logger;
        private readonly IMapperFactory _mapperFactory;
        private readonly IParticipantsUpdatedEventNotifier _participantsUpdatedEventNotifier;
        private readonly int startingSoonMinutesThreshold = 30;
        private readonly int closedMinutesThreshold = 30;
        private readonly IConferenceService _conferenceService;
        
        public ParticipantService(IVideoApiClient videoApiClient, IConferenceCache conferenceCache,
            ILogger<ParticipantService> logger,
            IMapperFactory mapperFactory, IParticipantsUpdatedEventNotifier participantsUpdatedEventNotifier,
            IBookingsApiClient bookingApiClient, IConferenceService conferenceService)
        {
            _videoApiClient = videoApiClient;
            _conferenceCache = conferenceCache;
            _logger = logger;
            _mapperFactory = mapperFactory;
            _participantsUpdatedEventNotifier = participantsUpdatedEventNotifier;
            _bookingApiClient = bookingApiClient;
            _conferenceService = conferenceService;
        }
        
        public ParticipantService(IBookingsApiClient bookingApiClient, IConferenceService conferenceService)
        {
            _bookingApiClient = bookingApiClient;
            _conferenceService = conferenceService;
        }
        
        public AddStaffMemberRequest InitialiseAddStaffMemberRequest(UserProfileResponse staffMemberProfile, string staffMemberEmail)
        {
            return new AddStaffMemberRequest
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
            conference.AddParticipant(requestToParticipantMapper.Map(response.ParticipantDetails));
            
            _logger.LogTrace($"Updating conference in cache: {JsonSerializer.Serialize(conference)}");
            await _conferenceCache.UpdateConferenceAsync(conference);
            await _participantsUpdatedEventNotifier.PushParticipantsUpdatedEvent(conference, conference.Participants);
        }
        
        public async Task<List<ParticipantForUserResponse>> GetParticipantsByConferenceIdAsync(Guid conferenceId)
        {
            var conference = await _conferenceService.GetOrAddConferenceAsync(conferenceId);
            
            var participantContactDetailsResponseVhoMapper = new ParticipantInConferenceResponseMapper();
            
            
            return conference.Participants.Select(participantContactDetailsResponseVhoMapper.Map).ToList();
        }
        
        public async Task<List<ParticipantContactDetailsResponseVho>>
            GetParticipantsWithContactDetailsByConferenceIdAsync(Guid conferenceId)
        {
            var conference = await _conferenceService.GetOrAddConferenceAsync(conferenceId);
            
            _logger.LogTrace($"Retrieving booking participants for hearing ${conference.HearingId}");
            var hostsInHearingsToday = await _videoApiClient.GetHostsInHearingsTodayAsync();
            
            var participantContactDetailsResponseVhoMapper = _mapperFactory
                .Get<Conference, IEnumerable<VideoApi.Contract.Responses.ParticipantInHearingResponse>,
                    IEnumerable<ParticipantContactDetailsResponseVho>>();
            var response = participantContactDetailsResponseVhoMapper.Map(conference, hostsInHearingsToday);
            
            return response.ToList();
        }
        
        public async Task<LoggedParticipantResponse> GetCurrentParticipantAsync(Guid conferenceId,
            ClaimsPrincipal user)
        {
            var participantsRoles = new List<Role>
            {
                Role.Judge,
                Role.Individual,
                Role.Representative,
                Role.JudicialOfficeHolder,
                Role.QuickLinkParticipant,
                Role.QuickLinkObserver,
                Role.StaffMember
            };
            
            var claimsPrincipalToUserProfileResponseMapper =
                _mapperFactory.Get<ClaimsPrincipal, UserProfileResponse>();
            var profile = claimsPrincipalToUserProfileResponseMapper.Map(user);
            
            var response = new LoggedParticipantResponse
            {
                AdminUsername = user.Identity.Name,
                DisplayName = "Admin",
                Role = Role.VideoHearingsOfficer
            };
            
            if (profile.Roles.Exists(role => participantsRoles.Contains(role)))
            {
                var conference = await _conferenceService.GetOrAddConferenceAsync(conferenceId);
                
                var participantFromCache = conference.Participants
                    .SingleOrDefault(
                        x => x.Username.Equals(profile.Username, StringComparison.CurrentCultureIgnoreCase));
                
                if (participantFromCache == null)
                {
                    throw new ParticipantNotFoundException(conferenceId, profile.Username);
                }
                
                response = new LoggedParticipantResponse
                {
                    ParticipantId = participantFromCache.Id,
                    DisplayName = participantFromCache.DisplayName,
                    Role = participantFromCache.Role
                };
            }
            
            return response;
        }
    }
}
