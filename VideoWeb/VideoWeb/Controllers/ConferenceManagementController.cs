using System;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Common.Caching;
using VideoWeb.Services.Video;

namespace VideoWeb.Controllers
{
    [Produces("application/json")]
    [ApiController]
    [Route("conferences")]
    public class ConferenceManagementController : ControllerBase
    {
        private readonly IVideoApiClient _videoApiClient;
        private readonly ILogger<ConferenceManagementController> _logger;
        private readonly IConferenceCache _conferenceCache;

        public ConferenceManagementController(IVideoApiClient videoApiClient, ILogger<ConferenceManagementController> logger, IConferenceCache conferenceCache)
        {
            _videoApiClient = videoApiClient;
            _logger = logger;
            _conferenceCache = conferenceCache;
        }
        
        /// <summary>
        /// Start or resume a video hearing
        /// </summary>
        /// <param name="conferenceId">conference id</param>
        /// <returns>No Content status</returns>
        [HttpPost("{conferenceId}/start")]
        [SwaggerOperation(OperationId = "StartOrResumeVideoHearing")]
        [ProducesResponseType((int)HttpStatusCode.Accepted)]
        public async Task<IActionResult> StartOrResumeVideoHearingAsync(Guid conferenceId)
        {
            var validatedRequest = await ValidateUserIsJudgeAndInConference(conferenceId);
            if (validatedRequest != null)
            {
                return validatedRequest;
            }
            try
            {
                await _videoApiClient.StartOrResumeVideoHearingAsync(conferenceId);
                return Accepted();
            }
            catch (VideoApiException ex)
            {
                _logger.LogError(ex, $"Unable to start video hearing {conferenceId}");
                return StatusCode(ex.StatusCode, ex.Response);
            }
        }
        
        /// <summary>
        /// Pause a video hearing
        /// </summary>
        /// <param name="conferenceId">conference id</param>
        /// <returns>No Content status</returns>
        [HttpPost("{conferenceId}/pause")]
        [SwaggerOperation(OperationId = "PauseVideoHearing")]
        [ProducesResponseType((int)HttpStatusCode.Accepted)]
        public async Task<IActionResult> PauseVideoHearingAsync(Guid conferenceId)
        {
            var validatedRequest = await ValidateUserIsJudgeAndInConference(conferenceId);
            if (validatedRequest != null)
            {
                return validatedRequest;
            }
            try
            {
                await _videoApiClient.PauseVideoHearingAsync(conferenceId);
                return Accepted();
            }
            catch (VideoApiException ex)
            {
                _logger.LogError(ex, $"Unable to pause video hearing {conferenceId}");
                return StatusCode(ex.StatusCode, ex.Response);
            }
        }
        
        /// <summary>
        /// End a video hearing
        /// </summary>
        /// <param name="conferenceId">conference id</param>
        /// <returns>No Content status</returns>
        [HttpPost("{conferenceId}/end")]
        [SwaggerOperation(OperationId = "EndVideoHearing")]
        [ProducesResponseType((int)HttpStatusCode.Accepted)]
        public async Task<IActionResult> EndVideoHearingAsync(Guid conferenceId)
        {
            var validatedRequest = await ValidateUserIsJudgeAndInConference(conferenceId);
            if (validatedRequest != null)
            {
                return validatedRequest;
            }
            try
            {
                await _videoApiClient.EndVideoHearingAsync(conferenceId);
                return Accepted();
            }
            catch (VideoApiException ex)
            {
                _logger.LogError(ex, $"Unable to end video hearing {conferenceId}");
                return StatusCode(ex.StatusCode, ex.Response);
            }
        }
        
        /// <summary>
        /// Request technical assistance (suspend a hearing)
        /// </summary>
        /// <param name="conferenceId">conference id</param>
        /// <returns>No Content status</returns>
        [HttpPost("{conferenceId}/technicalassistance")]
        [SwaggerOperation(OperationId = "RequestTechnicalAssistance")]
        [ProducesResponseType((int)HttpStatusCode.Accepted)]
        public async Task<IActionResult> RequestTechnicalAssistanceAsync(Guid conferenceId)
        {
            var validatedRequest = await ValidateUserIsJudgeAndInConference(conferenceId);
            if (validatedRequest != null)
            {
                return validatedRequest;
            }
            try
            {
                await _videoApiClient.RequestTechnicalAssistanceAsync(conferenceId);
                return Accepted();
            }
            catch (VideoApiException ex)
            {
                _logger.LogError(ex, $"Unable to request technical assistance for video hearing {conferenceId}");
                return StatusCode(ex.StatusCode, ex.Response);
            }
        }

        private async Task<IActionResult> ValidateUserIsJudgeAndInConference(Guid conferenceId)
        {
            if (await IsConferenceJudge(conferenceId)) return null;
            _logger.LogWarning("Only judges may control hearings");
            return Unauthorized("User must be a Judge");

        }
        
        private async Task<bool> IsConferenceJudge(Guid conferenceId)
        {
            var conference = await _conferenceCache.GetOrAddConferenceAsync
            (
                conferenceId,
                () => _videoApiClient.GetConferenceDetailsByIdAsync(conferenceId)
            );

            return conference.GetJudge().Username
                .Equals(User.Identity.Name?.Trim(), StringComparison.InvariantCultureIgnoreCase);
        }
    }
}
