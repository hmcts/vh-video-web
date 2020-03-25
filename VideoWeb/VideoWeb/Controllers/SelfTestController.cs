using System.Net;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings;
using VideoWeb.Services.Video;

namespace VideoWeb.Controllers
{
    [Produces("application/json")]
    [ApiController]
    [Route("selftest")]
    public class SelfTestController : Controller
    {
        private readonly IVideoApiClient _videoApiClient;
        private readonly ILogger<SelfTestController> _logger;
        public SelfTestController(IVideoApiClient videoApiClient, ILogger<SelfTestController> logger)
        {
            _videoApiClient = videoApiClient;
            _logger = logger;
        }

        /// <summary>
        /// Get the Pexip self test node.
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        [ProducesResponseType(typeof(SelfTestPexipResponse), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        [SwaggerOperation(OperationId = "GetPexipConfig")]
        public ActionResult<SelfTestPexipResponse> GetPexipConfig()
        {
            try
            {
                _logger.LogDebug("GetPexipNodeForIndependentSelfTest");
                var config = _videoApiClient.GetPexipServicesConfiguration();
                var response = PexipServiceConfigurationResponseMapper.MapConfigToResponseModel(config);
                return Ok(response);
            }
            catch (VideoApiException e)
            {
                return StatusCode(e.StatusCode, e.Response);
            }
        }
    }
}