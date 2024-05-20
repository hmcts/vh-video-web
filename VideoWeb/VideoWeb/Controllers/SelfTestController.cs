using System;
using System.Net;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings;
using VideoApi.Client;
using VideoApi.Contract.Responses;
using System.Threading.Tasks;
using VideoWeb.Common.Caching;
using VideoWeb.Middleware;

namespace VideoWeb.Controllers
{
    [Produces("application/json")]
    [ApiController]
    [Route("selftest")]
    public class SelfTestController : ControllerBase
    {
        private readonly IVideoApiClient _videoApiClient;
        private readonly ITestCallCache _testCallCache;
        private readonly ILogger<SelfTestController> _logger;
        private readonly IMapperFactory _mapperFactory;

        public SelfTestController(IVideoApiClient videoApiClient, ILogger<SelfTestController> logger, IMapperFactory mapperFactory, ITestCallCache testCallCache)
        {
            _videoApiClient = videoApiClient;
            _logger = logger;
            _mapperFactory = mapperFactory;
            _testCallCache = testCallCache;
        }

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
                var config = await _videoApiClient.GetPexipServicesConfigurationAsync();
                var selfTestPexipResponseMapper = _mapperFactory.Get<PexipConfigResponse, SelfTestPexipResponse>();
                var response = selfTestPexipResponseMapper.Map(config);
                
                return Ok(response);
            }
            catch (VideoApiException e)
            {
                _logger.LogError(e, $"Unable to get Pexip configuration");
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
            var hasUserCompletedATestToday = await _testCallCache.HasUserCompletedATestToday(User.Identity.Name);
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
                var score = await _videoApiClient.GetTestCallResultForParticipantAsync(conferenceId, participantId);
                await _testCallCache.AddTestCompletedForTodayAsync(User.Identity.Name);
                return Ok(score);
            }
            catch (VideoApiException e)
            {
                _logger.LogError(e,
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
                var score = await _videoApiClient.GetIndependentTestCallResultAsync(participantId);
                await _testCallCache.AddTestCompletedForTodayAsync(User.Identity.Name);
                return Ok(score);
            }
            catch (VideoApiException e)
            {
                _logger.LogError(e, "Unable to get independent test call result for participant: {ParticipantId}", participantId);
                return StatusCode(e.StatusCode, e.Response);
            }
        }
    }
}
