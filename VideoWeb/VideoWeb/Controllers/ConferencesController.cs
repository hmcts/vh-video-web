using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings;
using VideoWeb.Services.Video;
using UserRole = VideoWeb.Contract.Responses.UserRole;

namespace VideoWeb.Controllers
{
    [Produces("application/json")]
    [ApiController]
    [Route("conferences")]
    public class ConferencesController : Controller
    {
        private readonly IVideoApiClient _videoApiClient;

        public ConferencesController(IVideoApiClient videoApiClient)
        {
            _videoApiClient = videoApiClient;
        }

        /// <summary>
        /// Get conferences for user
        /// </summary>
        /// <returns>List of conferences, if any</returns>
        [HttpGet]
        [ProducesResponseType(typeof(List<ConferenceForUserResponse>), (int) HttpStatusCode.OK)]
        [ProducesResponseType((int) HttpStatusCode.BadRequest)]
        [SwaggerOperation(OperationId = "GetConferencesForUser")]
        public async Task<ActionResult<List<ConferenceForUserResponse>>> GetConferencesForUser()
        {
            var username = User.Identity.Name;
            try
            {
                var conferences = await _videoApiClient.GetConferencesForUsernameAsync(username);
                var mapper = new ConferenceForUserResponseMapper();
                var response = conferences.Select(x => mapper.MapConferenceSummaryToResponseModel(x)).ToList();
                return Ok(response);
            }
            catch (VideoApiException e)
            {
                switch (e.StatusCode)
                {
                    case (int) HttpStatusCode.Unauthorized:
                        return Forbid();
                    case (int) HttpStatusCode.BadRequest:
                        return BadRequest(e.Response);
                    default:
                        return StatusCode((int) HttpStatusCode.InternalServerError, e);
                }
            }
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
            if (conferenceId == Guid.Empty)
            {
                ModelState.AddModelError(nameof(conferenceId), $"Please provide a valid {nameof(conferenceId)}");
                return BadRequest(ModelState);
            }

            ConferenceDetailsResponse conference;
            try
            {
                conference = await _videoApiClient.GetConferenceDetailsByIdAsync(conferenceId);
            }
            catch (VideoApiException e)
            {
                switch (e.StatusCode)
                {
                    case (int) HttpStatusCode.NotFound:
                        return NotFound();
                    case (int) HttpStatusCode.Unauthorized:
                        return Forbid();
                    case (int) HttpStatusCode.BadRequest:
                        return BadRequest(e.Response);
                    default:
                        return StatusCode((int) HttpStatusCode.InternalServerError, e);
                }
            }

            var username = User.Identity.Name;
            if (conference.Participants.All(x => x.Username != username))
            {
                return Unauthorized();
            }

            // these are roles that are filtered against when lists participants on the UI
            var displayRoles = new List<UserRole>
            {
                UserRole.Judge, UserRole.Individual, UserRole.Representative
            };
            conference.Participants = conference.Participants
                .Where(x => displayRoles.Contains((UserRole) x.User_role.GetValueOrDefault())).ToList();

            var mapper = new ConferenceResponseMapper();
            var response = mapper.MapConferenceDetailsToResponseModel(conference);
            return Ok(response);

        }
    }
}