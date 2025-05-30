using System;
using System.Net;
using System.Threading;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Contract.Responses;
using VideoApi.Client;
using VideoApi.Contract.Responses;
using System.Threading.Tasks;
using VideoWeb.Common.Caching;
using VideoWeb.Mappings;
using VideoWeb.Middleware;

namespace VideoWeb.Controllers
{
    [Produces("application/json")]
    [ApiController]
    [Route("selftest")]
    public class SelfTestController(
        IVideoApiClient videoApiClient,
        ILogger<SelfTestController> logger,
        ITestCallCache testCallCache)
        : ControllerBase
    {
        /// <summary>
        /// Get the Pexip self test node.
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        [ProducesResponseType(typeof(SelfTestPexipResponse), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        [SwaggerOperation(OperationId = "GetPexipConfig")]
        public async Task<ActionResult<SelfTestPexipResponse>> GetPexipConfig()
        {
            try
            {
                var config = await videoApiClient.GetPexipServicesConfigurationAsync();
                var response = PexipServiceConfigurationResponseMapper.Map(config);
                
                return Ok(response);
            }
            catch (VideoApiException e)
            {
                logger.LogError(e, "Unable to get Pexip configuration");
                return StatusCode(e.StatusCode, e.Response);
            }
        }
        
        /// <summary>
        /// Check if a user has completed a test call at least once today
        /// </summary>
        /// <returns>OK if a test has been completed at least once, else not found</returns>
        [HttpGet("today")]
        [SwaggerOperation(OperationId = "CheckUserCompletedATestToday")]
        [ProducesResponseType(typeof(bool), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> CheckUserCompletedATestTodayAsync() 
            => Ok(await testCallCache.HasUserCompletedATestToday(User.Identity?.Name));


        [ServiceFilter(typeof(CheckParticipantCanAccessConferenceAttribute))]
        [HttpGet]
        [Route("conferences/{conferenceId}/participants/{participantId}/selftestresult")]
        [SwaggerOperation(OperationId = "GetTestCallResult")]
        [ProducesResponseType(typeof(TestCallScoreResponse), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        public async Task<IActionResult> GetTestCallResultForParticipantAsync(Guid conferenceId, Guid participantId,
            CancellationToken cancellationToken)
        {
            var score = await videoApiClient.GetTestCallResultForParticipantAsync(conferenceId, participantId,
                cancellationToken);
            await testCallCache.AddTestCompletedForTodayAsync(User.Identity?.Name, cancellationToken);
            return Ok(score);
        }

        [HttpGet("independentselftestresult/{participantId}")]
        [SwaggerOperation(OperationId = "GetIndependentTestCallResult")]
        [ProducesResponseType(typeof(TestCallScoreResponse), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        public async Task<IActionResult> GetIndependentTestCallResultAsync(Guid participantId,
            CancellationToken cancellationToken)
        {
            var score = await videoApiClient.GetIndependentTestCallResultAsync(participantId, cancellationToken);
            await testCallCache.AddTestCompletedForTodayAsync(User.Identity?.Name, cancellationToken);
            return Ok(score);
        }
    }
}
