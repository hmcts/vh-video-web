using BookingsApi.Client;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System.Net;
using System.Threading.Tasks;

namespace VideoWeb.Controllers
{
    [Produces("application/json")]
    [Route("feature-flag")]
    [ApiController]
    public class FeatureFlagController : Controller
    {
        private readonly IBookingsApiClient _bookingsApiClient;

        /// <summary>
        /// Instantiates the controller
        /// </summary>
        public FeatureFlagController(IBookingsApiClient bookingsApiClient)
        {
            _bookingsApiClient = bookingsApiClient;
        }

        /// <summary>
        /// returns the FeatureToggles
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        [AllowAnonymous]
        [SwaggerOperation(OperationId = "GetFeatureFlag")]
        [ProducesResponseType(typeof(bool), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public async Task<ActionResult<bool>> GetFeatureFlag([FromQuery] string featureName)
        {
            return  await _bookingsApiClient.GetFeatureFlagAsync(featureName);
        }
    }
}
