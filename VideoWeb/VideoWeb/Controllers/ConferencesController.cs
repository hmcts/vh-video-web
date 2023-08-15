using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Security.Claims;
using System.Threading.Tasks;
using BookingsApi.Client;
using BookingsApi.Contract.V1.Responses;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Request;
using VideoWeb.Contract.Responses;
using VideoWeb.Helpers;
using VideoWeb.Mappings;
using VideoApi.Client;
using VideoApi.Contract.Requests;
using VideoApi.Contract.Responses;
using VideoWeb.Extensions;
using HostConference = VideoApi.Contract.Responses.ConferenceForHostResponse;
using IndividualConference = VideoApi.Contract.Responses.ConferenceForIndividualResponse;
using ConferenceForIndividualResponse = VideoWeb.Contract.Responses.ConferenceForIndividualResponse;
using ConferenceForHostResponse = VideoWeb.Contract.Responses.ConferenceForHostResponse;
using VideoWeb.Middleware;

namespace VideoWeb.Controllers
{
    [Produces("application/json")]
    [ApiController]
    [Route("conferences")]
    public class ConferencesController : Controller
    {
        private readonly IVideoApiClient _videoApiClient;
        private readonly ILogger<ConferencesController> _logger;
        private readonly IConferenceCache _conferenceCache;
        private readonly IMapperFactory _mapperFactory;
        private readonly IBookingsApiClient _bookingApiClient;

        public ConferencesController(
            IVideoApiClient videoApiClient,
            ILogger<ConferencesController> logger,
            IConferenceCache conferenceCache,
            IMapperFactory mapperFactory,
            IBookingsApiClient bookingApiClient)
        {
            _videoApiClient = videoApiClient;
            _logger = logger;
            _conferenceCache = conferenceCache;
            _mapperFactory = mapperFactory;
            _bookingApiClient = bookingApiClient;
        }

