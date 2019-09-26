using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Contract.Responses;
using VideoWeb.Services.Video;

namespace VideoWeb.Controllers
{
    [Produces("application/json")]
    [ApiController]
    [Route("selftest")]
    public class SelfTestController : Controller
    {
        private readonly IVideoApiClient _videoApiClient;
        public SelfTestController(IVideoApiClient videoApiClient)
        {
            _videoApiClient = videoApiClient;
        }

        /// <summary>
        /// Get the Pexip self test node.
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        [ProducesResponseType(typeof(SelfTestPexipResponse), (int)HttpStatusCode.OK)]
        [SwaggerOperation(OperationId = "GetPexipConfig")]
        public ActionResult<SelfTestPexipResponse> GetPexipConfig()
        {
            var response = _videoApiClient.GetPexipServicesConfiguration();
            return Ok(response);
        }
    }
}