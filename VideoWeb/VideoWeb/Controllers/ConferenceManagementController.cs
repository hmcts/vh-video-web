using System;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Extensions;
using VideoWeb.Common.Models;
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
            if (!IsJudge())
            {
                _logger.LogWarning("Only judges may control hearings");
                return Unauthorized("User must be a Judge");
            }
            
            if (!await IsConferenceJudge(conferenceId))
            {
                _logger.LogWarning("Only judges may control hearings");
                return Unauthorized("User must be a Judge");
            }
            try
            {
                await _videoApiClient.StartOrResumeVideoHearingAsync(conferenceId);
                return Accepted();
            }
            catch (VideoApiException ex)
            {
                _logger.LogError(ex, $"Unable to find start video hearing {conferenceId}");
                return StatusCode(ex.StatusCode, ex.Response);
            }
        }

        private bool IsJudge()
        {
            return User.IsInRole(Role.Judge.EnumDataMemberAttr());
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