        /// <summary>
        /// Get conferences today for a host
        /// </summary>
        /// <returns>List of conferences, if any</returns>
        [HttpGet("hosts")]
        [ProducesResponseType(typeof(List<ConferenceForHostResponse>), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        [SwaggerOperation(OperationId = "GetConferencesForHost")]
        [Authorize("Judicial")]
        public async Task<ActionResult<List<ConferenceForHostResponse>>> GetConferencesForHostAsync()
        {
            _logger.LogDebug("GetConferencesForHost");
           
            try
            {
                var conferenceForHostResponseMapper = _mapperFactory.Get<HostConference, ConferenceForHostResponse>();
                var username = User.Identity.Name;
                var conferencesForHost = await _videoApiClient.GetConferencesTodayForHostAsync(username);
                var response = conferencesForHost
                    .Select(conferenceForHostResponseMapper.Map)
                    .ToList();
                return Ok(response);
            }
            catch (VideoApiException e)
            {
                _logger.LogError(e, "Unable to get conferences for user");
                return StatusCode(e.StatusCode, e.Response);
            }
        }

        /// <summary>
        /// Get conferences today for staff member with the specifed hearing venue names
        /// </summary>
        /// <returns>List of conferences, if any</returns>
        [HttpGet("staffmember")]
        [ProducesResponseType(typeof(List<ConferenceForHostResponse>), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        [SwaggerOperation(OperationId = "GetConferencesForStaffMember")]
        [Authorize("Judicial")]
        public async Task<ActionResult<List<ConferenceForHostResponse>>> GetConferencesForStaffMemberAsync([FromQuery] IEnumerable<string> hearingVenueNames)
        {
            _logger.LogDebug("GetConferencesForStaffMember");

            try
            {
                var conferenceForHostResponseMapper = _mapperFactory.Get<HostConference, ConferenceForHostResponse>();
                var hearingsForToday = await _bookingApiClient.GetHearingsForTodayByVenueAsync(hearingVenueNames);
                var request = new GetConferencesByHearingIdsRequest{ HearingRefIds = hearingsForToday.Select(x => x.Id).ToArray() };
                var conferencesForStaffMember = await _videoApiClient.GetConferencesForHostByHearingRefIdAsync(request);
                var response = conferencesForStaffMember
                    .Select(conferenceForHostResponseMapper.Map)
                    .ToList();
                return Ok(response);
            }
            catch (VideoApiException e)
            {
                _logger.LogError(e, "Unable to get conferences for staff member");
                return StatusCode(e.StatusCode, e.Response);
            }
        }

        /// <summary>
        /// Get conferences today for individual or representative excluding those that have been closed for over 120 minutes
        /// </summary>
        /// <returns>List of conferences, if any</returns>
        [HttpGet("individuals")]
        [ProducesResponseType(typeof(List<ConferenceForIndividualResponse>), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        [SwaggerOperation(OperationId = "GetConferencesForIndividual")]
        [Authorize("Individual")]
        public async Task<ActionResult<IEnumerable<ConferenceForIndividualResponse>>> GetConferencesForIndividual()
        {
            _logger.LogDebug("GetConferencesForIndividual");
            try
            {
                var username = User.Identity.Name;
                var conferencesForIndividual = await _videoApiClient.GetConferencesTodayForIndividualByUsernameAsync(username);
                conferencesForIndividual = conferencesForIndividual.Where(c => ConferenceHelper.HasNotPassed(c.Status, c.ClosedDateTime)).ToList();
                var conferenceForIndividualResponseMapper = _mapperFactory.Get<IndividualConference, ConferenceForIndividualResponse>();
                var response = conferencesForIndividual
                    .Select(conferenceForIndividualResponseMapper.Map)
                    .ToList();
                return Ok(response);
            }
            catch (VideoApiException e)
            {
                _logger.LogError(e, "Unable to get conferences for user");
                return StatusCode(e.StatusCode, e.Response);
            }
        }


        /// <summary>
        /// Get conferences for user
        /// </summary>
        /// <returns>List of conferences, if any</returns>
        [HttpGet("vhofficer")]
        [ProducesResponseType(typeof(List<ConferenceForVhOfficerResponse>), (int) HttpStatusCode.OK)]
        [ProducesResponseType((int) HttpStatusCode.Unauthorized)]
        [SwaggerOperation(OperationId = "GetConferencesForVhOfficer")]
        [Authorize(AppRoles.VhOfficerRole)]
        public async Task<ActionResult<List<ConferenceForVhOfficerResponse>>> GetConferencesForVhOfficerAsync([FromQuery]VhoConferenceFilterQuery query)
        {
            _logger.LogDebug("GetConferencesForVhOfficer");
            try
            {
                
                var hearingsForToday = await _bookingApiClient.GetHearingsForTodayByVenueAsync(query.HearingVenueNames);
                var request = new GetConferencesByHearingIdsRequest { HearingRefIds = hearingsForToday.Select(e => e.Id).ToArray() };
                var conferences = await _videoApiClient.GetConferencesForAdminByHearingRefIdAsync(request);
                var allocatedHearings =
                    await _bookingApiClient.GetAllocationsForHearingsAsync(conferences.Select(e => e.HearingRefId));
                var conferenceForVhOfficerResponseMapper = _mapperFactory.Get<ConferenceForAdminResponse, AllocatedCsoResponse, ConferenceForVhOfficerResponse>();
                var responses = conferences
                    .Where(c => ConferenceHelper.HasNotPassed(c.Status, c.ClosedDateTime))
                    .Select(x => conferenceForVhOfficerResponseMapper.Map(x, allocatedHearings?.FirstOrDefault(conference => conference.HearingId == x.HearingRefId)))
                    .ApplyCsoFilter(query)
                    .OrderBy(x => x.ClosedDateTime)
                    .ToList();

                return Ok(responses);
            }
            catch (VideoApiException e)
            {
                _logger.LogError(e, "Unable to get conferences for vh officer");
                return StatusCode(e.StatusCode, e.Response);
            }
        }


        /// <summary>
        /// Get the details of a conference by id for VH officer
        /// </summary>
        /// <param name="conferenceId">The unique id of the conference</param>
        /// <returns>the details of a conference, if permitted</returns>
        [HttpGet("{conferenceId}/vhofficer")]
        [ProducesResponseType(typeof(ConferenceResponseVho), (int) HttpStatusCode.OK)]
        [ProducesResponseType((int) HttpStatusCode.BadRequest)]
        [ProducesResponseType((int) HttpStatusCode.NoContent)]
        [SwaggerOperation(OperationId = "GetConferenceByIdVHO")]
        [Authorize(AppRoles.VhOfficerRole)]
        public async Task<ActionResult<ConferenceResponseVho>> GetConferenceByIdVHOAsync(Guid conferenceId)
        {
            if (conferenceId == Guid.Empty)
            {
                _logger.LogWarning("Unable to get conference when id is not provided");
                ModelState.AddModelError(nameof(conferenceId), $"Please provide a valid {nameof(conferenceId)}");

                return BadRequest(ModelState);
            }

            ConferenceDetailsResponse conference;
            try
            {
                conference = await _videoApiClient.GetConferenceDetailsByIdAsync(conferenceId);

                if(conference == null)
                {
                    _logger.LogWarning("Conference details with id: {conferenceId} not found", conferenceId);

                    return NoContent();
                }
            }
            catch (VideoApiException e)
            {
                _logger.LogError(e, $"Unable to retrieve conference: ${conferenceId}");

                return StatusCode(e.StatusCode, e.Response);
            }

            var exceededTimeLimit = !ConferenceHelper.HasNotPassed(conference.CurrentStatus, conference.ClosedDateTime);
            if (exceededTimeLimit)
            {
                _logger.LogInformation(
                    $"Unauthorised to view conference details {conferenceId} because user is not " +
                    "Officer nor a participant of the conference, or the conference has been closed for over 30 minutes");

                return Unauthorized();
            }

            // these are roles that are filtered against when lists participants on the UI
            var displayRoles = new List<Role>
            {
                Role.Judge,
                Role.StaffMember,
                Role.Individual,
                Role.Representative,
                Role.VideoHearingsOfficer,
                Role.JudicialOfficeHolder,
                Role.QuickLinkParticipant,
                Role.QuickLinkObserver
            };

            conference.Participants = conference
                .Participants
                .Where(x => displayRoles.Contains((Role) x.UserRole)).ToList();

            var conferenceResponseVhoMapper = _mapperFactory.Get<ConferenceDetailsResponse, ConferenceResponseVho>();
            var response = conferenceResponseVhoMapper.Map(conference);

            await _conferenceCache.AddConferenceAsync(conference);

            return Ok(response);
        }

        /// <summary>
        /// Get the details of a conference by id
        /// </summary>
        /// <param name="conferenceId">The unique id of the conference</param>
        /// <returns>the details of a conference, if permitted</returns>
        [ServiceFilter(typeof(CheckParticipantCanAccessConferenceAttribute))]
        [HttpGet("{conferenceId}")]
        [ProducesResponseType(typeof(ConferenceResponse), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        [ProducesResponseType((int)HttpStatusCode.NoContent)]
        [SwaggerOperation(OperationId = "GetConferenceById")]
        public async Task<ActionResult<ConferenceResponse>> GetConferenceByIdAsync(Guid conferenceId)
        {
            _logger.LogDebug("GetConferenceById");
            
            var claimsPrincipalToUserProfileResponseMapper =
                _mapperFactory.Get<ClaimsPrincipal, UserProfileResponse>();
            var userProfile = claimsPrincipalToUserProfileResponseMapper.Map(User);
            
            if (conferenceId == Guid.Empty)
            {
                _logger.LogWarning("Unable to get conference when id is not provided");
                ModelState.AddModelError(nameof(conferenceId), $"Please provide a valid {nameof(conferenceId)}");
                return BadRequest(ModelState);
            }

            var username = userProfile.Username.ToLower().Trim();
            ConferenceDetailsResponse conference;
            try
            {
                conference = await _videoApiClient.GetConferenceDetailsByIdAsync(conferenceId);

                if (conference == null)
                {
                    _logger.LogWarning("Conference details with id: {conferenceId} not found", conferenceId);

                    return NoContent();
                }
            }
            catch (VideoApiException e)
            {
                _logger.LogError(e, $"Unable to retrieve conference: ${conferenceId}");
                return StatusCode(e.StatusCode, e.Response);
            }

            var exceededTimeLimit = !ConferenceHelper.HasNotPassed(conference.CurrentStatus, conference.ClosedDateTime);
            if (!userProfile.Roles.Contains(Role.StaffMember) && 
                (conference.Participants.TrueForAll(x => x.Username.ToLower().Trim() != username) || exceededTimeLimit))
            {
                _logger.LogInformation(
                    $"Unauthorised to view conference details {conferenceId} because user is neither a VH " +
                    "Officer nor a participant of the conference, or the conference has been closed for over 30 minutes");
                return Unauthorized();
            }

            // these are roles that are filtered against when lists participants on the UI
            var displayRoles = new List<Role>
            {
                Role.Judge,
                Role.Individual,
                Role.Representative,
                Role.JudicialOfficeHolder,
                Role.StaffMember,
                Role.QuickLinkParticipant,
                Role.QuickLinkObserver
            };

            conference.Participants = conference.Participants
                .Where(x => displayRoles.Contains((Role)x.UserRole)).ToList();

            var conferenceResponseMapper = _mapperFactory.Get<ConferenceDetailsResponse, ConferenceResponse>();
            var response = conferenceResponseMapper.Map(conference);
            await _conferenceCache.AddConferenceAsync(conference);

            return Ok(response);
        }
    }
}
