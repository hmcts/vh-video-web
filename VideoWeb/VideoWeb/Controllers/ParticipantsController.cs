using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Request;
using VideoWeb.Contract.Responses;
using VideoWeb.EventHub.Exceptions;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Models;
using VideoWeb.Mappings;
using VideoApi.Client;
using VideoApi.Contract.Responses;
using VideoApi.Contract.Requests;
using VideoApi.Contract.Enums;
using VideoWeb.Middleware;
using VideoWeb.Services;

namespace VideoWeb.Controllers
{
    [Produces("application/json")]
    [ApiController]
    [Route("conferences")]
    public class ParticipantsController : Controller
    {
        private readonly IVideoApiClient _videoApiClient;
        private readonly IEventHandlerFactory _eventHandlerFactory;
        private readonly IConferenceCache _conferenceCache;
        private readonly ILogger<ParticipantsController> _logger;
        private readonly IMapperFactory _mapperFactory;
        private readonly IParticipantService _participantService;

        public ParticipantsController(
            IVideoApiClient videoApiClient,
            IEventHandlerFactory eventHandlerFactory,
            IConferenceCache conferenceCache,
            ILogger<ParticipantsController> logger,
            IMapperFactory mapperFactory,
            IParticipantService participantService
        )
        {
            _videoApiClient = videoApiClient;
            _eventHandlerFactory = eventHandlerFactory;
            _conferenceCache = conferenceCache;
            _logger = logger;
            _participantService = participantService;
            _mapperFactory = mapperFactory;
        }

        [ServiceFilter(typeof(CheckParticipantCanAccessConferenceAttribute))]
        [HttpPost("{conferenceId}/participantstatus")]
        [SwaggerOperation(OperationId = "UpdateParticipantStatus")]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        [ProducesResponseType((int)HttpStatusCode.NoContent)]
        public async Task<IActionResult> UpdateParticipantStatusAsync(Guid conferenceId,
            UpdateParticipantStatusEventRequest updateParticipantStatusEventRequest)
        {
            var conference = await _conferenceCache.GetOrAddConferenceAsync(conferenceId,
                () => _videoApiClient.GetConferenceDetailsByIdAsync(conferenceId));

            var participantId = GetIdForParticipantByUsernameInConference(conference);
            var eventTypeMapper = _mapperFactory.Get<EventType, string>();
            var conferenceEventRequest = new ConferenceEventRequest
            {
                ConferenceId = conferenceId.ToString(),
                ParticipantId = participantId.ToString(),
                EventId = Guid.NewGuid().ToString(),
                EventType = updateParticipantStatusEventRequest.EventType,
                TimeStampUtc = DateTime.UtcNow,
                Reason = eventTypeMapper.Map(updateParticipantStatusEventRequest.EventType)
            };

            var callbackEventMapper = _mapperFactory.Get<ConferenceEventRequest, Conference, CallbackEvent>();
            var callbackEvent = callbackEventMapper.Map(conferenceEventRequest, conference);
            var handler = _eventHandlerFactory.Get(callbackEvent.EventType);
            try
            {
                await handler.HandleAsync(callbackEvent);
            }
            catch (ConferenceNotFoundException e)
            {
                _logger.LogError(e, $"Unable to retrieve conference details");
                return BadRequest(e);
            }

            try
            {
                await _videoApiClient.RaiseVideoEventAsync(conferenceEventRequest);

                return NoContent();
            }
            catch (VideoApiException e)
            {
                _logger.LogError(e, $"Unable to update participant status for " +
                                    $"participant: {participantId} in conference: {conferenceId}");
                return StatusCode(e.StatusCode, e.Response);
            }
        }

        private Guid GetIdForParticipantByUsernameInConference(Conference conference)
        {
            var username = User.Identity.Name;
            return conference.Participants
                .Single(x => x.Username.Equals(username, StringComparison.CurrentCultureIgnoreCase)).Id;
        }
       
