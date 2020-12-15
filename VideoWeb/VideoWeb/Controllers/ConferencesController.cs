using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
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
using VideoWeb.Services.Video;
using JudgeConference = VideoWeb.Services.Video.ConferenceForJudgeResponse;
using IndividualConference = VideoWeb.Services.Video.ConferenceForIndividualResponse;
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
        private readonly ILogger<ConferencesController> _logger;
        private readonly IConferenceCache _conferenceCache;
        private readonly IMapTo<ConferenceForJudgeResponse, JudgeConference> _conferenceForJudgeResponseMapper;
        private readonly IMapTo<ConferenceForIndividualResponse, IndividualConference> _conferenceForIndividualResponseMapper;
        private readonly IMapTo<ConferenceForVhOfficerResponse, ConferenceForAdminResponse> _conferenceForVhOfficerResponseMapper;
        private readonly IMapTo<ConferenceResponseVho, ConferenceDetailsResponse> _conferenceResponseVhoMapper;
        private readonly IMapTo<ConferenceResponse, ConferenceDetailsResponse> _conferenceResponseMapper;

        public ConferencesController(
            IVideoApiClient videoApiClient,
            ILogger<ConferencesController> logger,
            IConferenceCache conferenceCache,
            IMapTo<ConferenceForJudgeResponse, JudgeConference> conferenceForJudgeResponseMapper,
            IMapTo<ConferenceForIndividualResponse, IndividualConference> conferenceForIndividualResponseMapper,
            IMapTo<ConferenceForVhOfficerResponse, ConferenceForAdminResponse> conferenceForVhOfficerResponseMapper,
            IMapTo<ConferenceResponseVho, ConferenceDetailsResponse> conferenceResponseVhoMapper,
            IMapTo<ConferenceResponse, ConferenceDetailsResponse> conferenceResponseMapper)
        {
            _videoApiClient = videoApiClient;
            _logger = logger;
            _conferenceCache = conferenceCache;
            _conferenceForJudgeResponseMapper = conferenceForJudgeResponseMapper;
            _conferenceForIndividualResponseMapper = conferenceForIndividualResponseMapper;
            _conferenceForVhOfficerResponseMapper = conferenceForVhOfficerResponseMapper;
            _conferenceResponseVhoMapper = conferenceResponseVhoMapper;
            _conferenceResponseMapper = conferenceResponseMapper;
        }

        /// <summary>
        /// Get conferences today for a judge or a clerk
        /// </summary>
        /// <returns>List of conferences, if any</returns>
        [HttpGet("judges")]
        [ProducesResponseType(typeof(List<ConferenceForJudgeResponse>), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        [SwaggerOperation(OperationId = "GetConferencesForJudge")]
        [Authorize(AppRoles.JudgeRole)]
        public async Task<ActionResult<List<ConferenceForJudgeResponse>>> GetConferencesForJudgeAsync()
        {
            _logger.LogDebug("GetConferencesForJudge");
            try
            {
                var username = User.Identity.Name;
                var conferencesForJudge = await _videoApiClient.GetConferencesTodayForJudgeByUsernameAsync(username);
                var response = conferencesForJudge
                    .Select(_conferenceForJudgeResponseMapper.Map)
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
        [Authorize("Individual")]
        public async Task<ActionResult<IEnumerable<ConferenceForIndividualResponse>>> GetConferencesForIndividual()
        {
            _logger.LogDebug("GetConferencesForIndividual");
            try
            {
                var username = User.Identity.Name;
                var conferencesForIndividual = await _videoApiClient.GetConferencesTodayForIndividualByUsernameAsync(username);
                conferencesForIndividual = conferencesForIndividual.Where(c => ConferenceHelper.HasNotPassed(c.Status, c.Closed_date_time)).ToList();
                var response = conferencesForIndividual
                    .Select(_conferenceForIndividualResponseMapper.Map)
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
                var conferences = await _videoApiClient.GetConferencesTodayForAdminAsync(query.UserNames);
                var responses = conferences
                    .Where(c => ConferenceHelper.HasNotPassed(c.Status, c.Closed_date_time))
                    .OrderBy(x => x.Closed_date_time)
                    .Select(_conferenceForVhOfficerResponseMapper.Map)
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
        [ProducesResponseType((int) HttpStatusCode.NotFound)]
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
                _logger.LogTrace($"Retrieving conference details for conference: ${conferenceId}");
                conference = await _videoApiClient.GetConferenceDetailsByIdAsync(conferenceId);
            }
            catch (VideoApiException e)
            {
                _logger.LogError(e, $"Unable to retrieve conference: ${conferenceId}");

                return StatusCode(e.StatusCode, e.Response);
            }

            var exceededTimeLimit = !ConferenceHelper.HasNotPassed(conference.Current_status, conference.Closed_date_time);
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
                Role.Individual,
                Role.Representative,
                Role.VideoHearingsOfficer
            };

            conference.Participants = conference
                .Participants
                .Where(x => displayRoles.Contains((Role) x.User_role)).ToList();

            var response = _conferenceResponseVhoMapper.Map(conference);

            await _conferenceCache.AddConferenceAsync(conference);

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
                _logger.LogWarning("Unable to get conference when id is not provided");
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
                Role.Representative,
                Role.JudicialOfficeHolder
            };
            conference.Participants = conference.Participants
                .Where(x => displayRoles.Contains((Role)x.User_role)).ToList();

            var response = _conferenceResponseMapper.Map(conference);
            await _conferenceCache.AddConferenceAsync(conference);

            return Ok(response);
        }
    }
}
