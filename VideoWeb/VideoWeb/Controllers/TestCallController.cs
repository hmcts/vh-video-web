using System;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using VideoApi.Client;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Caching;
using VideoWeb.Middleware;

namespace VideoWeb.Controllers
{
    [ApiController]
    [Route("conferences")]
    public class TestCallController : ControllerBase
    {
        private readonly IVideoApiClient _videoApiClient;
        private readonly ITestCallCache _testCallCache;
        private readonly ILogger<TestCallController> _logger;

        public TestCallController(IVideoApiClient videoApiClient, ITestCallCache testCallCache, ILogger<TestCallController> logger)
        {
            _videoApiClient = videoApiClient;
            _testCallCache = testCallCache;
            _logger = logger;
        }

        [ServiceFilter(typeof(CheckParticipantCanAccessConferenceAttribute))]
        [HttpGet("{conferenceId}/participants/{participantId}/selftestresult")]
        [SwaggerOperation(OperationId = "GetTestCallResult")]
        [ProducesResponseType(typeof(TestCallScoreResponse), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        public async Task<IActionResult> GetTestCallResultForParticipantAsync(Guid conferenceId, Guid participantId)
        {
            try
            {
                var score = await _videoApiClient.GetTestCallResultForParticipantAsync(conferenceId, participantId);
                await _testCallCache.AddTestCompletedForTodayAsync(User.Identity.Name);
                return Ok(score);
            }
            catch (VideoApiException e)
            {
                _logger.LogError(e, $"Unable to get test call result for " +
                                    $"participant: {participantId} in conference: {conferenceId}");
                return StatusCode(e.StatusCode, e.Response);
            }
        }
        
        [HttpGet("independentselftestresult")]
        [SwaggerOperation(OperationId = "GetIndependentTestCallResult")]
        [ProducesResponseType(typeof(TestCallScoreResponse), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        public async Task<IActionResult> GetIndependentTestCallResultAsync(Guid participantId)
        {
            try
            {
                var score = await _videoApiClient.GetIndependentTestCallResultAsync(participantId);
                await _testCallCache.AddTestCompletedForTodayAsync(User.Identity.Name);
                return Ok(score);
            }
            catch (VideoApiException e)
            {
                _logger.LogError(e, $"Unable to get independent test call result for participant: {participantId}");
                return StatusCode(e.StatusCode, e.Response);
            }
        }
        
        
        /// <summary>
        /// Check if a user has completed a test call at least once today
        /// </summary>
        /// <returns>OK if a test has been completed at least once, else not found</returns>
        [HttpGet]
        [Route("testcall/today")]
        [SwaggerOperation(OperationId = "CheckUserCompletedATestToday")]
        [ProducesResponseType((int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        public async Task<IActionResult> CheckUserCompletedATestTodayAsync()
        {
            var hasUserCompletedATestToday = await _testCallCache.HasUserCompletedATestToday(User.Identity.Name);
            return hasUserCompletedATestToday ? Ok() : NotFound();
        }

    }
}
