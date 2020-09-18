using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Common.Models;
using VideoWeb.Services.Video;

namespace VideoWeb.Controllers
{
    [Produces("application/json")]
    [ApiController]
    [Route("hearing-venues")]
    [Authorize(AppRoles.VhOfficerRole)]
    public class VenuesController : Controller
    {
        private readonly IVideoApiClient _videoApiClient;
        private readonly ILogger<VenuesController> _logger;

        public VenuesController(IVideoApiClient videoApiClient, ILogger<VenuesController> logger)
        {
            _videoApiClient = videoApiClient;
            _logger = logger;
        }

        /// <summary>
        /// Get Judge names
        /// </summary>
        /// <returns>List of judges with hearing scheduled, if any</returns>
        [HttpGet]
        [ProducesResponseType(typeof(JudgeNameListResponse), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        [SwaggerOperation(OperationId = "GetDistinctJudgeNames")]
        public async Task<ActionResult<JudgeNameListResponse>> GetDistinctJudgeNamesAsync()
        {
            _logger.LogDebug("GetDistinctJudgeNames");
            try
            {
                var judges = await _videoApiClient.GetDistinctJudgeNamesAsync();
                return Ok(judges);
            }
            catch (VideoApiException e)
            {
                _logger.LogError(e, "Unable to retrieve judge names");
                return NotFound();
            }
        }
    }
}
