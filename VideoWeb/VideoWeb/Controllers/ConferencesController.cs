using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Polly.CircuitBreaker;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Contract.Responses;
using VideoWeb.EventHub.Models;
using VideoWeb.Mappings;
using VideoWeb.Services.Bookings;
using VideoWeb.Services.User;
using VideoWeb.Services.Video;
using UserRole = VideoWeb.Contract.Responses.UserRole;
using BookingParticipant = VideoWeb.Services.Bookings.ParticipantResponse;

namespace VideoWeb.Controllers
{
    [Produces("application/json")]
    [ApiController]
    [Route("conferences")]
    public class ConferencesController : Controller
    {
        private readonly IVideoApiClient _videoApiClient;
        private readonly IUserApiClient _userApiClient;
        private readonly IBookingsApiClient _bookingsApiClient;
        private readonly ILogger<ConferencesController> _logger;
        private readonly IMemoryCache _memoryCache;

        public ConferencesController(IVideoApiClient videoApiClient, IUserApiClient userApiClient,
            IBookingsApiClient bookingsApiClient, ILogger<ConferencesController> logger, IMemoryCache memoryCache)
        {
            _videoApiClient = videoApiClient;
            _userApiClient = userApiClient;
            _bookingsApiClient = bookingsApiClient;
            _logger = logger;
            _memoryCache = memoryCache;
        }

        /// <summary>
        /// Get conferences today for a judge or a clerk
        /// </summary>
        /// <returns>List of conferences, if any</returns>
        [HttpGet("judges")]
        [ProducesResponseType(typeof(List<ConferenceForUserResponse>), (int) HttpStatusCode.OK)]
        [ProducesResponseType((int) HttpStatusCode.BadRequest)]
        [SwaggerOperation(OperationId = "GetConferencesForJudge")]
        public async Task<ActionResult<List<ConferenceForUserResponse>>> GetConferencesForJudge()
        {
            _logger.LogDebug("GetConferencesForJudge");
            return await GetConferenceForUserAsync(false);
        }
        
        /// <summary>
        /// Get conferences today for individual or representative excluding those that have been closed for over 30 minutes
        /// </summary>
        /// <returns>List of conferences, if any</returns>
        [HttpGet("individuals")]
        [ProducesResponseType(typeof(List<ConferenceForUserResponse>), (int) HttpStatusCode.OK)]
        [ProducesResponseType((int) HttpStatusCode.BadRequest)]
        [SwaggerOperation(OperationId = "GetConferencesForIndividual")]
        public async Task<ActionResult<List<ConferenceForUserResponse>>> GetConferencesForIndividual()
        {
            _logger.LogDebug("GetConferencesForIndividual");
            return await GetConferenceForUserAsync(true);

        }

