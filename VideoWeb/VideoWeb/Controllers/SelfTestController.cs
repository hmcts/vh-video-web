using System.Net;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings;
using VideoApi.Client;
using VideoApi.Contract.Responses;

namespace VideoWeb.Controllers
{
    [Produces("application/json")]
    [ApiController]
    [Route("selftest")]
    public class SelfTestController : Controller
    {
        private readonly IVideoApiClient _videoApiClient;
        private readonly ILogger<SelfTestController> _logger;
        private readonly IMapperFactory _mapperFactory;

        public SelfTestController(IVideoApiClient videoApiClient, ILogger<SelfTestController> logger, IMapperFactory mapperFactory)
        {
            _videoApiClient = videoApiClient;
            _logger = logger;
            _mapperFactory = mapperFactory;
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
                var config = _videoApiClient.GetPexipServicesConfiguration();
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
    }
}
