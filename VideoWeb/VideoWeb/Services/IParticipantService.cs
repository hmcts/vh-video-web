using System;
using System.Security.Claims;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using VideoApi.Contract.Consts;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Requests;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Controllers;
using VideoWeb.Helpers.Interfaces;
using VideoWeb.Mappings;

namespace VideoWeb.Services
{
    public interface IParticipantService
    {
        AddStaffMemberRequest InitialiseAddStaffMemberRequest(UserProfileResponse staffMemberProfile, string staffMemberEmail, ClaimsPrincipal user);
        bool CanStaffMemberJoinConference(ConferenceDetailsResponse originalConference);
        Task UpdateConferenceCache(ConferenceDetailsResponse response);
    }

    public class ParticipantService : IParticipantService
    {
        private readonly IConferenceCache _conferenceCache;
        private readonly ILogger<ParticipantsController> _logger;
        private readonly IMapperFactory _mapperFactory;
        private readonly IParticipantsUpdatedEventNotifier _participantsUpdatedEventNotifier;

        public ParticipantService(IConferenceCache conferenceCache, ILogger<ParticipantsController> logger,
            IMapperFactory mapperFactory, IParticipantsUpdatedEventNotifier participantsUpdatedEventNotifier)
        {
            _conferenceCache = conferenceCache;
            _logger = logger;
            _mapperFactory = mapperFactory;
            _participantsUpdatedEventNotifier = participantsUpdatedEventNotifier;
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
                Name = user.Identity.Name,
                DisplayName = staffMemberProfile.DisplayName,
                UserRole = UserRole.StaffMember,
                ContactEmail = staffMemberEmail
            };
        }

        public bool CanStaffMemberJoinConference(ConferenceDetailsResponse originalConference)
            {
            return originalConference.ScheduledDateTime < DateTime.UtcNow.AddMinutes(30) ||
                   (originalConference.ClosedDateTime != null && originalConference.ClosedDateTime > DateTime.UtcNow.AddMinutes(-120));
            }
            
            public async Task UpdateConferenceCache(ConferenceDetailsResponse response)
            {
                _logger.LogTrace($"Updating conference in cache: {JsonSerializer.Serialize(response)}");
                var conferenceMapper = _mapperFactory.Get<ConferenceDetailsResponse, Conference>();
                var conference = conferenceMapper.Map(response);

                await _conferenceCache.UpdateConferenceAsync(conference);
                await _participantsUpdatedEventNotifier.PushParticipantsUpdatedEvent(conference);
            }
    }
}
