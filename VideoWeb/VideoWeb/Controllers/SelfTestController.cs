using System.Net;
using Microsoft.AspNetCore.Mvc;
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
        private readonly IMapTo<SelfTestPexipResponse, PexipConfigResponse> _selfTestPexipResponseMapper;
        public SelfTestController(
            IVideoApiClient videoApiClient,
            IMapTo<SelfTestPexipResponse, PexipConfigResponse> selfTestPexipResponseMapper)
        {
            _videoApiClient = videoApiClient;   
            _selfTestPexipResponseMapper = selfTestPexipResponseMapper;
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
                var response = _selfTestPexipResponseMapper.Map(config);
                return Ok(response);
            }
            catch (VideoApiException e)
            {
                return StatusCode(e.StatusCode, e.Response);
            }
        }
    }
}
