using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Polly.CircuitBreaker;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Extensions;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Request;
using VideoWeb.Contract.Responses;
using VideoWeb.Helpers;
using VideoWeb.Mappings;
using VideoWeb.Services.Bookings;
using VideoWeb.Services.Video;
using BookingParticipant = VideoWeb.Services.Bookings.ParticipantResponse;
using ConferenceForIndividualResponse = VideoWeb.Contract.Responses.ConferenceForIndividualResponse;
using ConferenceForJudgeResponse = VideoWeb.Contract.Responses.ConferenceForJudgeResponse;

namespace VideoWeb.Controllers
{
    [Produces("application/json")]
    [ApiController]
    [Route("conferences")]
    public class ConferencesController : Controller
    {
        private readonly IVideoApiClient _videoApiClient;
        private readonly IBookingsApiClient _bookingsApiClient;
        private readonly ILogger<ConferencesController> _logger;
        private readonly IConferenceCache _conferenceCache;

        public ConferencesController(IVideoApiClient videoApiClient,
            IBookingsApiClient bookingsApiClient, ILogger<ConferencesController> logger,
            IConferenceCache conferenceCache)
        {
            _videoApiClient = videoApiClient;
            _bookingsApiClient = bookingsApiClient;
            _logger = logger;
            _conferenceCache = conferenceCache;
        }