        [Authorize(AppRoles.VhOfficerRole)]
        [HttpGet("{conferenceId}/participant/{participantId}/heartbeatrecent")]
        [SwaggerOperation(OperationId = "GetHeartbeatDataForParticipant")]
        [ProducesResponseType(typeof(ParticipantHeartbeatResponse[]), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        public async Task<IActionResult> GetHeartbeatDataForParticipantAsync(Guid conferenceId, Guid participantId)
        {
            try
            {
                var response = await _videoApiClient.GetHeartbeatDataForParticipantAsync(conferenceId, participantId);
                return Ok(response);
            }
            catch (VideoApiException e)
            {
                _logger.LogError(e,
                    $"Unable to get heartbeat data for participant: {participantId} in conference: {conferenceId}");
                return StatusCode(e.StatusCode, e.Response);
            }
        }

        [ServiceFilter(typeof(CheckParticipantCanAccessConferenceAttribute))]
        [HttpPost("{conferenceId}/participants/{participantId}/participantDisplayName")]
        [SwaggerOperation(OperationId = "UpdateParticipantDisplayName")]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        [ProducesResponseType((int)HttpStatusCode.NoContent)]
        public async Task<IActionResult> UpdateParticipantDisplayNameAsync(Guid conferenceId, Guid participantId,
            [FromBody] UpdateParticipantDisplayNameRequest participantRequest)
        {
            try
            {
                var apiRequest = _mapperFactory.Get<UpdateParticipantDisplayNameRequest, UpdateParticipantRequest>()
                    .Map(participantRequest);
                await _videoApiClient.UpdateParticipantDetailsAsync(conferenceId, participantId, apiRequest);
            }
            catch (VideoApiException ex)
            {
                _logger.LogError(ex,
                    "Unable to update participant details for participant: {ParticipantId} in conference: {ConferenceId}",
                    participantId, conferenceId);
                return StatusCode(ex.StatusCode, ex.Response);
            }

            return NoContent();
        }

        /// <summary>
        /// Get the participant details of a conference by id for VH officer
        /// </summary>
        /// <param name="conferenceId">The unique id of the conference</param>
        /// <returns>the participant details, if permitted</returns>
        [HttpGet("{conferenceId}/vhofficer/participants")]
        [ProducesResponseType(typeof(IEnumerable<ParticipantContactDetailsResponseVho>), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        [SwaggerOperation(OperationId = "GetParticipantsWithContactDetailsByConferenceId")]
        [Authorize(AppRoles.VhOfficerRole)]
        public async Task<IActionResult> GetParticipantsWithContactDetailsByConferenceIdAsync(Guid conferenceId)
        {
            if (conferenceId == Guid.Empty)
            {
                _logger.LogWarning("Unable to get conference when id is not provided");
                ModelState.AddModelError(nameof(conferenceId), $"Please provide a valid {nameof(conferenceId)}");

                return BadRequest(ModelState);
            }

            try
            {
                var conference = await _conferenceCache.GetOrAddConferenceAsync(conferenceId,
                    () => _videoApiClient.GetConferenceDetailsByIdAsync(conferenceId));

                _logger.LogTrace($"Retrieving booking participants for hearing ${conference.HearingId}");
                var hostsInHearingsToday = await _videoApiClient.GetHostsInHearingsTodayAsync();

                var participantContactDetailsResponseVhoMapper = _mapperFactory
                    .Get<Conference, IEnumerable<ParticipantInHearingResponse>,
                        IEnumerable<ParticipantContactDetailsResponseVho>>();
                var response = participantContactDetailsResponseVhoMapper.Map(conference, hostsInHearingsToday);

                return Ok(response);
            }
            catch (VideoApiException ex)
            {
                _logger.LogError(ex, $"Unable to retrieve conference: ${conferenceId}");

                return StatusCode(ex.StatusCode, ex.Response);
            }
        }

        [ServiceFilter(typeof(CheckParticipantCanAccessConferenceAttribute))]
        [HttpGet("{conferenceId}/participants")]
        [SwaggerOperation(OperationId = "GetParticipantsByConferenceId")]
        [ProducesResponseType(typeof(List<ParticipantForUserResponse>), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        public async Task<IActionResult> GetParticipantsByConferenceIdAsync(Guid conferenceId)
        {
            try
            {
                var response = await _videoApiClient.GetParticipantsByConferenceIdAsync(conferenceId);
                var participantForUserResponsesMapper = _mapperFactory
                    .Get<IEnumerable<ParticipantSummaryResponse>, List<ParticipantForUserResponse>>();
                var participants = participantForUserResponsesMapper.Map(response);
                return Ok(participants);
            }
            catch (VideoApiException e)
            {
                _logger.LogError(e, "Unable to retrieve participants for conference: {ConferenceId}", conferenceId);
                return StatusCode(e.StatusCode, e.Response);
            }
        }

        [HttpGet("{conferenceId}/currentparticipant")]
        [SwaggerOperation(OperationId = "GetCurrentParticipant")]
        [ProducesResponseType(typeof(LoggedParticipantResponse), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        public async Task<IActionResult> GetCurrentParticipantAsync(Guid conferenceId)
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

            try
            {
                var claimsPrincipalToUserProfileResponseMapper =
                    _mapperFactory.Get<ClaimsPrincipal, UserProfileResponse>();
                var profile = claimsPrincipalToUserProfileResponseMapper.Map(User);
                var response = new LoggedParticipantResponse
                {
                    AdminUsername = User.Identity.Name,
                    DisplayName = "Admin",
                    Role = Role.VideoHearingsOfficer
                };

                if (profile.Roles.Exists(role => participantsRoles.Contains(role)))
                {
                    var conference = await _conferenceCache.GetOrAddConferenceAsync(conferenceId,
                        () => _videoApiClient.GetConferenceDetailsByIdAsync(conferenceId));
                    if (conference != null)
                    {
                        var participant = conference.Participants
                            .Single(x =>
                                x.Username.Equals(profile.Username, StringComparison.CurrentCultureIgnoreCase));

                        response = new LoggedParticipantResponse
                        {
                            ParticipantId = participant.Id,
                            DisplayName = participant.DisplayName,
                            Role = participant.Role
                        };
                    }
                }

                return Ok(response);
            }
            catch (VideoApiException e)
            {
                _logger.LogError(e, "Unable to get current participant Id for conference: {ConferenceId}", conferenceId);
                return StatusCode(e.StatusCode, e.Response);
            }
        }

        [HttpPost("{conferenceId}/joinConference")]
        [SwaggerOperation(OperationId = "StaffMemberJoinConference")]
        [ProducesResponseType(typeof(ConferenceResponse), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        [Authorize(AppRoles.StaffMember)]
        public async Task<IActionResult> StaffMemberJoinConferenceAsync(Guid conferenceId)
        {
            try
            {
                var username = User.Identity.Name.ToLower().Trim();
                var originalConference = await _videoApiClient.GetConferenceDetailsByIdAsync(conferenceId);

                if (!_participantService.CanStaffMemberJoinConference(originalConference))
                {
                    _logger.LogWarning("Staff Member only can view hearing within 30 minutes of the Start time and 2 hours after the hearing has closed");
                    ModelState.AddModelError(nameof(conferenceId), $"Please select a valid conference {nameof(conferenceId)}");
                    return BadRequest(ModelState);
                }
                
                _logger.LogDebug("Attempting to assign {StaffMember} to conference {conferenceId}", username, conferenceId);

                var claimsPrincipalToUserProfileResponseMapper =
                    _mapperFactory.Get<ClaimsPrincipal, UserProfileResponse>();
                var staffMemberProfile = claimsPrincipalToUserProfileResponseMapper.Map(User);

                var response = await _videoApiClient.AddStaffMemberToConferenceAsync(conferenceId, _participantService.InitialiseAddStaffMemberRequest(staffMemberProfile, username, User));

                await _participantService.AddStaffMemberToConferenceCache(response);
                
                var updatedConference = await _videoApiClient.GetConferenceDetailsByIdAsync(conferenceId);
              
                var conferenceResponseVhoMapper = _mapperFactory.Get<ConferenceDetailsResponse, ConferenceResponse>();
                var mappedUpdatedConference = conferenceResponseVhoMapper.Map(updatedConference);
                
                return Ok(mappedUpdatedConference);
            }
            catch (VideoApiException e)
            {
                _logger.LogError(e, $"Unable to add staff member for " +
                                    $"conference: {conferenceId}");
                return StatusCode(e.StatusCode, e.Response);
            }
        }
    }
}
