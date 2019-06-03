using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings;
using VideoWeb.Services.User;
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
        private readonly IUserApiClient _userApiClient;

        public ConferencesController(IVideoApiClient videoApiClient, IUserApiClient userApiClient)
        {
            _videoApiClient = videoApiClient;
            _userApiClient = userApiClient;
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
                return StatusCode(e.StatusCode, e);
            }
        }
        
        /// <summary>
        /// Get conferences for user
        /// </summary>
        /// <returns>List of conferences, if any</returns>
        [HttpGet("today")]
        [ProducesResponseType(typeof(List<ConferenceForUserResponse>), (int) HttpStatusCode.OK)]
        [ProducesResponseType((int) HttpStatusCode.Unauthorized)]
        [SwaggerOperation(OperationId = "GetConferencesToday")]
        public async Task<ActionResult<List<ConferenceForUserResponse>>> GetConferencesToday()
        {
            try
            {
                var username = User.Identity.Name.ToLower().Trim();
                var profile = await _userApiClient.GetUserByAdUserNameAsync(username);
                var profileResponse = new UserProfileResponseMapper().MapToResponseModel(profile);
                if (profileResponse.Role != UserRole.VideoHearingsOfficer)
                {
                    return Unauthorized("User must be a VH Officer");
                }
            }
            catch (UserApiException e)
            {
                return StatusCode(e.StatusCode, e);
            }
            
            try
            {
                var conferences = await _videoApiClient.GetConferencesTodayAsync();
                var mapper = new ConferenceForUserResponseMapper();
                var response = conferences.Select(x => mapper.MapConferenceSummaryToResponseModel(x)).ToList();
                return Ok(response);
            }
            catch (VideoApiException e)
            {
                return StatusCode(e.StatusCode, e);
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
            var username = User.Identity.Name.ToLower().Trim();
            bool isVhOfficer;
            try
            {
                
                var profile = await _userApiClient.GetUserByAdUserNameAsync(username);
                var profileResponse = new UserProfileResponseMapper().MapToResponseModel(profile);
                isVhOfficer = profileResponse.Role == UserRole.VideoHearingsOfficer; 
                
            }
            catch (UserApiException e)
            {
                return StatusCode(e.StatusCode, e);
            }
            
            ConferenceDetailsResponse conference;
            try
            {
                conference = await _videoApiClient.GetConferenceDetailsByIdAsync(conferenceId);
            }
            catch (VideoApiException e)
            {
                return StatusCode(e.StatusCode, e);
            }

            if (!isVhOfficer && conference.Participants.All(x => x.Username.ToLower().Trim() != username))
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