        /// <summary>
        /// Get conferences today for a judge or a clerk
        /// </summary>
        /// <returns>List of conferences, if any</returns>
        [HttpGet("judges")]
        [ProducesResponseType(typeof(List<ConferenceForJudgeResponse>), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        [SwaggerOperation(OperationId = "GetConferencesForJudge")]
        public async Task<ActionResult<List<ConferenceForJudgeResponse>>> GetConferencesForJudgeAsync()
        {
            _logger.LogDebug("GetConferencesForJudge");
            try
            {
                var username = User.Identity.Name;
                var conferencesForJudge = await _videoApiClient.GetConferencesTodayForJudgeByUsernameAsync(username);
                var response = conferencesForJudge
                    .Select(ConferenceForJudgeResponseMapper.MapConferenceSummaryToModel)
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
        /// Get conferences today for individual or representative excluding those that have been closed for over 30 minutes
        /// </summary>
        /// <returns>List of conferences, if any</returns>
        [HttpGet("individuals")]
        [ProducesResponseType(typeof(List<ConferenceForIndividualResponse>), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        [SwaggerOperation(OperationId = "GetConferencesForIndividual")]
        public async Task<ActionResult<IEnumerable<ConferenceForIndividualResponse>>> GetConferencesForIndividual()
        {
            _logger.LogDebug("GetConferencesForIndividual");
            try
            {
                var username = User.Identity.Name;
                var conferencesForIndividual = await _videoApiClient.GetConferencesTodayForIndividualByUsernameAsync(username);
                conferencesForIndividual = conferencesForIndividual.Where(c => ConferenceHelper.HasNotPassed(c.Status, c.Closed_date_time)).ToList();
                var response = conferencesForIndividual
                    .Select(ConferenceForIndividualResponseMapper.MapConferenceSummaryToModel).ToList();
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
        public async Task<ActionResult<List<ConferenceForVhOfficerResponse>>> GetConferencesForVhOfficerAsync([FromQuery]VhoConferenceFilterQuery query)
        {
            _logger.LogDebug("GetConferencesForVhOfficer");
            var username = User.Identity.Name.ToLower().Trim();
            if (!User.IsInRole(Role.VideoHearingsOfficer.EnumDataMemberAttr()))
            {
                _logger.LogError($"Failed to get conferences for today: {username} is not a VH officer");
                return Unauthorized("User must be a VH Officer");
            }

            try
            {
                var conferences = await _videoApiClient.GetConferencesTodayForAdminAsync(query.VenueNames);
                conferences = conferences.Where(c => ConferenceHelper.HasNotPassed(c.Status, c.Closed_date_time))
                    .ToList();
                conferences = conferences.OrderBy(x => x.Closed_date_time).ToList();
                var tasks = conferences.Select(MapConferenceForVhoAsync).ToArray();

                var response = await Task.WhenAll(tasks);

                return Ok(response.ToList());
            }
            catch (VideoApiException e)
            {
                return StatusCode(e.StatusCode, e.Response);
            }
        }

        private async Task<ConferenceForVhOfficerResponse> MapConferenceForVhoAsync(
            ConferenceForAdminResponse conference)
        {
            if (!conference.IsInStateToChat())
            {
                return ConferenceForVhOfficerResponseMapper.MapConferenceSummaryToResponseModel(conference, null);
            }

            var messages = await _videoApiClient.GetInstantMessageHistoryAsync(conference.Id);

            return ConferenceForVhOfficerResponseMapper.MapConferenceSummaryToResponseModel(conference, messages);
        }


        /// <summary>
        /// Get the details of a conference by id for VH officer
        /// </summary>
        /// <param name="conferenceId">The unique id of the conference</param>
        /// <returns>the details of a conference, if permitted</returns>
        [HttpGet("{conferenceId}/vhofficer")]
        [ProducesResponseType(typeof(ConferenceResponseVho), (int) HttpStatusCode.OK)]
        [ProducesResponseType((int) HttpStatusCode.BadRequest)]
        [ProducesResponseType((int) HttpStatusCode.NotFound)]
        [SwaggerOperation(OperationId = "GetConferenceByIdVHO")]
        public async Task<ActionResult<ConferenceResponseVho>> GetConferenceByIdVHOAsync(Guid conferenceId)
        {
            _logger.LogDebug("GetConferenceById");
            if (conferenceId == Guid.Empty)
            {
                _logger.LogError("Unable to get conference when id is not provided");
                ModelState.AddModelError(nameof(conferenceId), $"Please provide a valid {nameof(conferenceId)}");
                return BadRequest(ModelState);
            }

            var username = User.Identity.Name.ToLower().Trim();

            _logger.LogTrace("Checking to see if user is a VH Officer");
            if (!User.IsInRole(Role.VideoHearingsOfficer.EnumDataMemberAttr()))
            {
                _logger.LogError($"Failed to get conference: ${conferenceId}, {username} is not a VH officer");
                return Unauthorized("User must be a VH Officer");
            }

            ConferenceDetailsResponse conference;
            try
            {
                _logger.LogTrace($"Retrieving conference details for conference: ${conferenceId}");
                conference = await _videoApiClient.GetConferenceDetailsByIdAsync(conferenceId);
            }
            catch (VideoApiException e)
            {
                _logger.LogError(e, $"Unable to retrieve conference: ${conferenceId}");
                return StatusCode(e.StatusCode, e.Response);
            }

            var exceededTimeLimit =
                !ConferenceHelper.HasNotPassed(conference.Current_status, conference.Closed_date_time);
            if (exceededTimeLimit)
            {
                _logger.LogInformation(
                    $"Unauthorised to view conference details {conferenceId} because user is not " +
                    "Officer nor a participant of the conference, or the conference has been closed for over 30 minutes");
                return Unauthorized();
            }

            var bookingParticipants = new List<BookingParticipant>();
            try
            {
                _logger.LogTrace($"Retrieving booking participants for hearing ${conference.Hearing_id}");
                bookingParticipants = await _bookingsApiClient.GetAllParticipantsInHearingAsync(conference.Hearing_id);
            }
            catch (BookingsApiException e)
            {
                _logger.LogError(e, $"Unable to retrieve booking participants for hearing ${conference.Hearing_id}");
            }
            catch (BrokenCircuitException e)
            {
                _logger.LogError(e, $"Unable to retrieve booking participants for hearing ${conference.Hearing_id}");
            }

            if (bookingParticipants.Any())
            {
                try
                {
                    ValidateConferenceAndBookingParticipantsMatch(conference.Participants, bookingParticipants);
                }
                catch (AggregateException e)
                {
                    return StatusCode((int) HttpStatusCode.ExpectationFailed, e);
                }
            }

            // these are roles that are filtered against when lists participants on the UI
            var displayRoles = new List<Role>
            {
                Role.Judge,
                Role.Individual,
                Role.Representative
            };
            conference.Participants = conference.Participants
                .Where(x => displayRoles.Contains((Role) x.User_role)).ToList();

            var response =
                ConferenceResponseVhoMapper.MapConferenceDetailsToResponseModel(conference, bookingParticipants);
            await _conferenceCache.AddConferenceToCache(conference);

            return Ok(response);
        }

        /// <summary>
        /// Get the details of a conference by id
        /// </summary>
        /// <param name="conferenceId">The unique id of the conference</param>
        /// <returns>the details of a conference, if permitted</returns>
        [HttpGet("{conferenceId}")]
        [ProducesResponseType(typeof(ConferenceResponse), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        [SwaggerOperation(OperationId = "GetConferenceById")]
        public async Task<ActionResult<ConferenceResponse>> GetConferenceByIdAsync(Guid conferenceId)
        {
            _logger.LogDebug("GetConferenceById");
            if (conferenceId == Guid.Empty)
            {
                _logger.LogError("Unable to get conference when id is not provided");
                ModelState.AddModelError(nameof(conferenceId), $"Please provide a valid {nameof(conferenceId)}");
                return BadRequest(ModelState);
            }

            var username = User.Identity.Name.ToLower().Trim();

            ConferenceDetailsResponse conference;
            try
            {
                _logger.LogTrace($"Retrieving conference details for conference: ${conferenceId}");
                conference = await _videoApiClient.GetConferenceDetailsByIdAsync(conferenceId);
            }
            catch (VideoApiException e)
            {
                _logger.LogError(e, $"Unable to retrieve conference: ${conferenceId}");
                return StatusCode(e.StatusCode, e.Response);
            }

            var exceededTimeLimit = !ConferenceHelper.HasNotPassed(conference.Current_status, conference.Closed_date_time);
            if (conference.Participants.All(x => x.Username.ToLower().Trim() != username) || exceededTimeLimit)
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
                Role.Representative
            };
            conference.Participants = conference.Participants
                .Where(x => displayRoles.Contains((Role)x.User_role)).ToList();

            var response = ConferenceResponseMapper.MapConferenceDetailsToResponseModel(conference);
            await _conferenceCache.AddConferenceToCache(conference);

            return Ok(response);
        }

        private static void ValidateConferenceAndBookingParticipantsMatch(
            IEnumerable<ParticipantDetailsResponse> participants,
            IReadOnlyCollection<BookingParticipant> bookingParticipants)
        {
            var missingBookingParticipantIds = new List<Exception>();
            foreach (var participant in participants)
            {
                if (bookingParticipants.SingleOrDefault(p => p.Id == participant.Ref_id) == null)
                {
                    missingBookingParticipantIds.Add(new ArgumentNullException(
                        $"Unable to find a participant in bookings api with id ${participant.Ref_id}"));
                }
            }

            if (missingBookingParticipantIds.Any())
            {
                throw new AggregateException(missingBookingParticipantIds);
            }
        }
    }
}
