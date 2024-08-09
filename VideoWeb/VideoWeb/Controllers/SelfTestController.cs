using System;
using System.Net;
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
        [ProducesResponseType((int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        public async Task<IActionResult> CheckUserCompletedATestTodayAsync()
        {
            var hasUserCompletedATestToday = await testCallCache.HasUserCompletedATestToday(User.Identity.Name);
            return hasUserCompletedATestToday ? Ok() : NotFound();
        }
        
        [ServiceFilter(typeof(CheckParticipantCanAccessConferenceAttribute))]
        [HttpGet]
        [Route("conferences/{conferenceId}/participants/{participantId}/selftestresult")]
        [SwaggerOperation(OperationId = "GetTestCallResult")]
        [ProducesResponseType(typeof(TestCallScoreResponse), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        public async Task<IActionResult> GetTestCallResultForParticipantAsync(Guid conferenceId, Guid participantId)
        {
            try
            {
                var score = await videoApiClient.GetTestCallResultForParticipantAsync(conferenceId, participantId);
                await testCallCache.AddTestCompletedForTodayAsync(User.Identity.Name);
                return Ok(score);
            }
            catch (VideoApiException e)
            {
                logger.LogError(e,
                    "Unable to get test call result for participant: {ParticipantId} in conference: {ConferenceId}",
                    participantId, conferenceId);
                return StatusCode(e.StatusCode, e.Response);
            }
        }
        
        [HttpGet("independentselftestresult/{participantId}")]
        [SwaggerOperation(OperationId = "GetIndependentTestCallResult")]
        [ProducesResponseType(typeof(TestCallScoreResponse), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        public async Task<IActionResult> GetIndependentTestCallResultAsync(Guid participantId)
        {
            try
            {
                var score = await videoApiClient.GetIndependentTestCallResultAsync(participantId);
                await testCallCache.AddTestCompletedForTodayAsync(User.Identity.Name);
                return Ok(score);
            }
            catch (VideoApiException e)
            {
                logger.LogError(e, "Unable to get independent test call result for participant: {ParticipantId}", participantId);
                return StatusCode(e.StatusCode, e.Response);
            }
        }
    }
}