        private async Task<ActionResult<List<ConferenceForUserResponse>>> GetConferenceForUserAsync(bool excludeStaleConferences)
        {
            var username = User.Identity.Name;
            try
            {
                var conferences = await _videoApiClient.GetConferencesForUsernameAsync(username);
                _logger.LogTrace("Successfully retrieved conferences for user");
                
                if (excludeStaleConferences)
                {
                    _logger.LogTrace("Filtering conference that have been closed for more than 30 minutes");
                    conferences = conferences.Where(HasNotPassed).ToList();
                }

                conferences = conferences.OrderBy(x => x.Closed_date_time).ToList();
                var mapper = new ConferenceForUserResponseMapper();
                var response = conferences.Select(x => mapper.MapConferenceSummaryToResponseModel(x)).ToList();
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
        [ProducesResponseType(typeof(List<ConferenceForUserResponse>), (int) HttpStatusCode.OK)]
        [ProducesResponseType((int) HttpStatusCode.Unauthorized)]
        [SwaggerOperation(OperationId = "GetConferencesForVHOfficer")]
        public async Task<ActionResult<List<ConferenceForUserResponse>>> GetConferencesForVHOfficer()
        {
            _logger.LogDebug("GetConferencesForVHOfficer");
            try
            {
                var username = User.Identity.Name.ToLower().Trim();
                var profile = await _userApiClient.GetUserByAdUserNameAsync(username);
                var profileResponse = new UserProfileResponseMapper().MapToResponseModel(profile);
                if (profileResponse.Role != UserRole.VideoHearingsOfficer)
                {
                    _logger.LogError($"Failed to get conferences for today: {username} is not a VH officer");
                    return Unauthorized("User must be a VH Officer");
                }
            }
            catch (UserApiException e)
            {
                return StatusCode(e.StatusCode, e.Response);
            }

            try
            {
                var conferences = await _videoApiClient.GetConferencesTodayAsync();
                conferences = conferences.Where(HasNotPassed).ToList();
                conferences = conferences.OrderBy(x => x.Closed_date_time).ToList();
                var mapper = new ConferenceForUserResponseMapper();
                var response = conferences.Select(x => mapper.MapConferenceSummaryToResponseModel(x)).ToList();
                return Ok(response);
            }
            catch (VideoApiException e)
            {
                return StatusCode(e.StatusCode, e.Response);
            }
        }

        private static bool HasNotPassed(ConferenceSummaryResponse conference)
        {
            if (conference.Status != ConferenceState.Closed)
            {
                return true;
            }

            // After a conference is closed, VH Officers can still administer conferences until this period of time
            const int postClosedVisibilityTime = 30;
            var endTime = conference.Closed_date_time.Value.AddMinutes(postClosedVisibilityTime);
            return DateTime.UtcNow < endTime;
        }

        /// <summary>
        /// Get the details of a conference by id
        /// </summary>
        /// <param name="conferenceId">The unique id of the conference</param>
        /// <returns>the details of a conference, if permitted</returns>
        [HttpGet("{conferenceId}")]
        [ProducesResponseType(typeof(ConferenceResponse), (int) HttpStatusCode.OK)]
        [ProducesResponseType((int) HttpStatusCode.BadRequest)]
        [ProducesResponseType((int) HttpStatusCode.NotFound)]
        [SwaggerOperation(OperationId = "GetConferenceById")]
        public async Task<ActionResult<ConferenceResponse>> GetConferenceById(Guid conferenceId)
        {
            _logger.LogDebug("GetConferenceById");
            if (conferenceId == Guid.Empty)
            {
                _logger.LogError("Unable to get conference when id is not provided");
                ModelState.AddModelError(nameof(conferenceId), $"Please provide a valid {nameof(conferenceId)}");
                return BadRequest(ModelState);
            }

            var username = User.Identity.Name.ToLower().Trim();
            bool isVhOfficer;
            try
            {
                _logger.LogTrace("Checking to see if user is a VH Officer");
                var profile = await _userApiClient.GetUserByAdUserNameAsync(username);
                var profileResponse = new UserProfileResponseMapper().MapToResponseModel(profile);
                isVhOfficer = profileResponse.Role == UserRole.VideoHearingsOfficer;
            }
            catch (UserApiException e)
            {
                _logger.LogError(e, "Unable to retrieve user profile");
                return StatusCode(e.StatusCode, e.Response);
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

            var exceededTimeLimit = !HasNotPassed(new ConferenceSummaryResponse
                {Status = conference.Current_status, Closed_date_time = conference.Closed_date_time});
            if (!isVhOfficer && (conference.Participants.All(x => x.Username.ToLower().Trim() != username) ||
                                 exceededTimeLimit))
            {
                _logger.LogInformation(
                    $"Unauthorised to view conference details {conferenceId} because user is neither a VH " +
                    "Officer nor a participant of the conference, or the conference has been closed for over 30 minutes");
                return Unauthorized();
            }

            var bookingParticipants = new List<BookingParticipant>();
            try
            {
                _logger.LogTrace($"Retrieving booking participants for hearing ${conference.Hearing_id}");
                bookingParticipants = await _bookingsApiClient.GetAllParticipantsInHearingAsync(conference.Hearing_id
                    .GetValueOrDefault());
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
            var displayRoles = new List<UserRole>
            {
                UserRole.Judge,
                UserRole.Individual,
                UserRole.Representative
            };
            conference.Participants = conference.Participants
                .Where(x => displayRoles.Contains((UserRole) x.User_role.GetValueOrDefault())).ToList();

            var mapper = new ConferenceResponseMapper();
            var response = mapper.MapConferenceDetailsToResponseModel(conference, bookingParticipants);
            AddConferenceToCache(conference);

            return Ok(response);
        }

        private async Task AddConferenceToCache(ConferenceDetailsResponse conferenceResponse)
        {
            var participants = new List<Participant>();
            foreach (var participant in conferenceResponse.Participants)
            {
                participants.Add(new Participant
                {
                    Id = participant.Id.Value,
                    DisplayName = participant.Display_name,
                    Role = (VideoWeb.EventHub.Enums.UserRole) Enum.Parse(typeof(UserRole), participant.User_role.ToString()),
                    Username = participant.Username
                });
            }

            var conference = new Conference
            {
                Id = conferenceResponse.Id.Value,
                HearingId = conferenceResponse.Hearing_id.Value,
                Participants = participants
            };

            await _memoryCache.GetOrCreateAsync(conference.Id, entry =>
            {
                entry.SlidingExpiration = TimeSpan.FromHours(8);
                return Task.FromResult(conference);
            });
        }

        private static void ValidateConferenceAndBookingParticipantsMatch(List<ParticipantDetailsResponse> participants,
            List<BookingParticipant> bookingParticipants)
        {
            List<Exception> missingBookingParticipantIds = new List<Exception>();
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